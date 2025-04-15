import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with API key
const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

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

/**
 * Translates text using Google Gemini 2.0 Flash AI
 * @param text The text to translate
 * @param sourceLanguage The source language code
 * @param targetLanguage The target language code
 * @param style The translation style ('standard', 'literal', 'technical', 'literary', 'coloquial')
 * @returns The translated text
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  style: string = 'standard'
): Promise<string> {
  try {
    console.log(`[translateText] Starting translation. Target: ${targetLanguage}, Style: ${style}. Text length: ${text.length}`);
    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Get full language names
    const sourceLang = languageMapping[sourceLanguage] || sourceLanguage;
    const targetLang = languageMapping[targetLanguage] || targetLanguage;
    
    // Get style instruction
    const styleInstruction = stylePrompts[style] || stylePrompts.standard;
    
    // Construct prompt
    const prompt = `
      ${styleInstruction}
      
      Translate the following text from ${sourceLang} to ${targetLang}:
      
      ${text}
      
      Important instructions:
      1. Maintain the same paragraph structure as the original text
      2. Preserve any formatting markers if present
      3. Keep names, dates, and numbers exactly as they appear
      4. Do not add any explanatory notes or comments
      5. Do not include the original text in your response
      6. Only return the translated text
    `;
    
    console.log(`[translateText] Calling Gemini API. Model: gemini-2.0-flash`);
    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const translatedText = response.text();
    
    return translatedText;
  } catch (error: any) {
    console.error('Translation error:', error);
    // Attempt to access message safely
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Translation failed: ${errorMessage}`);
  }
}
