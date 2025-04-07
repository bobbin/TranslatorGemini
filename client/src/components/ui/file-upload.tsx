import React, { useState, useRef } from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CloudUpload, BookOpen, File, X } from "lucide-react";

interface FileUploadProps {
  accept: string;
  maxSize?: number; // In bytes
  onFileSelected: (file: File | null) => void;
  uploading?: boolean;
  uploadProgress?: number;
  selectedFile?: File | null;
}

export function FileUpload({
  accept,
  maxSize = 100 * 1024 * 1024, // 100MB default
  onFileSelected,
  uploading = false,
  uploadProgress = 0,
  selectedFile = null,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file size
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      return false;
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map(type => 
      type.trim().replace('.', '').toLowerCase()
    );
    
    if (!fileExtension || !acceptedTypes.includes(fileExtension)) {
      setError(`Invalid file type. Only ${accept} files are accepted.`);
      return false;
    }
    
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    onFileSelected(null); // Pass null to clear
  };

  // If we are uploading or have a file selected, show special view
  if (uploading) {
    return (
      <Card className="border-2 border-dashed border-primary-300 bg-primary-50">
        <CardContent className="p-6 text-center">
          <CloudUpload className="h-12 w-12 mx-auto text-primary-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Uploading file...
          </h3>
          <div className="mt-4">
            <Progress value={uploadProgress} className="h-2" />
            <p className="mt-1 text-sm text-gray-500">{uploadProgress}% complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedFile && selectedFile.name) {
    return (
      <Card className="border-2 border-dashed border-green-300 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {selectedFile.name.endsWith('.epub') ? (
                  <BookOpen className="h-8 w-8 text-green-500" />
                ) : (
                  <File className="h-8 w-8 text-green-500" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleRemoveFile}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default view (no file selected)
  return (
    <Card 
      className={`border-2 border-dashed transition-colors cursor-pointer ${
        isDragging 
          ? "border-primary-400 bg-primary-50" 
          : "border-gray-300 hover:bg-gray-50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <CardContent className="p-6 text-center">
        <input
          type="file"
          accept={accept}
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileInputChange}
        />
        
        <CloudUpload className="h-12 w-12 mx-auto text-gray-400" />
        
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Drag and drop your file here
        </h3>
        
        <p className="mt-2 text-gray-500">
          or click to browse
        </p>
        
        <p className="mt-1 text-sm text-gray-500">
          Supports {accept.replace(/\./g, '')} formats (max {maxSize / (1024 * 1024)}MB)
        </p>
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
