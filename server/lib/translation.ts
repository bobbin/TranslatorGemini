import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from "openai";

// --- Configuration ---
// Change this to 'OPENAI' to use OpenAI GPT-4o
const TRANSLATION_PROVIDER: 'GEMINI' | 'OPENAI' = 'OPENAI'; 
// Select models based on provider
const GEMINI_MODEL = "gemini-1.5-flash"; // User changed back to flash
const OPENAI_MODEL = "gpt-4.1"; // Use the latest powerful OpenAI model

// Initialize APIs with keys from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
if (TRANSLATION_PROVIDER === 'GEMINI' && GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

let openai: OpenAI | null = null;
if (TRANSLATION_PROVIDER === 'OPENAI' && OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}
// --- End Configuration ---

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
 * Translates HTML content using the configured LLM provider (Gemini or OpenAI)
 * @param htmlContent The HTML content to translate
 * @param sourceLanguage The source language code
 * @param targetLanguage The target language code
 * @param style The translation style ('standard', 'literal', 'technical', 'literary', 'coloquial')
 * @returns The translated HTML content
 */
export async function translateText(
  htmlContent: string,
  sourceLanguage: string,
  targetLanguage: string,
  style: string = 'standard'
): Promise<string> {
  try {
    const sourceLang = languageMapping[sourceLanguage] || sourceLanguage;
    const targetLang = languageMapping[targetLanguage] || targetLanguage;
    const styleInstruction = stylePrompts[style] || stylePrompts.standard;

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

    let translatedHtml = '';

    if (TRANSLATION_PROVIDER === 'GEMINI') {
      if (!genAI) {
        throw new Error('Gemini API client not initialized. Check API key and provider selection.');
      }
      console.log(`[translateText] Starting HTML translation with Gemini. Target: ${targetLang}, Style: ${style}. HTML length: ${htmlContent.length}`);

      const prompt = `
        Task: Translate the user-visible text content within the following HTML snippet from ${sourceLang} to ${targetLang}.
        Style: ${styleInstruction}
        
        Input HTML:
        \`\`\`html
        ${htmlContent}
        \`\`\`
        
        ${commonHtmlInstructions}
      `;

      console.log(`[translateText] Calling Gemini API. Model: ${GEMINI_MODEL}`);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(prompt);
      const response = result.response;
      translatedHtml = response.text();

    } else if (TRANSLATION_PROVIDER === 'OPENAI') {
      if (!openai) {
        throw new Error('OpenAI API client not initialized. Check API key and provider selection.');
      }
       console.log(`[translateText] Starting HTML translation with OpenAI. Target: ${targetLang}, Style: ${style}. HTML length: ${htmlContent.length}`);

      const systemPrompt = `
        Task: Translate the user-visible text content within the following HTML snippet from ${sourceLang} to ${targetLang}.
        Style: ${styleInstruction}
        ${commonHtmlInstructions}
      `;

      console.log(`[translateText] Calling OpenAI API. Model: ${OPENAI_MODEL}`);
       // Using openai.chat.completions.create which is the standard method
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: htmlContent // Provide the HTML directly as user content
          }
        ],
        // Optional parameters you might want to adjust:
        // temperature: 0.7, 
        // max_tokens: 4000, // Adjust based on expected output size
      });

      if (!response.choices || response.choices.length === 0 || !response.choices[0].message?.content) {
         throw new Error('OpenAI response did not contain translated content.');
      }
      translatedHtml = response.choices[0].message.content.trim();

    } else {
      throw new Error(`Invalid TRANSLATION_PROVIDER configured: ${TRANSLATION_PROVIDER}`);
    }
    
    console.log(`[translateText] Translation successful. Output length: ${translatedHtml.length}`);
    return translatedHtml;

  } catch (error: any) {
    console.error(`Translation error with ${TRANSLATION_PROVIDER}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Optionally include more details from the error object if available
    if (error.response?.data) {
       console.error("API Error Data:", error.response.data);
    }
    throw new Error(`Translation failed (${TRANSLATION_PROVIDER}): ${errorMessage}`);
  }
}
