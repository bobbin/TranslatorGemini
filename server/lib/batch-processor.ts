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
    
    // Programar la primera verificación
    const timerId = setTimeout(() => checkBatchProgress(translationId), CHECK_INTERVAL);
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
      // El lote se ha completado, procesar los resultados
      await processBatchResults(translation.id, translation.batchId);
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
      // Calcular el progreso basado en la información del lote (si está disponible)
      // Por ahora simplemente usamos un valor fijo entre 40 y 70
      const progress = 40 + Math.floor(Math.random() * 30); // Temporal, mejorar con información real del lote
      
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
    
    // Programar la siguiente verificación (incluso si hay errores, seguimos intentando)
    const timerId = setTimeout(() => checkBatchProgress(translationId), CHECK_INTERVAL);
    activeTimers.set(translationId, timerId);
  }
}

/**
 * Detiene el procesamiento por lotes para una traducción
 * @param translationId ID de la traducción
 */
function stopBatchProcessing(translationId: number): void {
  const timerId = activeTimers.get(translationId);
  if (timerId) {
    clearTimeout(timerId);
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

