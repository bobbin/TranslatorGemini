/**
 * This module provides a client-side interface to Google Gemini AI
 * API calls are proxied through the backend to secure API keys
 */

import { Language } from "@shared/schema";

/**
 * Get suggested translation settings based on a file analysis
 * @param fileName The name of the file to analyze
 * @param fileType The type of the file (epub or pdf)
 * @returns Suggested source and target languages
 */
export async function getTranslationSuggestions(
  fileName: string,
  fileType: string
): Promise<{ sourceLanguage: Language, targetLanguage: Language }> {
  try {
    const response = await fetch(`/api/suggestions?fileName=${encodeURIComponent(fileName)}&fileType=${fileType}`);
    
    if (!response.ok) {
      throw new Error('Failed to get translation suggestions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting translation suggestions:', error);
    // Return defaults if unable to get suggestions
    return {
      sourceLanguage: 'English',
      targetLanguage: 'Spanish'
    };
  }
}

/**
 * Check if a custom prompt is appropriate for translation
 * @param prompt The custom prompt to check
 * @returns Validation result with feedback if needed
 */
export async function validateCustomPrompt(
  prompt: string
): Promise<{ valid: boolean, feedback?: string }> {
  // For a real implementation, this would check the prompt 
  // against Gemini guidelines via an API call
  
  // For now, just do some basic checks
  if (prompt.length > 1000) {
    return {
      valid: false,
      feedback: 'Prompt is too long. Please keep it under 1000 characters.'
    };
  }
  
  if (/\b(harmful|illegal|unethical)\b/i.test(prompt)) {
    return {
      valid: false,
      feedback: 'Prompt contains potentially inappropriate content.'
    };
  }
  
  return { valid: true };
}
