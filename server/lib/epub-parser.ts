import * as fs from 'fs/promises';
import * as path from 'path';
import * as util from 'util';
import { exec as execCallback } from 'child_process';
import JSZip from 'jszip';
import { parseString } from 'xml2js';

const exec = util.promisify(execCallback);

interface Chapter {
  title: string;
  content: string;
}

/**
 * Process an EPUB file and extract its chapters
 * @param filePath Path to the EPUB file
 * @returns Array of chapters with title and content
 */
export async function processEpub(filePath: string): Promise<Chapter[]> {
  try {
    // Read the EPUB file as a buffer
    const data = await fs.readFile(filePath);
    
    // Use JSZip to extract the EPUB contents
    const zip = await JSZip.loadAsync(data);
    
    // Find the content.opf file
    let contentOpfPath = '';
    let metaInfContainer = await zip.file('META-INF/container.xml')?.async('text');
    
    if (metaInfContainer) {
      await new Promise<void>((resolve, reject) => {
        parseString(metaInfContainer, (err, result) => {
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
    }
    
    if (!contentOpfPath) {
      throw new Error('Could not find content.opf path');
    }
    
    // Parse content.opf to get the spine and manifest
    const contentOpf = await zip.file(contentOpfPath)?.async('text');
    if (!contentOpf) {
      throw new Error('Could not read content.opf file');
    }
    
    const contentOpfDir = path.dirname(contentOpfPath);
    
    // Parse content.opf
    let spine: string[] = [];
    let manifest: Record<string, string> = {};
    let tocPath = '';
    
    await new Promise<void>((resolve, reject) => {
      parseString(contentOpf, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          // Get manifest items
          const items = result.package.manifest[0].item;
          for (const item of items) {
            const id = item.$['id'];
            const href = item.$['href'];
            manifest[id] = path.join(contentOpfDir, href).replace(/\\/g, '/');
            
            // Look for toc.ncx
            if (item.$['media-type'] === 'application/x-dtbncx+xml') {
              tocPath = path.join(contentOpfDir, href).replace(/\\/g, '/');
            }
          }
          
          // Get spine order
          const spineItems = result.package.spine[0].itemref;
          for (const item of spineItems) {
            const idref = item.$['idref'];
            if (idref && manifest[idref]) {
              spine.push(manifest[idref]);
            }
          }
          
          resolve();
        } catch (e) {
          reject(new Error('Failed to parse content.opf'));
        }
      });
    });
    
    // Extract chapter titles from toc.ncx if available
    let chapterTitles: Record<string, string> = {};
    
    if (tocPath) {
      const tocContent = await zip.file(tocPath)?.async('text');
      if (tocContent) {
        await new Promise<void>((resolve, reject) => {
          parseString(tocContent, (err, result) => {
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
              // If we fail to parse TOC, just continue without chapter titles
              console.error('Failed to parse toc.ncx, continuing without chapter titles');
              resolve();
            }
          });
        });
      }
    }
    
    // Process each chapter
    const chapters: Chapter[] = [];
    
    for (let i = 0; i < spine.length; i++) {
      const chapterPath = spine[i];
      const chapterContent = await zip.file(chapterPath)?.async('text');
      
      if (chapterContent) {
        // Extract text content from HTML
        let textContent = chapterContent
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Use chapter title from toc.ncx if available, otherwise use a generic title
        const title = chapterTitles[chapterPath] || `Chapter ${i + 1}`;
        
        chapters.push({
          title,
          content: textContent
        });
      }
    }
    
    return chapters;
  } catch (error) {
    console.error('Error processing EPUB:', error);
    throw new Error(`Failed to process EPUB: ${error.message}`);
  }
}
