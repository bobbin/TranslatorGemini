import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Translation } from "@shared/schema";
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
import { FileText, BookOpen, X, Languages, CheckCircle } from "lucide-react";

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
  const [pollingInterval, setPollingInterval] = useState(2000);

  // Query to get translation status with polling
  const { data: translation, isLoading } = useQuery<Translation>({
    queryKey: ['/api/translations', translationId],
    enabled: isOpen && !!translationId,
    refetchInterval: (data) => {
      // Stop polling when translation is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return pollingInterval;
    },
  });

  useEffect(() => {
    // When translation completes, slow down polling
    if (translation?.status === 'completed' || translation?.status === 'failed') {
      setPollingInterval(false as any);
    } else {
      setPollingInterval(2000);
    }
  }, [translation?.status]);

  if (!isOpen || !translationId) return null;

  const getStepStatus = (step: string) => {
    if (!translation) return 'pending';
    
    switch (step) {
      case 'upload':
        return 'completed';
      case 'extraction':
        return ['extracting', 'translating', 'reconstructing', 'completed'].includes(translation.status) 
          ? 'completed' 
          : translation.status === 'failed' 
            ? 'failed' 
            : 'pending';
      case 'translation':
        return ['translating', 'reconstructing', 'completed'].includes(translation.status) 
          ? translation.status === 'translating' 
            ? 'in-progress' 
            : 'completed' 
          : translation.status === 'failed' 
            ? 'failed' 
            : 'pending';
      case 'reconstruction':
        return ['reconstructing', 'completed'].includes(translation.status) 
          ? translation.status === 'reconstructing' 
            ? 'in-progress' 
            : 'completed' 
          : translation.status === 'failed' 
            ? 'failed' 
            : 'pending';
      default:
        return 'pending';
    }
  };

  const getStepProgress = (step: string) => {
    if (!translation) return 0;
    
    switch (step) {
      case 'upload':
        return 100;
      case 'extraction':
        if (translation.status === 'pending') return 0;
        if (translation.status === 'extracting') return 50;
        return 100;
      case 'translation':
        if (['pending', 'extracting'].includes(translation.status)) return 0;
        if (translation.status === 'translating') {
          if (!translation.totalPages || translation.totalPages === 0) return 50;
          return Math.round((translation.completedPages || 0) / translation.totalPages * 100);
        }
        return 100;
      case 'reconstruction':
        if (!['reconstructing', 'completed'].includes(translation.status)) return 0;
        if (translation.status === 'reconstructing') return 50;
        return 100;
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
                       getStepStatus('extraction') === 'in-progress' ? 'In Progress' : 
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
                        `In Progress (${translation.completedPages || 0}/${translation.totalPages || '?'} pages)` : 
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
                       getStepStatus('reconstruction') === 'in-progress' ? 'In Progress' : 
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
