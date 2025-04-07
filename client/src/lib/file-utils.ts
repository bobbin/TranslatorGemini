/**
 * Utility functions for handling files
 */

/**
 * Validates a file based on type and size
 * @param file The file to validate
 * @param acceptedTypes Array of accepted file extensions without the dot
 * @param maxSizeInMB Maximum file size in MB
 * @returns Validation result with error message if needed
 */
export function validateFile(
  file: File,
  acceptedTypes: string[] = ['epub', 'pdf'],
  maxSizeInMB: number = 100
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxSizeInMB}MB.`,
    };
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !acceptedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `Invalid file type. Only ${acceptedTypes.join(', ')} files are accepted.`,
    };
  }

  return { valid: true };
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Gets an estimated number of pages based on file size
 * This is just a rough approximation and not accurate
 * @param bytes File size in bytes
 * @param fileType Type of the file (epub or pdf)
 * @returns Estimated number of pages
 */
export function estimatePageCount(bytes: number, fileType: string): number {
  // Very rough estimates - in a real app this would be more accurate
  // after actual parsing of the file
  if (fileType === 'pdf') {
    // Approx 100KB per PDF page
    return Math.max(1, Math.ceil(bytes / (100 * 1024)));
  } else if (fileType === 'epub') {
    // Approx 50KB per EPUB chapter/page
    return Math.max(1, Math.ceil(bytes / (50 * 1024)));
  }
  
  return 1;
}
