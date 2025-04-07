import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { insertUserSchema, insertTranslationSchema } from "@shared/schema";
import { processEpub } from "./lib/epub-parser";
import { processPdf } from "./lib/pdf-parser";
import { translateText } from "./lib/translation";
import { rebuildEpub, rebuildPdf } from "./lib/file-builder";

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userUploadsDir = path.join(process.cwd(), "uploads", "originals");
      fs.mkdirSync(userUploadsDir, { recursive: true });
      cb(null, userUploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".epub", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only EPUB and PDF files are allowed"));
    }
  },
});

// Ensure translation directories exist
const ensureDirectories = () => {
  const dirs = [
    path.join(process.cwd(), "uploads", "originals"),
    path.join(process.cwd(), "uploads", "translated"),
  ];
  dirs.forEach((dir) => fs.mkdirSync(dir, { recursive: true }));
};

export async function registerRoutes(app: Express): Promise<Server> {
  ensureDirectories();
  
  // Auth routes
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      res.status(201).json({ 
        id: newUser.id, 
        username: newUser.username, 
        email: newUser.email, 
        plan: newUser.plan 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Error creating user" });
      }
    }
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.status(200).json({ 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        plan: user.plan 
      });
    } catch (error) {
      res.status(500).json({ message: "Error during login" });
    }
  });

  // Translations API
  app.get("/api/translations/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const translations = await storage.getTranslationsByUserId(userId);
      res.status(200).json(translations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching translations" });
    }
  });

  app.get("/api/translations/:id/chapters", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid translation ID" });
      }
      
      const chapters = await storage.getChaptersByTranslationId(id);
      res.status(200).json(chapters);
    } catch (error) {
      res.status(500).json({ message: "Error fetching chapters" });
    }
  });

  app.post("/api/translations", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { userId, sourceLanguage, targetLanguage, translationStyle } = req.body;
      
      if (!userId || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const fileType = path.extname(req.file.originalname).toLowerCase().substring(1);
      
      const translationData = {
        userId: parseInt(userId),
        fileName: req.file.originalname,
        fileType,
        sourceLanguage,
        targetLanguage,
        status: 'pending',
        originalFilePath: req.file.path,
      };
      
      const newTranslation = await storage.createTranslation(translationData);
      
      // Start processing in background
      processTranslation(newTranslation.id, translationStyle || "standard").catch(console.error);
      
      res.status(201).json(newTranslation);
    } catch (error) {
      res.status(500).json({ message: "Error creating translation" });
    }
  });

  app.get("/api/translations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid translation ID" });
      }
      
      const translation = await storage.getTranslation(id);
      if (!translation) {
        return res.status(404).json({ message: "Translation not found" });
      }
      
      res.status(200).json(translation);
    } catch (error) {
      res.status(500).json({ message: "Error fetching translation" });
    }
  });

  app.get("/api/translations/:id/download", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid translation ID" });
      }
      
      const translation = await storage.getTranslation(id);
      if (!translation || !translation.translatedFilePath) {
        return res.status(404).json({ message: "Translated file not found" });
      }
      
      if (translation.status !== 'completed') {
        return res.status(400).json({ message: "Translation not yet complete" });
      }
      
      res.download(translation.translatedFilePath, `${translation.fileName}_translated.${translation.fileType}`);
    } catch (error) {
      res.status(500).json({ message: "Error downloading file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Process translation in background
async function processTranslation(translationId: number, style: string) {
  try {
    // Get translation data
    const translation = await storage.getTranslation(translationId);
    if (!translation) {
      throw new Error("Translation not found");
    }
    
    // Update status to processing
    await storage.updateTranslationStatus(translationId, "processing", 0);
    
    let chapters: { title: string; content: string }[] = [];
    
    // Extract content based on file type
    if (translation.fileType === "epub") {
      chapters = await processEpub(translation.originalFilePath);
    } else if (translation.fileType === "pdf") {
      chapters = await processPdf(translation.originalFilePath);
    } else {
      throw new Error("Unsupported file type");
    }
    
    // Create chapter records
    for (let i = 0; i < chapters.length; i++) {
      await storage.createTranslationChapter({
        translationId,
        chapterNumber: i + 1,
        chapterTitle: chapters[i].title,
        status: "pending"
      });
    }
    
    // Translate each chapter
    const translatedChapters = [];
    for (let i = 0; i < chapters.length; i++) {
      const chapterId = i + 1;
      const chapter = chapters[i];
      
      // Update chapter status
      const dbChapters = await storage.getChaptersByTranslationId(translationId);
      const dbChapter = dbChapters.find(c => c.chapterNumber === chapterId);
      
      if (dbChapter) {
        await storage.updateChapterStatus(dbChapter.id, "processing", 0);
      }
      
      // Translate chapter
      const translatedContent = await translateText(
        chapter.content,
        translation.sourceLanguage,
        translation.targetLanguage,
        style
      );
      
      translatedChapters.push({
        title: chapter.title,
        content: translatedContent
      });
      
      // Update progress
      if (dbChapter) {
        await storage.updateChapterStatus(dbChapter.id, "completed", 100);
      }
      
      const overallProgress = Math.floor(((i + 1) / chapters.length) * 100);
      await storage.updateTranslationProgress(translationId, overallProgress);
    }
    
    // Rebuild file
    const outputDir = path.join(process.cwd(), "uploads", "translated");
    const outputFilename = `${path.basename(translation.originalFilePath, path.extname(translation.originalFilePath))}_translated${path.extname(translation.originalFilePath)}`;
    const outputPath = path.join(outputDir, outputFilename);
    
    if (translation.fileType === "epub") {
      await rebuildEpub(translation.originalFilePath, translatedChapters, outputPath);
    } else if (translation.fileType === "pdf") {
      await rebuildPdf(translation.originalFilePath, translatedChapters, outputPath);
    }
    
    // Complete translation
    await storage.completeTranslation(translationId, outputPath);
    
  } catch (error) {
    console.error("Error processing translation:", error);
    await storage.updateTranslationStatus(translationId, "failed", 0);
  }
}
