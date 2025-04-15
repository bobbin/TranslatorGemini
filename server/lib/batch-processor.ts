import { storage } from '../storage';
import { checkBatchStatus, getBatchResults } from './openai-batch';
import { reconstructEpub } from './epub-handler';
import { reconstructPdf } from './pdf-handler';
import { uploadFileToS3, getFileFromS3 } from './s3-service';

// Intervalo de verificación (2 minutos = 120000 ms)
const CHECK_INTERVAL = 120000;

// Mapa para almacenar los timers activos
const activeTimers = new Map<number, NodeJS.Timeout>();

/**
 * Inicia el procesamiento por lotes para una traducción
 * @param translationId ID de la traducción
 * @param batchId ID del trabajo por lotes de OpenAI
 */
export function startBatchProcessing(translationId: number, batchId: string): void {
  console.log(`[Batch Processor] Starting batch processing for translation ${translationId} with batch ID ${batchId}`);
  
  // Actualizar la traducción con el ID del lote y establecer el estado como "batch_processing"
  storage.updateTranslation(translationId, {
    batchId,
    status: 'batch_processing',
    progress: 40,
    lastChecked: new Date()
  }).then(() => {
    console.log(`[Batch Processor] Translation ${translationId} updated with batch ID ${batchId}`);
    
    // Ejecutar la primera verificación inmediatamente
    checkBatchProgress(translationId);
    
    // Programar las siguientes verificaciones
    const timerId = setInterval(() => checkBatchProgress(translationId), CHECK_INTERVAL);
    activeTimers.set(translationId, timerId);
  });
}

/**
 * Verifica el progreso de un trabajo por lotes
 * @param translationId ID de la traducción
 */
async function checkBatchProgress(translationId: number): Promise<void> {
  try {
    console.log(`[Batch Processor] Checking batch progress for translation ${translationId}`);
    
    // Obtener la traducción actual
    const translation = await storage.getTranslation(translationId);
    if (!translation) {
      console.error(`[Batch Processor] Translation ${translationId} not found`);
      stopBatchProcessing(translationId);
      return;
    }
    
    // Si la traducción ya no está en estado "batch_processing", detener la verificación
    if (translation.status !== 'batch_processing') {
      console.log(`[Batch Processor] Translation ${translationId} is no longer in batch_processing state (${translation.status})`);
      stopBatchProcessing(translationId);
      return;
    }
    
    // Si no hay ID de lote, detener la verificación y marcar como fallido
    if (!translation.batchId) {
      console.error(`[Batch Processor] Translation ${translationId} has no batch ID`);
      await storage.updateTranslation(translationId, {
        status: 'failed',
        error: 'Missing batch ID'
      });
      stopBatchProcessing(translationId);
      return;
    }
    
    // Verificar el estado del lote
    const batchState = await checkBatchStatus(translation.batchId);
    
    // Actualizar el timestamp de última verificación
    await storage.updateTranslation(translationId, {
      lastChecked: new Date()
    });
    
    console.log(`[Batch Processor] Batch ${translation.batchId} status: ${batchState.batchStatus}`);
    
    if (batchState.batchStatus === 'completed') {
      console.log(`[Batch Processor] Batch ${translation.batchId} completed! Processing results...`);
      
      // El lote se ha completado, procesar los resultados
      await processBatchResults(translation.id, translation.batchId);
      console.log(`[Batch Processor] Successfully processed batch results for translation ${translationId}`);
      
      stopBatchProcessing(translationId);
    } else if (batchState.batchStatus === 'failed') {
      // El lote ha fallado, actualizar la traducción
      await storage.updateTranslation(translationId, {
        status: 'failed',
        error: batchState.error || 'Batch processing failed'
      });
      stopBatchProcessing(translationId);
    } else {
      // El lote sigue en progreso, programar la siguiente verificación
      // Calcular el progreso basado en la información del lote
      let progress = 40; // Base progress cuando comienza el procesamiento por lotes
      
      // Si tenemos información de progreso del lote desde openai-batch.ts, usarla
      if (batchState && typeof batchState.progress === 'number') {
        // Escalar el progreso entre 40-70% durante la fase de procesamiento por lotes
        // El progreso de la API es de 0-100%, lo convertimos a nuestra escala
        progress = 40 + Math.floor(batchState.progress * 0.3);
        console.log(`[Batch Processor] Using OpenAI reported progress: ${batchState.progress}%, scaled to: ${progress}%`);
      } else {
        // Si no hay progreso específico, usar el tiempo transcurrido como estimación
        const currentTime = new Date();
        const startTime = translation.lastChecked || new Date(translation.createdAt);
        const minutesElapsed = Math.max(0, (currentTime.getTime() - startTime.getTime()) / 60000);
        
        // Estimamos que el proceso toma aproximadamente 30 minutos, limitamos al 30% de progreso en nuestra escala
        const timeBasedProgress = Math.min(30, minutesElapsed);
        progress = 40 + Math.floor(timeBasedProgress);
        console.log(`[Batch Processor] Using time-based progress estimate: ${progress}% (${minutesElapsed.toFixed(1)} minutes elapsed)`);
      }
      
      await storage.updateTranslation(translationId, {
        progress
      });
      
      // Programar la siguiente verificación
      const timerId = setTimeout(() => checkBatchProgress(translationId), CHECK_INTERVAL);
      activeTimers.set(translationId, timerId);
    }
  } catch (error: any) {
    console.error(`[Batch Processor] Error checking batch progress for translation ${translationId}:`, error);
    
    // Actualizar la traducción con el error
    try {
      await storage.updateTranslation(translationId, {
        error: `Error checking batch progress: ${error.message}`
      });
    } catch (storageError) {
      console.error(`[Batch Processor] Error updating translation ${translationId} with error:`, storageError);
    }
    
    // Contador de reintentos
    // Obtener la traducción actual de nuevo para acceder a sus metadatos
    try {
      const currentTranslation = await storage.getTranslation(translationId);
      if (!currentTranslation) {
        console.error(`[Batch Processor] Translation ${translationId} not found when attempting retry`);
        return;
      }
      
      // Usar los metadatos existentes o inicializar nuevos
      const metadata = currentTranslation.metadata || {};
      // Convertimos metadata a un objeto si no lo es
      const metadataObj = typeof metadata === 'object' ? metadata : {};
      const retryCount = ((metadataObj as any).retryCount || 0) + 1;
      const maxRetries = 5; // Máximo número de reintentos
      
      if (retryCount <= maxRetries) {
        console.log(`[Batch Processor] Retry attempt ${retryCount}/${maxRetries} for translation ${translationId}`);
        
        // Actualizar el contador de reintentos en los metadatos
        await storage.updateTranslation(translationId, {
          error: `Error checking batch status (attempt ${retryCount}): ${error.message}`,
          metadata: { 
            ...metadataObj,
            retryCount,
            lastError: error.message
          }
        });
        
        // Programar la siguiente verificación con un intervalo exponencial
        const retryInterval = Math.min(CHECK_INTERVAL * Math.pow(2, retryCount - 1), 1800000); // Máximo 30 minutos
        console.log(`[Batch Processor] Next retry in ${retryInterval/60000} minutes`);
        
        const nextTimerId = setTimeout(() => checkBatchProgress(translationId), retryInterval);
        activeTimers.set(translationId, nextTimerId);
      } else {
        console.error(`[Batch Processor] Maximum retry attempts (${maxRetries}) reached for translation ${translationId}, marking as failed`);
        
        // Marcar como fallido después de muchos intentos
        await storage.updateTranslation(translationId, {
          status: 'failed',
          error: `Multiple errors checking batch status: ${error.message}. Max retries reached.`,
          metadata: { 
            ...metadataObj,
            retryCount,
            lastError: error.message,
            failedAt: new Date().toISOString()
          }
        });
        
        // Detener el procesamiento
        stopBatchProcessing(translationId);
      }
    } catch (retryError) {
      console.error(`[Batch Processor] Error handling retries for translation ${translationId}:`, retryError);
      
      // En caso de error manejando los reintentos, programar una verificación simple
      const fallbackTimerId = setTimeout(() => checkBatchProgress(translationId), CHECK_INTERVAL);
      activeTimers.set(translationId, fallbackTimerId);
    }
  }
}

/**
 * Detiene el procesamiento por lotes para una traducción
 * @param translationId ID de la traducción
 */
function stopBatchProcessing(translationId: number): void {
  const timerId = activeTimers.get(translationId);
  if (timerId) {
    clearInterval(timerId);
    activeTimers.delete(translationId);
    console.log(`[Batch Processor] Stopped batch processing for translation ${translationId}`);
  }
}

/**
 * Procesa los resultados de un trabajo por lotes completado
 * @param translationId ID de la traducción
 * @param batchId ID del trabajo por lotes
 */
async function processBatchResults(translationId: number, batchId: string): Promise<void> {
  try {
    console.log(`[Batch Processor] Processing batch results for translation ${translationId}`);
    
    // Obtener la traducción actual
    const translation = await storage.getTranslation(translationId);
    if (!translation) {
      throw new Error(`Translation ${translationId} not found`);
    }
    
    // Obtener los resultados del lote
    const translatedChapters = getBatchResults(batchId);
    if (!translatedChapters) {
      throw new Error(`No batch results found for batch ${batchId}`);
    }
    
    // Verificación adicional para asegurar que tenemos suficientes capítulos
    if (translatedChapters.length === 0) {
      throw new Error(`Batch ${batchId} returned 0 translated chapters`);
    }
    
    console.log(`[Batch Processor] Retrieved ${translatedChapters.length} translated chapters for translation ${translationId}`);
    
    // Actualizar a estado "reconstructing"
    await storage.updateTranslation(translationId, {
      status: 'reconstructing',
      progress: 80
    });
    
    // Obtener el buffer del archivo original desde S3
    if (!translation.originalS3Key) {
      throw new Error('Original S3 key not found');
    }
    
    const originalFileBuffer = await getFileFromS3(translation.originalS3Key);
    
    // Reconstruir el archivo traducido según el tipo
    let translatedContent: Buffer;
    if (translation.fileType === 'epub') {
      translatedContent = await reconstructEpub(originalFileBuffer, translatedChapters);
    } else if (translation.fileType === 'pdf') {
      // Esta parte requiere adaptar la interfaz de reconstructPdf para que acepte el formato de salida del lote
      // Por ahora es un placeholder
      const adaptedTranslatedPages = translatedChapters.map(chapter => ({
        pageNum: parseInt(chapter.id.replace('chapter-', ''), 10),
        translatedText: chapter.translatedHtml
      }));
      translatedContent = await reconstructPdf(originalFileBuffer, adaptedTranslatedPages);
    } else {
      throw new Error(`Unsupported file type: ${translation.fileType}`);
    }
    
    // Subir el archivo traducido a S3
    const translatedFileName = `translated-${translation.fileName}`;
    const mimeType = translation.fileType === 'epub' ? 'application/epub+zip' : 'application/pdf';
    const translatedS3Key = await uploadFileToS3(
      translatedContent,
      translation.userId,
      translatedFileName,
      mimeType
    );
    
    // Actualizar la traducción como completada
    await storage.updateTranslation(translationId, {
      status: 'completed',
      progress: 100,
      translatedS3Key,
      completedPages: translation.totalPages || 0
    });
    
    console.log(`[Batch Processor] Translation ${translationId} completed successfully`);
  } catch (error: any) {
    console.error(`[Batch Processor] Error processing batch results for translation ${translationId}:`, error);
    
    // Actualizar la traducción con el error
    try {
      await storage.updateTranslation(translationId, {
        status: 'failed',
        error: `Error processing batch results: ${error.message}`
      });
    } catch (storageError) {
      console.error(`[Batch Processor] Error updating translation ${translationId} with error:`, storageError);
    }
  }
}

