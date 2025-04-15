import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI with API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Language codes mapping for improved prompting
const languageMapping: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  // Add more languages as needed
};

// Translation style prompts
const stylePrompts: Record<string, string> = {
  'standard': 'Translate this text maintaining a neutral, accurate style that preserves the meaning and tone of the original.',
  'literal': 'Translate this text as literally as possible, staying very close to the original wording while ensuring grammatical correctness.',
  'technical': 'Translate this text with precise technical terminology, maintaining all specialized terms and concepts.',
  'literary': 'Translate this text with literary flair, preserving metaphors, idioms, and stylistic elements while adapting them naturally to the target language.',
  'coloquial': 'Translate this text into a casual, conversational style using common expressions and everyday language in the target language.'
};

// Common instructions for HTML translation
const commonHtmlInstructions = `
  Instructions:
  1.  Preserve *all* HTML tags (e.g., <p>, <span>, <a>, <img>, etc.), attributes (e.g., class=\\"...\\", style=\\"...\\", href=\\"...\\"), and the overall structure exactly as they appear in the original snippet.
  2.  Translate only the text content that is visible to the end user.
  3.  Do not translate text within HTML tags or attributes (e.g., do not translate class names or URLs).
  4.  Handle HTML entities (e.g., &amp;, &lt;, &gt;, &nbsp;, &#8220;, &#8217;) correctly in the translated output, preserving them where appropriate.
  5.  Maintain the original paragraph and formatting structure implied by the HTML.
  6.  Return *only* the complete, translated HTML snippet. Do not add any explanatory text, preambles, or markdown formatting around the HTML output.
`;

/**
 * Interface for chapter content to be translated
 */
export interface ChapterForTranslation {
  id: string;
  title: string;
  html: string;
}

/**
 * Interface for translated chapter content
 */
export interface TranslatedChapter {
  id: string;
  title: string;
  translatedHtml: string;
}

/**
 * Interface to track translation batch state
 */
interface BatchTranslationState {
  batchId: string;
  inputFileId: string | null;
  batchStatus: 'preparing' | 'validating' | 'in_progress' | 'completed' | 'failed';
  sourceLanguage: string;
  targetLanguage: string;
  style: string;
  chapters: ChapterForTranslation[];
  translatedChapters: TranslatedChapter[];
  progress?: number; // Progreso estimado de 0 a 100
  lastChecked: Date;
  createdAt: Date;
  completedAt: Date | null;
  error: string | null;
}

// Store for tracking batch translations
const batchTranslations = new Map<string, BatchTranslationState>();

/**
 * Create a temporary directory for batch files
 */
async function createTempDir(): Promise<string> {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'openai-batch-'));
  return tempDir;
}

/**
 * Create batch translation request files for OpenAI
 * @param chapters Array of chapters to translate
 * @param sourceLanguage Source language code
 * @param targetLanguage Target language code
 * @param style Translation style
 * @returns BatchTranslationState object
 */
export async function createBatchTranslation(
  chapters: ChapterForTranslation[],
  sourceLanguage: string,
  targetLanguage: string,
  style: string = 'standard'
): Promise<BatchTranslationState> {
  try {
    const sourceLang = languageMapping[sourceLanguage] || sourceLanguage;
    const targetLang = languageMapping[targetLanguage] || targetLanguage;
    const styleInstruction = stylePrompts[style] || stylePrompts.standard;
    
    // Create a temporary directory for batch files
    const tempDir = await createTempDir();
    const tempBatchId = uuidv4(); // Solo para el nombre del archivo temporal
    const batchFilePath = path.join(tempDir, `batch-${tempBatchId}.jsonl`);
    
    console.log(`[Batch API] Creating batch translation request`);
    console.log(`[Batch API] Will translate ${chapters.length} chapters from ${sourceLang} to ${targetLang}`);
    
    // Prepare system prompt
    const systemPrompt = `
      Task: Translate the user-visible text content within the following HTML snippet from ${sourceLang} to ${targetLang}.
      Style: ${styleInstruction}
      ${commonHtmlInstructions}
    `;
    
    // Create the JSONL file for batch processing
    const batchLines = chapters.map((chapter, index) => {
      return JSON.stringify({
        custom_id: chapter.id,
        method: "POST",
        url: "/v1/chat/completions",
        body: {
          model: "gpt-4.1",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: chapter.html
            }
          ]
        }
      });
    });
    
    // Write the batch file
    await fs.promises.writeFile(batchFilePath, batchLines.join('\n'));
    
    // Upload the file to OpenAI
    console.log(`[Batch API] Uploading batch file to OpenAI`);
    const file = await openai.files.create({
      file: fs.createReadStream(batchFilePath),
      purpose: "batch",
    });
    
    console.log(`[Batch API] Batch file uploaded with ID: ${file.id}`);
    
    // Create the batch job
    console.log(`[Batch API] Creating batch job`);
    const batch = await openai.batches.create({
      input_file_id: file.id,
      endpoint: "/v1/chat/completions",
      completion_window: "24h"
    });
    
    console.log(`[Batch API] Batch job created with ID: ${batch.id}`);
    
    // Create and store the batch state
    const batchState: BatchTranslationState = {
      batchId: batch.id,
      inputFileId: file.id,
      batchStatus: 'validating',
      sourceLanguage,
      targetLanguage,
      style,
      chapters,
      translatedChapters: [],
      lastChecked: new Date(),
      createdAt: new Date(),
      completedAt: null,
      error: null
    };
    
    // Usamos el ID de OpenAI como clave en el mapa
    batchTranslations.set(batch.id, batchState);
    console.log(`[Batch API] Stored batch state with OpenAI batch ID: ${batch.id}`);
    
    // Clean up temp dir
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`[Batch API] Failed to clean up temp directory: ${e}`);
    }
    
    return batchState;
  } catch (error: any) {
    console.error(`[Batch API] Error creating batch translation:`, error);
    throw new Error(`Failed to create batch translation: ${error.message}`);
  }
}

/**
 * Check the status of a batch translation
 * @param batchId The ID of the batch translation
 * @returns Updated BatchTranslationState
 */
export async function checkBatchStatus(batchId: string): Promise<BatchTranslationState> {
  console.log(`[Batch API] checkBatchStatus called for batch ID: ${batchId}`);
  const startTime = new Date();
  try {
    const batchState = batchTranslations.get(batchId);
    if (!batchState) {
      throw new Error(`Batch translation with ID ${batchId} not found`);
    }
    
    console.log(`[Batch API] Checking status of batch: ${batchId}`);
    
    // Retrieve the batch from OpenAI
    const batch = await openai.batches.retrieve(batchState.batchId);
    
    console.log(`[Batch API] Batch status: ${batch.status}`);
    
    // Update the batch state based on the retrieved status
    batchState.lastChecked = new Date();
    
    if (batch.status === 'completed') {
      console.log(`[Batch API] Batch completed, retrieving results`);
      batchState.batchStatus = 'completed';
      batchState.completedAt = new Date();
      
      // Download the output file
      if (batch.output_file_id) {
        const fileResponse = await openai.files.content(batch.output_file_id);
        const fileContents = await fileResponse.text();
        
        // Parse the JSONL output
        const outputLines = fileContents.split('\n').filter(line => line.trim());
        const translatedChapters: TranslatedChapter[] = [];
        
        for (const line of outputLines) {
          try {
            const result = JSON.parse(line);
            
            // Skip if there's an error
            if (result.error) {
              console.error(`[Batch API] Error in batch result for chapter ${result.custom_id}:`, result.error);
              continue;
            }
            
            // Find the original chapter
            const originalChapter = batchState.chapters.find(c => c.id === result.custom_id);
            if (!originalChapter) {
              console.warn(`[Batch API] Cannot find original chapter for ID: ${result.custom_id}`);
              continue;
            }
            
            // Extract the translation from the response
            const translatedContent = result.response.body.choices[0]?.message?.content;
            if (translatedContent) {
              translatedChapters.push({
                id: result.custom_id,
                title: originalChapter.title,
                translatedHtml: translatedContent.trim()
              });
            }
          } catch (err) {
            console.error(`[Batch API] Error parsing batch result line:`, err);
          }
        }
        
        batchState.translatedChapters = translatedChapters;
        console.log(`[Batch API] Retrieved ${translatedChapters.length} translated chapters`);
      }
      
    } else if (batch.status === 'failed' || batch.status === 'expired' || batch.status === 'cancelled') {
      console.error(`[Batch API] Batch failed with status: ${batch.status}`);
      batchState.batchStatus = 'failed';
      batchState.error = `Batch processing failed with status: ${batch.status}`;
      
      // Check for error file
      if (batch.error_file_id) {
        try {
          const errorResponse = await openai.files.content(batch.error_file_id);
          const errorContents = await errorResponse.text();
          console.error(`[Batch API] Error file contents:`, errorContents);
          batchState.error = `Batch processing errors: ${errorContents}`;
        } catch (err) {
          console.error(`[Batch API] Error retrieving error file:`, err);
        }
      }
    } else {
      // Still in progress
      batchState.batchStatus = 'in_progress';
      // Update progress info if available
      if (batch.request_counts) {
        const totalRequests = batch.request_counts.total || 0;
        const completedRequests = batch.request_counts.completed || 0;
        const failedRequests = batch.request_counts.failed || 0;
        
        // Calculate progress as a percentage (0-100)
        if (totalRequests > 0) {
          const progressPercentage = Math.floor((completedRequests / totalRequests) * 100);
          batchState.progress = progressPercentage;
        }
        
        console.log(`[Batch API] Progress: ${completedRequests}/${totalRequests} completed (${batchState.progress || 0}%), ${failedRequests} failed`);
      }
    }
    
    // Update the batch translations map (siempre con el ID de OpenAI)
    batchTranslations.set(batchState.batchId, batchState);
    console.log(`[Batch API] Updated batch state for ${batchState.batchId} to status: ${batchState.batchStatus}`);
    
    // Log execution time for performance monitoring
    const endTime = new Date();
    const executionTimeMs = endTime.getTime() - startTime.getTime();
    console.log(`[Batch API] checkBatchStatus completed in ${executionTimeMs}ms for batch ID: ${batchId}`);
    
    return batchState;
  } catch (error: any) {
    console.error(`[Batch API] Error checking batch status:`, error);
    
    // Update the batch state to failed if we have it
    const batchState = batchTranslations.get(batchId);
    if (batchState) {
      batchState.batchStatus = 'failed';
      batchState.error = `Error checking batch status: ${error.message}`;
      // Siempre guardar con el ID de OpenAI
      batchTranslations.set(batchState.batchId, batchState);
      console.log(`[Batch API] Updated batch state for ${batchState.batchId} to 'failed' due to error`);
    } else {
      // Si no encontramos el estado del lote, podría ser porque el ID de OpenAI no coincide con el que estamos usando
      console.error(`[Batch API] Batch state not found for ID: ${batchId}. This might be a mismatch between OpenAI batch ID and stored ID.`);
    }
    
    // Log execution time on error as well
    const endTime = new Date();
    const executionTimeMs = endTime.getTime() - startTime.getTime();
    console.log(`[Batch API] checkBatchStatus failed in ${executionTimeMs}ms for batch ID: ${batchId}`);
    
    throw new Error(`Failed to check batch translation status: ${error.message}`);
  }
}

/**
 * Get all translated chapters from a batch
 * @param batchId The ID of the batch translation
 * @returns Array of translated chapters or null if batch is not complete
 */
export function getBatchResults(batchId: string): TranslatedChapter[] | null {
  const batchState = batchTranslations.get(batchId);
  if (!batchState) {
    throw new Error(`Batch translation with ID ${batchId} not found`);
  }
  
  if (batchState.batchStatus !== 'completed') {
    return null;
  }
  
  return batchState.translatedChapters;
}

/**
 * Get batch state
 * @param batchId The ID of the batch translation
 * @returns BatchTranslationState or undefined if not found
 */
export function getBatchState(batchId: string): BatchTranslationState | undefined {
  const state = batchTranslations.get(batchId);
  if (!state) {
    console.log(`[Batch API] getBatchState: No batch state found for ID: ${batchId}`);
    console.log(`[Batch API] Currently tracking ${batchTranslations.size} batch translations`);
    if (batchTranslations.size > 0) {
      console.log(`[Batch API] Available batch IDs: ${Array.from(batchTranslations.keys()).join(', ')}`);
    }
  }
  return state;
}