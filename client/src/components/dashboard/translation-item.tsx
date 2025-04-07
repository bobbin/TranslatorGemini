import { useState } from 'react';
import { Book, FileText, MoreVertical, Download, RefreshCw } from 'lucide-react';
import { Translation, TranslationStatus } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface TranslationItemProps {
  translation: Translation;
  onViewDetails: (id: number) => void;
  onRetry?: (id: number) => void;
}

export function TranslationItem({ translation, onViewDetails, onRetry }: TranslationItemProps) {
  const getStatusBadgeClass = (status: TranslationStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
      case 'extracting':
      case 'translating':
      case 'reconstructing':
        return 'bg-amber-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: TranslationStatus) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'extracting':
        return 'Extracting';
      case 'translating':
        return 'Translating';
      case 'reconstructing':
        return 'Reconstructing';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'epub') {
      return <Book className="text-gray-400" />;
    }
    return <FileText className="text-gray-400" />;
  };

  const isInProgress = ['pending', 'extracting', 'translating', 'reconstructing'].includes(translation.status);

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {getFileIcon(translation.fileType)}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{translation.fileName}</h3>
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-500 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {formatDistanceToNow(new Date(translation.createdAt), { addSuffix: true })}
              </span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-sm text-gray-500">{translation.sourceLanguage} → {translation.targetLanguage}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          {isInProgress ? (
            <div className="flex flex-col">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(translation.status)} text-white mb-1`}>
                {getStatusLabel(translation.status)}
              </span>
              <div className="w-36 bg-gray-200 rounded-full h-2">
                <div 
                  className={`${getStatusBadgeClass(translation.status)} h-2 rounded-full`} 
                  style={{ width: `${translation.progress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(translation.status)} text-white`}>
              {getStatusLabel(translation.status)}
            </span>
          )}
          
          <div className="ml-4 flex">
            {translation.status === 'completed' && (
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={async () => {
                  // Obtener URL de descarga prefirmada del servidor
                  try {
                    const response = await fetch(`/api/translations/${translation.id}/download`);
                    if (!response.ok) {
                      throw new Error('Failed to generate download link');
                    }
                    const data = await response.json();
                    // Abrir URL de descarga en una nueva pestaña
                    window.open(data.downloadUrl, '_blank');
                  } catch (error) {
                    console.error('Download error:', error);
                    // Mostrar mensaje de error
                    alert('Error generating download link. Please try again later.');
                  }
                }}
              >
                <Download className="h-5 w-5" />
              </button>
            )}
            
            {translation.status === 'failed' && onRetry && (
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => onRetry(translation.id)}
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-2 text-gray-400 hover:text-gray-500">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(translation.id)}>
                  View Details
                </DropdownMenuItem>
                {translation.status === 'completed' && (
                  <DropdownMenuItem onClick={async () => {
                    try {
                      const response = await fetch(`/api/translations/${translation.id}/download`);
                      if (!response.ok) {
                        throw new Error('Failed to generate download link');
                      }
                      const data = await response.json();
                      window.open(data.downloadUrl, '_blank');
                    } catch (error) {
                      console.error('Download error:', error);
                      alert('Error generating download link. Please try again later.');
                    }
                  }}>
                    Download
                  </DropdownMenuItem>
                )}
                {translation.status === 'failed' && onRetry && (
                  <DropdownMenuItem onClick={() => onRetry(translation.id)}>
                    Retry Translation
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
