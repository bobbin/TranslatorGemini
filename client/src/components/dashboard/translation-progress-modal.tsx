import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Translation, TranslationStatus } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, BookOpen, X, Languages, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define una interfaz para los metadatos de la traducción
interface TranslationMetadata {
  retryCount?: number;
  lastError?: string;
  retryBackoffMs?: number;
  [key: string]: any; // Permite campos adicionales
}

interface TranslationProgressModalProps {
  translationId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TranslationProgressModal({ 
  translationId, 
  isOpen, 
  onClose 
}: TranslationProgressModalProps) {
  const [pollingInterval, setPollingInterval] = useState(1000);

  // Query to get translation status with polling
  const translationQuery = useQuery<Translation>({
    queryKey: ['/api/translations', translationId],
    enabled: isOpen && !!translationId && translationId !== -1,
    refetchInterval: (data: any) => {
      if (!data) return pollingInterval;
      
      // Convertir explícitamente el dato a Translation para evitar problemas de tipado
      const translationData = data as Translation;
      
      // Detener polling cuando la traducción está completada o falló
      if (translationData.status === 'completed' || translationData.status === 'failed') {
        return false;
      }
      
      // Para procesamiento por lotes, reducimos la frecuencia de polling
      if (translationData.status === 'batch_processing') {
        return 30000; // Consultar cada 30 segundos
      }
      
      // Para procesamiento directo, mantenemos polling frecuente
      if (translationData.status === 'direct_processing') {
        return 2000; // Consultar cada 2 segundos
      }
      
      return pollingInterval;
    },
  });
  
  // Aplicar un cast explícito para evitar errores de tipado
  const translation = translationQuery.data as Translation | undefined;
  const isLoading = translationQuery.isLoading;
  
  // Define la interfaz para el estado del batch
  interface BatchStatus {
    status: string;
    progress?: number;
    error?: string;
    batchStatus?: string;
    createdAt?: string;
    lastChecked?: string;
    completedAt?: string;
    chapterCount?: number;
    translatedCount?: number;
    sourceLanguage?: string;
    targetLanguage?: string;
    processingTimeMs?: number;
    eta?: string;
  }
  
  // Query específica para obtener información del estado del lote si estamos en modo batch_processing
  const { data: batchStatus } = useQuery<BatchStatus>({
    queryKey: ['/api/translations', translationId, 'batch-status'],
    enabled: isOpen && !!translationId && translation?.status === 'batch_processing',
    refetchInterval: 30000, // Consultar cada 30 segundos
  });

  useEffect(() => {
    // When translation completes, slow down polling
    if (translation?.status === 'completed' || translation?.status === 'failed') {
      setPollingInterval(false as any);
    } else if (translation?.status === 'batch_processing') {
      setPollingInterval(30000);
    } else {
      setPollingInterval(1000);
    }
  }, [translation?.status]);

  if (!isOpen) return null;

  // Special loading state when translationId is -1 (temporary ID)
  const isCreating = translationId === -1;
  
  // Render a special creating state
  if (isCreating) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Starting Translation</DialogTitle>
            <DialogDescription>
              We're setting up your translation job...
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-center text-gray-600">Uploading your file and preparing the translation process...</p>
          </div>
          
          <DialogFooter className="flex justify-end space-x-2">
            <Button onClick={onClose}>
              Hide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const getStepStatus = (step: string): 'pending' | 'in-progress' | 'completed' | 'failed' => {
    if (!translation) return 'pending';
    if (translation.status === 'failed') return 'failed';

    const statusOrder: Translation['status'][] = [
      'pending', 
      'extracting', 
      'translating', 
      'batch_processing', 
      'direct_processing', 
      'reconstructing', 
      'completed'
    ];
    const currentStatusIndex = statusOrder.indexOf(translation.status);

    switch (step) {
      case 'upload':
        return 'completed'; // Upload is always done when this modal shows
      case 'extraction':
        if (currentStatusIndex >= statusOrder.indexOf('extracting')) {
          return currentStatusIndex > statusOrder.indexOf('extracting') ? 'completed' : 'in-progress';
        }
        return 'pending';
      case 'translation':
        // Tratar 'batch_processing' y 'direct_processing' como parte de la fase de traducción
        if (translation.status === 'batch_processing' || translation.status === 'direct_processing') {
          return 'in-progress';
        }
        if (currentStatusIndex >= statusOrder.indexOf('translating')) {
          return currentStatusIndex > statusOrder.indexOf('translating') ? 'completed' : 'in-progress';
        }
        return 'pending';
      case 'reconstruction':
         if (currentStatusIndex >= statusOrder.indexOf('reconstructing')) {
          return currentStatusIndex > statusOrder.indexOf('reconstructing') ? 'completed' : 'in-progress';
        }
        return 'pending';
      default:
        return 'pending';
    }
  };

  const getStepProgress = (step: string): number => {
    if (!translation) return 0;

    const stepStatus = getStepStatus(step);

    if (stepStatus === 'completed') return 100;
    if (stepStatus === 'pending') return 0;
    if (stepStatus === 'failed') return 0; // Or maybe 100 if you want to show the bar full red?

    // Handle 'in-progress' states
    switch (step) {
      case 'upload':
        return 100; // Should already be 'completed'
      case 'extraction':
         // Give some progress indication for extraction, maybe 50%?
         // Could be refined if backend provided more granular progress for extraction
        return 50; 
      case 'translation':
        // Use the detailed progress calculation
        if (translation.status === 'translating' || 
            translation.status === 'batch_processing' || 
            translation.status === 'direct_processing') {
          
          // Para procesamiento por lotes, usamos directamente el valor de progress
          // ya que se actualiza periódicamente desde el backend durante la verificación de estado
          if (translation.status === 'batch_processing') {
            // El progreso se escala entre 40-70% durante el procesamiento por lotes
            const scaledProgress = (translation.progress - 40) * (100 / 30);
            return Math.max(0, Math.min(100, scaledProgress)); // Limitamos entre 0-100
          }
          
          // Para la traducción directa, calculamos basado en páginas
          if (translation.status === 'direct_processing' || translation.status === 'translating') {
            if (!translation.totalPages || translation.totalPages === 0) return 50; // Default if pages unknown
            return Math.round(((translation.completedPages || 0) / translation.totalPages) * 100);
          }
        }
        return 0; 
      case 'reconstruction':
        // Give some progress indication for reconstruction, maybe 50%?
        // Could be refined if backend provided more granular progress for reconstruction
        return 50;
      default:
        return 0;
    }
  };

  const getStepIcon = (step: string, status: string) => {
    const baseClasses = "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white";
    
    switch (status) {
      case 'completed':
        return <div className={`${baseClasses} bg-green-500`}><CheckCircle className="h-5 w-5" /></div>;
      case 'in-progress':
        return <div className={`${baseClasses} bg-primary-500`}>
          {step === 'translation' ? <Languages className="h-5 w-5" /> : 
           step === 'extraction' ? <FileText className="h-5 w-5" /> :
           <BookOpen className="h-5 w-5" />}
        </div>;
      case 'failed':
        return <div className={`${baseClasses} bg-red-500`}><X className="h-5 w-5" /></div>;
      default:
        return <div className={`${baseClasses} bg-gray-300`}>
          {step === 'upload' ? <FileText className="h-5 w-5" /> : 
           step === 'extraction' ? <FileText className="h-5 w-5" /> :
           step === 'translation' ? <Languages className="h-5 w-5" /> :
           <BookOpen className="h-5 w-5" />}
        </div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Translation in Progress</DialogTitle>
          <DialogDescription>
            Track the progress of your translation job.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : translation ? (
          <>
            <div className="mb-6">
              <div className="flex items-center">
                {translation.fileType === 'epub' ? 
                  <BookOpen className="h-5 w-5 text-gray-400 mr-2" /> : 
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                }
                <span className="text-lg font-medium text-gray-900">{translation.fileName}</span>
              </div>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span>{translation.sourceLanguage} → {translation.targetLanguage}</span>
                <span className="mx-2">|</span>
                <span>{translation.totalPages || '?'} pages</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-medium text-primary-600">{translation.progress}%</span>
              </div>
              <Progress value={translation.progress} className="h-2.5" />
            </div>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div className="flex items-center">
                {getStepIcon('upload', getStepStatus('upload'))}
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium text-gray-900">File Upload</h3>
                    <span className="text-xs text-gray-500">Completed</span>
                  </div>
                  <Progress value={getStepProgress('upload')} className="h-1.5 mt-1" />
                </div>
              </div>
              
              {/* Text Extraction */}
              <div className="flex items-center">
                {getStepIcon('extraction', getStepStatus('extraction'))}
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Text Extraction</h3>
                    <span className="text-xs text-gray-500">
                      {getStepStatus('extraction') === 'completed' ? 'Completed' : 
                       getStepStatus('extraction') === 'in-progress' ? 'Extracting...' : 
                       getStepStatus('extraction') === 'failed' ? 'Failed' : 'Waiting'}
                    </span>
                  </div>
                  <Progress value={getStepProgress('extraction')} className="h-1.5 mt-1" />
                </div>
              </div>
              
              {/* AI Translation */}
              <div className="flex items-center">
                {getStepIcon('translation', getStepStatus('translation'))}
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium text-gray-900">AI Translation</h3>
                    <span className="text-xs text-gray-500">
                      {getStepStatus('translation') === 'completed' ? 'Completed' : 
                       getStepStatus('translation') === 'in-progress' ? 
                        translation.status === 'batch_processing' ?
                          'Batch processing... (checking every 2 min)' :
                          `Translating... (${translation.completedPages || 0}/${translation.totalPages || '?'})` : 
                       getStepStatus('translation') === 'failed' ? 'Failed' : 'Waiting'}
                    </span>
                  </div>
                  <Progress value={getStepProgress('translation')} className="h-1.5 mt-1" />
                </div>
              </div>
              
              {/* Document Reconstruction */}
              <div className="flex items-center">
                {getStepIcon('reconstruction', getStepStatus('reconstruction'))}
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Document Reconstruction</h3>
                    <span className="text-xs text-gray-500">
                      {getStepStatus('reconstruction') === 'completed' ? 'Completed' : 
                       getStepStatus('reconstruction') === 'in-progress' ? 'Reconstructing...' : 
                       getStepStatus('reconstruction') === 'failed' ? 'Failed' : 'Waiting'}
                    </span>
                  </div>
                  <Progress value={getStepProgress('reconstruction')} className="h-1.5 mt-1" />
                </div>
              </div>
            </div>
            
            {translation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">Error: {translation.error}</p>
              </div>
            )}
            
            {translation.status === 'batch_processing' && (
              <Alert className="mt-4">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-sm">
                    This translation is using <span className="font-medium">batch processing with OpenAI</span>, which is more cost-effective but takes longer.
                    The system checks for completion every 2 minutes.
                  </div>
                  
                  <div className="mt-2 flex flex-col space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">OpenAI Batch ID:</span>
                      <span className="font-mono text-gray-800">{translation.batchId || 'Not assigned yet'}</span>
                    </div>
                    
                    {translation.metadata ? (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Retry Count:</span>
                        <span className="font-mono text-gray-800">
                          {JSON.stringify(translation.metadata).includes('retryCount') ? 
                           String((translation.metadata as any).retryCount) : '0'}
                        </span>
                      </div>
                    ) : null}
                    
                    {translation.lastChecked && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Last Check:</span>
                        <span className="font-mono text-gray-800">
                          {new Date(translation.lastChecked).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {batchStatus && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-md border border-gray-200">
                      <div className="text-sm font-medium">OpenAI Batch Status: 
                        <span className={`ml-1 ${
                          batchStatus.status === 'completed' ? 'text-green-600' : 
                          batchStatus.status === 'failed' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {batchStatus.status}
                        </span>
                      </div>
                      
                      {typeof batchStatus.progress === 'number' && (
                        <div className="mt-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Detailed progress:</span>
                            <span className="font-medium">{batchStatus.progress}%</span>
                          </div>
                          <Progress value={batchStatus.progress} className="h-1.5" />
                        </div>
                      )}
                      
                      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        {batchStatus.chapterCount !== undefined && (
                          <>
                            <div className="text-gray-600">Chapters:</div>
                            <div className="text-gray-800 font-medium">
                              {batchStatus.translatedCount !== undefined ? 
                                `${batchStatus.translatedCount}/${batchStatus.chapterCount}` : 
                                batchStatus.chapterCount}
                            </div>
                          </>
                        )}
                        
                        {batchStatus.processingTimeMs !== undefined && (
                          <>
                            <div className="text-gray-600">Processing time:</div>
                            <div className="text-gray-800 font-medium">
                              {Math.floor(batchStatus.processingTimeMs / 60000)} min
                            </div>
                          </>
                        )}
                        
                        {batchStatus.createdAt && (
                          <>
                            <div className="text-gray-600">Started:</div>
                            <div className="text-gray-800 font-mono text-[9px]">
                              {new Date(batchStatus.createdAt).toLocaleString()}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {batchStatus.eta && (
                        <div className="mt-2 flex items-center text-xs text-emerald-600 bg-emerald-50 p-1.5 rounded">
                          <Clock className="h-3 w-3 mr-1" />
                          Estimated completion: {new Date(batchStatus.eta).toLocaleString()}
                        </div>
                      )}
                      
                      {batchStatus.error && (
                        <div className="mt-1 text-xs text-red-600 bg-red-50 p-1.5 rounded">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Error: {batchStatus.error}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500 italic">
                    You can close this window and check back later. Your translation will continue processing.
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="py-6 text-center text-gray-500">
            Translation not found
          </div>
        )}
        
        <DialogFooter className="flex justify-end space-x-2">
          {translation?.status === 'failed' && (
            <Button variant="destructive">
              Cancel Translation
            </Button>
          )}
          <Button onClick={onClose}>
            {translation?.status === 'completed' ? 'Close' : 'Hide'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
