import * as fs from 'fs/promises';
import * as path from 'path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Chapter {
  title: string;
  content: string;
}

/**
 * Rebuilds an EPUB file with translated content
 * @param originalFilePath Path to the original EPUB file
 * @param translatedChapters Array of translated chapters
 * @param outputPath Path to save the translated EPUB
 */
export async function rebuildEpub(
  originalFilePath: string,
  translatedChapters: Chapter[],
  outputPath: string
): Promise<void> {
  try {
    // Read the original EPUB file
    const originalData = await fs.readFile(originalFilePath);
    const originalZip = await JSZip.loadAsync(originalData);
    const newZip = new JSZip();
    
    // Find the content.opf file
    let contentOpfPath = '';
    let metaInfContainer = await originalZip.file('META-INF/container.xml')?.async('text');
    
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    
    if (metaInfContainer) {
      const containerDoc = parser.parseFromString(metaInfContainer, 'text/xml');
      const rootfiles = containerDoc.getElementsByTagName('rootfile');
      if (rootfiles.length > 0) {
        contentOpfPath = rootfiles[0].getAttribute('full-path') || '';
      }
    }
    
    if (!contentOpfPath) {
      throw new Error('Could not find content.opf path');
    }
    
    // Read and parse content.opf
    const contentOpf = await originalZip.file(contentOpfPath)?.async('text');
    if (!contentOpf) {
      throw new Error('Could not read content.opf file');
    }
    
    const contentOpfDir = path.dirname(contentOpfPath);
    const contentOpfDoc = parser.parseFromString(contentOpf, 'text/xml');
    
    // Get spine and manifest information
    const spine: string[] = [];
    const manifest: Record<string, string> = {};
    
    const items = contentOpfDoc.getElementsByTagName('item');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = item.getAttribute('id') || '';
      const href = item.getAttribute('href') || '';
      manifest[id] = path.join(contentOpfDir, href).replace(/\\/g, '/');
    }
    
    const spineItems = contentOpfDoc.getElementsByTagName('itemref');
    for (let i = 0; i < spineItems.length; i++) {
      const item = spineItems[i];
      const idref = item.getAttribute('idref') || '';
      if (idref && manifest[idref]) {
        spine.push(manifest[idref]);
      }
    }
    
    // Copy all files from original EPUB to new ZIP
    for (const filename of Object.keys(originalZip.files)) {
      const file = originalZip.files[filename];
      
      if (file.dir) {
        newZip.folder(filename);
        continue;
      }
      
      // Check if this is a chapter file that needs to be replaced
      const isChapterFile = spine.includes(filename);
      
      if (isChapterFile) {
        const chapterIndex = spine.indexOf(filename);
        if (chapterIndex >= 0 && chapterIndex < translatedChapters.length) {
          // Replace chapter content
          const originalContent = await file.async('text');
          const htmlDoc = parser.parseFromString(originalContent, 'text/html');
          
          // Find the main content element (could be body or a specific div)
          const bodyElement = htmlDoc.getElementsByTagName('body')[0];
          if (bodyElement) {
            // Clear existing content
            while (bodyElement.firstChild) {
              bodyElement.removeChild(bodyElement.firstChild);
            }
            
            // Add translated content - wrapping in paragraphs
            const paragraphs = translatedChapters[chapterIndex].content.split('\n\n');
            for (const paragraph of paragraphs) {
              const p = htmlDoc.createElement('p');
              p.textContent = paragraph.trim();
              bodyElement.appendChild(p);
            }
            
            // Serialize the modified HTML
            const modifiedContent = serializer.serializeToString(htmlDoc);
            newZip.file(filename, modifiedContent);
            continue;
          }
        }
      }
      
      // For non-chapter files or if chapter replacement failed, copy the original
      const fileData = await file.async('nodebuffer');
      newZip.file(filename, fileData);
    }
    
    // Update language in content.opf if needed
    try {
      const metaElements = contentOpfDoc.getElementsByTagName('dc:language');
      for (let i = 0; i < metaElements.length; i++) {
        // We don't know the target language here, but if we needed to change it,
        // we could do: metaElements[i].textContent = targetLanguageCode;
      }
      
      // Update title to indicate translation
      const titleElements = contentOpfDoc.getElementsByTagName('dc:title');
      for (let i = 0; i < titleElements.length; i++) {
        const originalTitle = titleElements[i].textContent || '';
        titleElements[i].textContent = `${originalTitle} (Translated)`;
      }
      
      // Save modified content.opf
      const modifiedContentOpf = serializer.serializeToString(contentOpfDoc);
      newZip.file(contentOpfPath, modifiedContentOpf);
    } catch (e) {
      console.error('Error updating metadata:', e);
    }
    
    // Generate the new EPUB file
    const content = await newZip.generateAsync({ type: 'nodebuffer' });
    await fs.writeFile(outputPath, content);
    
  } catch (error) {
    console.error('Error rebuilding EPUB:', error);
    throw new Error(`Failed to rebuild EPUB: ${error.message}`);
  }
}

/**
 * Rebuilds a PDF file with translated content
 * @param originalFilePath Path to the original PDF file
 * @param translatedChapters Array of translated chapters
 * @param outputPath Path to save the translated PDF
 */
export async function rebuildPdf(
  originalFilePath: string,
  translatedChapters: Chapter[],
  outputPath: string
): Promise<void> {
  try {
    // Read the original PDF
    const originalPdfBytes = await fs.readFile(originalFilePath);
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Create pages for each chapter
    for (const chapter of translatedChapters) {
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 12;
      const margin = 50;
      const lineHeight = fontSize * 1.2;
      
      // Draw chapter title
      page.drawText(chapter.title, {
        x: margin,
        y: height - margin,
        size: fontSize + 4,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Split content into lines and paragraphs
      const paragraphs = chapter.content.split('\n\n');
      let currentY = height - margin - lineHeight * 2;
      
      for (const paragraph of paragraphs) {
        // Simple word wrapping
        const words = paragraph.split(' ');
        let line = '';
        
        for (const word of words) {
          const testLine = line + word + ' ';
          const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (lineWidth > width - 2 * margin && line) {
            // Draw current line
            page.drawText(line, {
              x: margin,
              y: currentY,
              size: fontSize,
              font: font,
              color: rgb(0, 0, 0),
            });
            
            line = word + ' ';
            currentY -= lineHeight;
          } else {
            line = testLine;
          }
          
          // Check if we need a new page
          if (currentY < margin) {
            // Add a new page
            const newPage = pdfDoc.addPage();
            currentY = height - margin;
          }
        }
        
        if (line) {
          page.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
          currentY -= lineHeight;
        }
        
        // Extra space between paragraphs
        currentY -= lineHeight / 2;
      }
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);
    
  } catch (error) {
    console.error('Error rebuilding PDF:', error);
    throw new Error(`Failed to rebuild PDF: ${error.message}`);
  }
}
