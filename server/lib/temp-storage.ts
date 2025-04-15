import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

interface TranslatedChapter {
  id: string;
  title: string;
  translatedHtml: string;
}

/**
 * Saves a translated chapter to temporary storage
 * @param translationId ID of the translation
 * @param chapter Chapter to save
 * @returns Path to the saved file
 */
export async function saveTranslatedChapter(
  translationId: number,
  chapter: TranslatedChapter
): Promise<string> {
  const tempDir = join(tmpdir(), `translation-${translationId}`);
  await mkdir(tempDir, { recursive: true });
  const filePath = join(tempDir, `${chapter.id}.json`);
  await writeFile(filePath, JSON.stringify(chapter));
  return filePath;
}

/**
 * Retrieves a translated chapter from temporary storage
 * @param filePath Path to the chapter file
 * @returns The translated chapter
 */
export async function getTranslatedChapter(filePath: string): Promise<TranslatedChapter> {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Cleans up temporary storage for a translation
 * @param translationId ID of the translation
 */
export async function cleanupTranslationStorage(translationId: number): Promise<void> {
  const tempDir = join(tmpdir(), `translation-${translationId}`);
  try {
    await unlink(tempDir);
  } catch (error) {
    // Ignore errors if directory doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
} 