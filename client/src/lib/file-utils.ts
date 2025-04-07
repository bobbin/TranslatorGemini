/**
 * Utility functions for handling files in the translation application
 */

/**
 * Validates if a file is of an acceptable type for translation
 * @param file The file to validate
 * @returns A boolean indicating if the file is valid
 */
export function isValidFileType(file: File): boolean {
  const allowedExtensions = ['.epub', '.pdf'];
  const fileName = file.name.toLowerCase();
  return allowedExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Gets the file type from a file name
 * @param fileName The name of the file
 * @returns The file extension (e.g., 'epub' or 'pdf')
 */
export function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return extension;
}

/**
 * Formats a file size for display (e.g., "2.5 MB")
 * @param bytes The file size in bytes
 * @returns A formatted string representing the file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Checks if a file exceeds the maximum size limit
 * @param file The file to check
 * @param maxSizeInMB The maximum allowed size in megabytes
 * @returns A boolean indicating if the file exceeds the size limit
 */
export function exceedsMaxSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size > maxSizeInBytes;
}

/**
 * Gets the appropriate maximum file size based on the user's plan
 * @param plan The user's subscription plan ('free', 'pro', 'enterprise')
 * @returns The maximum allowed file size in megabytes
 */
export function getMaxFileSizeForPlan(plan: string): number {
  switch (plan) {
    case 'pro':
      return 20;
    case 'enterprise':
      return 50;
    case 'free':
    default:
      return 1;
  }
}

/**
 * Creates a file icon based on the file type
 * @param fileType The type of file ('epub' or 'pdf')
 * @returns A class name for the appropriate icon
 */
export function getFileIconClass(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return 'file-pdf';
    case 'epub':
      return 'file-text';
    default:
      return 'file';
  }
}
