import React, { useState, useRef } from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CloudUpload } from "lucide-react";

interface FileUploadProps {
  accept: string;
  maxSize?: number; // In bytes
  onFileSelected: (file: File) => void;
  uploading?: boolean;
  uploadProgress?: number;
}

export function FileUpload({
  accept,
  maxSize = 100 * 1024 * 1024, // 100MB default
  onFileSelected,
  uploading = false,
  uploadProgress = 0,
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
          {uploading ? "Uploading file..." : "Drag and drop your file here"}
        </h3>
        
        <p className="mt-2 text-gray-500">
          {uploading ? "" : "or click to browse"}
        </p>
        
        <p className="mt-1 text-sm text-gray-500">
          {uploading ? "" : `Supports ${accept.replace(/\./g, '')} formats (max ${maxSize / (1024 * 1024)}MB)`}
        </p>
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        
        {uploading && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="h-2" />
            <p className="mt-1 text-sm text-gray-500">{uploadProgress}% complete</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
