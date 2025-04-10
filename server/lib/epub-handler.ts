// This module handles EPUB file processing
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import JSZip from 'jszip';
import { parseString } from 'xml2js';
import { JSDOM } from 'jsdom';

const exec = promisify(execCallback);

interface ChapterContent {
  id: string;
  title: string;
  text: string;
  html: string; // Original HTML content
}

interface TranslatedChapter {
  id: string;
  title: string;
  translatedText: string;
}

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'epub-'));
  return tempDir;
}

/**
 * Extract chapters from an EPUB file
 * @param buffer EPUB file buffer
 * @returns Array of chapters with their content
 */
export async function extractChapters(buffer: Buffer): Promise<ChapterContent[]> {
  const tempDir = await createTempDir();
  const epubPath = path.join(tempDir, 'book.epub');
  
  try {
    // Write the buffer to a temporary file
    await fs.writeFile(epubPath, buffer);
    
    // Use JSZip to extract the EPUB contents
    const zip = await JSZip.loadAsync(buffer);
    
    // Find the content.opf file which has the metadata
    let contentOpfPath = '';
    let metaInfContainer = await zip.file('META-INF/container.xml')?.async('text');
    
    if (!metaInfContainer) {
      throw new Error('No se pudo encontrar el archivo container.xml en el EPUB');
    }
    
    // Parse container.xml to find content.opf path
    await new Promise<void>((resolve, reject) => {
      parseString(metaInfContainer, (err: any, result: any) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          contentOpfPath = result.container.rootfiles[0].rootfile[0].$['full-path'];
          resolve();
        } catch (e) {
          reject(new Error('Failed to parse container.xml'));
        }
      });
    });
    
    if (!contentOpfPath) {
      throw new Error('Could not find content.opf path');
    }
    
    // Parse content.opf to get the spine and manifest
    const contentOpf = await zip.file(contentOpfPath)?.async('text');
    if (!contentOpf) {
      throw new Error('Could not read content.opf file');
    }
    
    const contentOpfDir = path.dirname(contentOpfPath);
    
    // Parse content.opf using JSDOM
    const dom = new JSDOM(contentOpf, { contentType: 'text/xml' });
    const doc = dom.window.document;
    
    // Get spine and manifest information
    const spine: string[] = [];
    const manifest: Record<string, string> = {};
    
    // Extract items from manifest
    const items = doc.querySelectorAll('item');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = item.getAttribute('id') || '';
      const href = item.getAttribute('href') || '';
      manifest[id] = path.join(contentOpfDir, href).replace(/\\/g, '/');
    }
    
    // Extract spine items
    const spineItems = doc.querySelectorAll('itemref');
    for (let i = 0; i < spineItems.length; i++) {
      const item = spineItems[i];
      const idref = item.getAttribute('idref') || '';
      if (idref && manifest[idref]) {
        spine.push(manifest[idref]);
      }
    }
    
    // Get chapter titles from toc.ncx if available
    const chapterTitles: Record<string, string> = {};
    
    // First, try to find toc.ncx from the manifest
    let tocPath = '';
    const tocItem = doc.querySelector('item[properties="nav"]') || 
                   doc.querySelector('item[media-type="application/x-dtbncx+xml"]');
    
    if (tocItem) {
      const tocHref = tocItem.getAttribute('href') || '';
      tocPath = path.join(contentOpfDir, tocHref).replace(/\\/g, '/');
    }
    
    // Try to find toc.ncx by standard location if not found in manifest
    if (!tocPath) {
      const possibleTocPaths = [
        path.join(contentOpfDir, 'toc.ncx').replace(/\\/g, '/'),
        'toc.ncx'
      ];
      
      for (const potentialPath of possibleTocPaths) {
        if (await zip.file(potentialPath)) {
          tocPath = potentialPath;
          break;
        }
      }
    }
    
    // Parse toc.ncx if found
    if (tocPath && await zip.file(tocPath)) {
      const tocContent = await zip.file(tocPath)?.async('text');
      
      if (tocContent) {
        await new Promise<void>((resolve, reject) => {
          parseString(tocContent, (err: any, result: any) => {
            if (err) {
              reject(err);
              return;
            }
            
            try {
              const navPoints = result.ncx.navMap[0].navPoint;
              for (const navPoint of navPoints) {
                const title = navPoint.navLabel[0].text[0];
                const src = navPoint.content[0].$.src;
                const fullPath = path.join(contentOpfDir, src.split('#')[0]).replace(/\\/g, '/');
                chapterTitles[fullPath] = title;
              }
              resolve();
            } catch (e) {
              // Si falla el análisis del TOC, continuamos sin títulos de capítulos
              console.error('Failed to parse toc.ncx, continuing without chapter titles');
              resolve();
            }
          });
        });
      }
    }
    
    // Process each chapter
    const chapters: ChapterContent[] = [];
    
    // Add chapters from spine
    for (let i = 0; i < spine.length; i++) {
      const chapterPath = spine[i];
      const chapterContent = await zip.file(chapterPath)?.async('text');
      
      if (chapterContent) {
        // Use JSDOM to parse HTML content
        const dom = new JSDOM(chapterContent);
        const doc = dom.window.document;
        
        // Extract text content from HTML
        let textContent = doc.body.textContent || '';
        textContent = textContent.replace(/\s+/g, ' ').trim();
        
        // Use chapter title from toc.ncx if available, otherwise use a generic title
        const title = chapterTitles[chapterPath] || `Capítulo ${i + 1}`;
        
        chapters.push({
          id: `chapter-${i + 1}`,
          title: title,
          text: textContent,
          html: chapterContent
        });
      }
    }
    
    // If no chapters were found using spine, try to extract all HTML files
    if (chapters.length === 0) {
      console.log('No chapters found in spine, trying to extract all HTML files');
      
      for (const filename of Object.keys(zip.files)) {
        if (filename.endsWith('.html') || filename.endsWith('.xhtml')) {
          const content = await zip.file(filename)?.async('text');
          
          if (content) {
            // Use JSDOM to parse HTML content
            const dom = new JSDOM(content);
            const doc = dom.window.document;
            
            // Extract text content from HTML
            let textContent = doc.body.textContent || '';
            textContent = textContent.replace(/\s+/g, ' ').trim();
            
            // Get title from h1 or filename
            const titleElement = doc.querySelector('h1');
            const title = titleElement?.textContent || path.basename(filename, path.extname(filename));
            
            chapters.push({
              id: `file-${chapters.length + 1}`,
              title: title,
              text: textContent,
              html: content
            });
          }
        }
      }
    }
    
    if (chapters.length === 0) {
      throw new Error('No se encontraron capítulos en el archivo EPUB');
    }
    
    console.log(`Extraídos ${chapters.length} capítulos del EPUB`);
    return chapters;
  } catch (error: any) {
    console.error('Error extracting EPUB:', error);
    throw new Error(`Failed to extract EPUB contents: ${error.message}`);
  } finally {
    // Clean up the temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to clean up temp directory:', e);
    }
  }
}

/**
 * Reconstruct an EPUB file with translated content
 * @param originalEpubBuffer Original EPUB file buffer
 * @param translatedChapters Array of chapters with translated content
 * @returns Buffer of the reconstructed EPUB file
 */
export async function reconstructEpub(
  originalEpubBuffer: Buffer, 
  translatedChapters: TranslatedChapter[]
): Promise<Buffer> {
  const tempDir = await createTempDir();
  const originalPath = path.join(tempDir, 'original.epub');
  const outputPath = path.join(tempDir, 'translated.epub');
  
  try {
    // Write the original buffer to a temporary file
    await fs.writeFile(originalPath, originalEpubBuffer);
    
    // Load the original EPUB using JSZip
    const originalZip = await JSZip.loadAsync(originalEpubBuffer);
    const newZip = new JSZip();
    
    // Find and parse content.opf to get spine and manifest
    let contentOpfPath = '';
    const metaInfContainer = await originalZip.file('META-INF/container.xml')?.async('text');
    
    if (!metaInfContainer) {
      throw new Error('No se pudo encontrar el archivo container.xml en el EPUB');
    }
    
    // Parse container.xml to find content.opf path
    await new Promise<void>((resolve, reject) => {
      parseString(metaInfContainer, (err: any, result: any) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          contentOpfPath = result.container.rootfiles[0].rootfile[0].$['full-path'];
          resolve();
        } catch (e) {
          reject(new Error('Failed to parse container.xml'));
        }
      });
    });
    
    if (!contentOpfPath) {
      throw new Error('Could not find content.opf path');
    }
    
    const contentOpf = await originalZip.file(contentOpfPath)?.async('text');
    if (!contentOpf) {
      throw new Error('Could not read content.opf file');
    }
    
    const contentOpfDir = path.dirname(contentOpfPath);
    
    // Parse content.opf using JSDOM
    const dom = new JSDOM(contentOpf, { contentType: 'text/xml' });
    const doc = dom.window.document;
    
    // Get spine and manifest information
    const spine: string[] = [];
    const manifest: Record<string, string> = {};
    
    // Extract items from manifest
    const items = doc.querySelectorAll('item');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = item.getAttribute('id') || '';
      const href = item.getAttribute('href') || '';
      manifest[id] = path.join(contentOpfDir, href).replace(/\\/g, '/');
    }
    
    // Extract spine items
    const spineItems = doc.querySelectorAll('itemref');
    for (let i = 0; i < spineItems.length; i++) {
      const item = spineItems[i];
      const idref = item.getAttribute('idref') || '';
      if (idref && manifest[idref]) {
        spine.push(manifest[idref]);
      }
    }
    
    // Create an index of translated chapters by id for easier lookup
    const translatedChaptersMap = new Map<string, string>();
    translatedChapters.forEach((chapter) => {
      translatedChaptersMap.set(chapter.id, chapter.translatedText);
    });
    
    // Copy all files from original EPUB
    for (const filename of Object.keys(originalZip.files)) {
      const file = originalZip.files[filename];
      
      if (file.dir) {
        // Copy directories as-is
        newZip.folder(filename);
        continue;
      }
      
      // Check if this is an HTML file that needs translation
      let isChapterFile = false;
      let chapterId = '';
      
      // Find the matching chapter ID for this file
      for (let i = 0; i < spine.length; i++) {
        if (spine[i] === filename) {
          isChapterFile = true;
          chapterId = `chapter-${i + 1}`;
          break;
        }
      }
      
      if (isChapterFile && translatedChaptersMap.has(chapterId)) {
        // This is a chapter file that has been translated
        const originalContent = await file.async('text');
        
        // Use JSDOM to parse and modify HTML
        const dom = new JSDOM(originalContent);
        const doc = dom.window.document;
        
        if (doc.body) {
          // Replace body content with translated text
          // First, preserve any script tags
          const scripts = Array.from(doc.querySelectorAll('script'));
          
          // Replace body content with translated text wrapped in a paragraph
          doc.body.innerHTML = `<p>${translatedChaptersMap.get(chapterId)}</p>`;
          
          // Re-add any scripts that were in the original document
          scripts.forEach(script => {
            doc.body.appendChild(script);
          });
        }
        
        // Get the modified HTML content
        const translatedContent = dom.serialize();
        
        // Add the translated file to the new ZIP
        newZip.file(filename, translatedContent);
      } else {
        // Copy non-chapter files as-is
        const content = await file.async('nodebuffer');
        newZip.file(filename, content);
      }
    }
    
    // Generate the new EPUB file as a buffer
    const newEpubBuffer = await newZip.generateAsync({ type: 'nodebuffer' });
    
    // Write the file to the tempDir for debugging if needed
    await fs.writeFile(outputPath, newEpubBuffer);
    
    console.log('EPUB reconstructed successfully with translated content');
    return newEpubBuffer;
  } catch (error: any) {
    console.error('Error reconstructing EPUB:', error);
    throw new Error(`Failed to reconstruct EPUB with translations: ${error.message}`);
  } finally {
    // Clean up the temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to clean up temp directory:', e);
    }
  }
}
