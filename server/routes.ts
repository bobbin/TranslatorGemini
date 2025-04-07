import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTranslationSchema, updateTranslationSchema, LANGUAGES, SUPPORTED_FILE_TYPES } from "@shared/schema";
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { extractChapters, reconstructEpub } from './lib/epub-handler';
import { extractPages, reconstructPdf } from './lib/pdf-handler';
import { translateText } from './lib/gemini-service';
import { setupAuth } from './auth';

// Set up multer for file upload handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.epub' || ext === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only EPUB and PDF files are allowed'));
    }
  },
});

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      fullName: string | null;
      password: string;
      plan: string;
      stripeCustomerId: string | null;
      stripeSubscriptionId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  console.log('Session:', req.session);
  console.log('User:', req.user);
  res.status(401).json({ message: 'Unauthorized' });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  // Get languages
  app.get('/api/languages', (_req: Request, res: Response) => {
    res.json({ languages: LANGUAGES });
  });

  // Get file types
  app.get('/api/file-types', (_req: Request, res: Response) => {
    res.json({ fileTypes: SUPPORTED_FILE_TYPES });
  });

  // Get all translations for a user
  app.get('/api/translations', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const translations = await storage.getUserTranslations(userId);
      res.json(translations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch translations' });
    }
  });

  // Get recent translations for a user
  app.get('/api/translations/recent', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const translations = await storage.getRecentTranslations(userId, limit);
      res.json(translations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch recent translations' });
    }
  });

  // Get a specific translation
  app.get('/api/translations/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const translation = await storage.getTranslation(id);
      
      if (!translation) {
        return res.status(404).json({ message: 'Translation not found' });
      }
      
      // Check if the translation belongs to the authenticated user
      if (translation.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      res.json(translation);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch translation' });
    }
  });

  // Create a new translation
  app.post('/api/translations', isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileType = path.extname(file.originalname).toLowerCase().substring(1);
      if (!SUPPORTED_FILE_TYPES.includes(fileType as any)) {
        return res.status(400).json({ message: 'Unsupported file type' });
      }

      // Validate request body
      const payload = {
        userId: req.user!.id,
        fileName: file.originalname,
        fileType,
        sourceLanguage: req.body.sourceLanguage,
        targetLanguage: req.body.targetLanguage,
        customPrompt: req.body.customPrompt,
      };

      const result = insertTranslationSchema.safeParse(payload);
      if (!result.success) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: result.error.errors 
        });
      }

      // Create translation record
      const translation = await storage.createTranslation(result.data);
      
      // Start the translation process (this would typically be done asynchronously)
      // Update status to "extracting"
      await storage.updateTranslation(translation.id, { 
        status: 'extracting',
        progress: 10 
      });

      // Process based on file type
      let totalUnits = 0;
      let translatedContent;

      if (fileType === 'epub') {
        // Extract chapters from EPUB
        const chapters = await extractChapters(file.buffer);
        totalUnits = chapters.length;
        
        // Update with extracted info
        await storage.updateTranslation(translation.id, {
          status: 'translating',
          progress: 30,
          totalPages: totalUnits
        });

        // Translate each chapter (in a real app, this would be done in chunks or with a job queue)
        const translatedChapters = [];
        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];
          const translatedText = await translateText(
            chapter.text,
            result.data.sourceLanguage,
            result.data.targetLanguage,
            result.data.customPrompt || undefined
          );

          translatedChapters.push({
            id: chapter.id,
            title: chapter.title,
            translatedText
          });

          // Update progress
          const completedPages = i + 1;
          const progress = Math.floor(30 + (completedPages / totalUnits) * 50);
          await storage.updateTranslation(translation.id, {
            progress,
            completedPages
          });
        }

        // Update to reconstructing status
        await storage.updateTranslation(translation.id, {
          status: 'reconstructing',
          progress: 80
        });

        // Reconstruct EPUB
        translatedContent = await reconstructEpub(file.buffer, translatedChapters);
      } else if (fileType === 'pdf') {
        // Extract pages from PDF
        const pages = await extractPages(file.buffer);
        totalUnits = pages.length;
        
        // Update with extracted info
        await storage.updateTranslation(translation.id, {
          status: 'translating',
          progress: 30,
          totalPages: totalUnits
        });

        // Translate each page
        const translatedPages = [];
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const translatedText = await translateText(
            page.text,
            result.data.sourceLanguage,
            result.data.targetLanguage,
            result.data.customPrompt || undefined
          );

          translatedPages.push({
            pageNum: page.pageNum,
            translatedText
          });

          // Update progress
          const completedPages = i + 1;
          const progress = Math.floor(30 + (completedPages / totalUnits) * 50);
          await storage.updateTranslation(translation.id, {
            progress,
            completedPages
          });
        }

        // Update to reconstructing status
        await storage.updateTranslation(translation.id, {
          status: 'reconstructing',
          progress: 80
        });

        // Reconstruct PDF
        translatedContent = await reconstructPdf(file.buffer, translatedPages);
      }

      // In a real app, we would save the file to cloud storage
      // For demo purposes, we'll simulate success
      const translatedFileUrl = `/translated-${translation.id}.${fileType}`;

      // Update to completed status
      await storage.updateTranslation(translation.id, {
        status: 'completed',
        progress: 100,
        translatedFileUrl
      });

      // Return the translation record
      res.status(201).json(translation);
    } catch (error: any) {
      console.error('Translation error:', error);
      res.status(500).json({ message: error.message || 'Failed to process translation' });
    }
  });

  // Update translation status
  app.patch('/api/translations/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const translation = await storage.getTranslation(id);
      
      if (!translation) {
        return res.status(404).json({ message: 'Translation not found' });
      }
      
      // Check if the translation belongs to the authenticated user
      if (translation.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const result = updateTranslationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: 'Invalid update data',
          errors: result.error.errors 
        });
      }
      
      const updatedTranslation = await storage.updateTranslation(id, result.data);
      res.json(updatedTranslation);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update translation' });
    }
  });

  // Test auth endpoint
  app.get('/api/auth-test', isAuthenticated, (req: Request, res: Response) => {
    const { password, ...userWithoutPassword } = req.user!;
    res.json({
      message: 'Authentication successful',
      user: userWithoutPassword
    });
  });

  // Download a translated file
  app.get('/api/translations/:id/download', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const translation = await storage.getTranslation(id);
      
      if (!translation) {
        return res.status(404).json({ message: 'Translation not found' });
      }
      
      // Check if the translation belongs to the authenticated user
      if (translation.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Check if translation is completed
      if (translation.status !== 'completed') {
        return res.status(400).json({ message: 'Translation is not completed yet' });
      }
      
      // In a real app, we would get the file from cloud storage
      // For demo purposes, we'll send a simple buffer with sample content
      const fileContent = Buffer.from(`This is the translated content for ${translation.fileName}`);
      
      res.setHeader('Content-Type', translation.fileType === 'epub' ? 'application/epub+zip' : 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="translated-${translation.fileName}"`);
      res.send(fileContent);
    } catch (error) {
      res.status(500).json({ message: 'Failed to download translation' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
