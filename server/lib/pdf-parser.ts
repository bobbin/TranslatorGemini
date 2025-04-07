import * as fs from 'fs/promises';
import * as path from 'path';
import pdfjsLib from 'pdfjs-dist';

interface Chapter {
  title: string;
  content: string;
}

/**
 * Process a PDF file and extract its text content divided into chapters
 * @param filePath Path to the PDF file
 * @returns Array of chapters with title and content
 */
export async function processPdf(filePath: string): Promise<Chapter[]> {
  try {
    // Read the PDF file as a buffer
    const data = await fs.readFile(filePath);
    
    // Load the PDF document
    const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
    
    // Get total number of pages
    const numPages = pdfDocument.numPages;
    
    // Attempt to extract outline/bookmarks to identify chapters
    let outline: any[] = [];
    try {
      outline = await pdfDocument.getOutline() || [];
    } catch (err) {
      console.error('Failed to extract PDF outline:', err);
    }
    
    // If we have an outline with chapters, use that to divide the content
    if (outline.length > 0) {
      // Sort outline items by page number
      outline.sort((a, b) => {
        const aPage = a.dest ? (Array.isArray(a.dest) ? a.dest[0].num : a.dest.num) : 0;
        const bPage = b.dest ? (Array.isArray(b.dest) ? b.dest[0].num : b.dest.num) : 0;
        return aPage - bPage;
      });
      
      // Add document end as last chapter boundary
      outline.push({
        title: 'End',
        dest: [{ num: numPages + 1 }]
      });
      
      // Extract text for each chapter
      const chapters: Chapter[] = [];
      
      for (let i = 0; i < outline.length - 1; i++) {
        const currentChapter = outline[i];
        const nextChapter = outline[i + 1];
        
        const currentPage = currentChapter.dest 
          ? (Array.isArray(currentChapter.dest) ? currentChapter.dest[0].num : currentChapter.dest.num) 
          : 1;
        
        const nextPage = nextChapter.dest 
          ? (Array.isArray(nextChapter.dest) ? nextChapter.dest[0].num : nextChapter.dest.num) 
          : numPages + 1;
        
        let chapterContent = '';
        
        // Extract text from all pages in this chapter
        for (let pageNum = currentPage; pageNum < nextPage; pageNum++) {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          const strings = textContent.items.map(item => 'str' in item ? item.str : '');
          chapterContent += strings.join(' ') + ' ';
        }
        
        chapters.push({
          title: currentChapter.title || `Chapter ${i + 1}`,
          content: chapterContent.trim()
        });
      }
      
      return chapters;
    } else {
      // No outline - divide content into arbitrary "chapters" of ~20 pages each
      const chapterSize = 20;
      const chapters: Chapter[] = [];
      
      for (let i = 1; i <= numPages; i += chapterSize) {
        const endPage = Math.min(i + chapterSize - 1, numPages);
        let chapterContent = '';
        
        for (let pageNum = i; pageNum <= endPage; pageNum++) {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          const strings = textContent.items.map(item => 'str' in item ? item.str : '');
          chapterContent += strings.join(' ') + ' ';
        }
        
        chapters.push({
          title: `Section ${Math.floor(i / chapterSize) + 1}`,
          content: chapterContent.trim()
        });
      }
      
      return chapters;
    }
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}
