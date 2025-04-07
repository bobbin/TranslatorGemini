import { translations, translationChapters, users, type User, type InsertUser, type Translation, type InsertTranslation, type TranslationChapter, type InsertTranslationChapter } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Translation methods
  getTranslationsByUserId(userId: number): Promise<Translation[]>;
  getTranslation(id: number): Promise<Translation | undefined>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  updateTranslationStatus(id: number, status: string, progress: number): Promise<Translation | undefined>;
  updateTranslationFilePath(id: number, translatedFilePath: string): Promise<Translation | undefined>;
  updateTranslationProgress(id: number, progress: number): Promise<Translation | undefined>;
  completeTranslation(id: number, translatedFilePath: string): Promise<Translation | undefined>;
  
  // Translation chapter methods
  getChaptersByTranslationId(translationId: number): Promise<TranslationChapter[]>;
  createTranslationChapter(chapter: InsertTranslationChapter): Promise<TranslationChapter>;
  updateChapterStatus(id: number, status: string, progress: number): Promise<TranslationChapter | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private translations: Map<number, Translation>;
  private chapters: Map<number, TranslationChapter>;
  private userId: number;
  private translationId: number;
  private chapterId: number;

  constructor() {
    this.users = new Map();
    this.translations = new Map();
    this.chapters = new Map();
    this.userId = 1;
    this.translationId = 1;
    this.chapterId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Translation methods
  async getTranslationsByUserId(userId: number): Promise<Translation[]> {
    return Array.from(this.translations.values()).filter(
      (translation) => translation.userId === userId,
    );
  }

  async getTranslation(id: number): Promise<Translation | undefined> {
    return this.translations.get(id);
  }

  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const id = this.translationId++;
    const now = new Date();
    const translation: Translation = {
      ...insertTranslation,
      id,
      progress: 0,
      createdAt: now,
      completedAt: null,
      translatedFilePath: null,
      metadata: {}
    };
    this.translations.set(id, translation);
    return translation;
  }

  async updateTranslationStatus(id: number, status: string, progress: number): Promise<Translation | undefined> {
    const translation = this.translations.get(id);
    if (!translation) return undefined;

    const updatedTranslation: Translation = {
      ...translation,
      status,
      progress
    };
    this.translations.set(id, updatedTranslation);
    return updatedTranslation;
  }

  async updateTranslationFilePath(id: number, translatedFilePath: string): Promise<Translation | undefined> {
    const translation = this.translations.get(id);
    if (!translation) return undefined;

    const updatedTranslation: Translation = {
      ...translation,
      translatedFilePath
    };
    this.translations.set(id, updatedTranslation);
    return updatedTranslation;
  }

  async updateTranslationProgress(id: number, progress: number): Promise<Translation | undefined> {
    const translation = this.translations.get(id);
    if (!translation) return undefined;

    const updatedTranslation: Translation = {
      ...translation,
      progress
    };
    this.translations.set(id, updatedTranslation);
    return updatedTranslation;
  }

  async completeTranslation(id: number, translatedFilePath: string): Promise<Translation | undefined> {
    const translation = this.translations.get(id);
    if (!translation) return undefined;

    const updatedTranslation: Translation = {
      ...translation,
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      translatedFilePath
    };
    this.translations.set(id, updatedTranslation);
    return updatedTranslation;
  }

  // Translation chapter methods
  async getChaptersByTranslationId(translationId: number): Promise<TranslationChapter[]> {
    return Array.from(this.chapters.values()).filter(
      (chapter) => chapter.translationId === translationId,
    );
  }

  async createTranslationChapter(insertChapter: InsertTranslationChapter): Promise<TranslationChapter> {
    const id = this.chapterId++;
    const now = new Date();
    const chapter: TranslationChapter = {
      ...insertChapter,
      id,
      progress: 0,
      createdAt: now
    };
    this.chapters.set(id, chapter);
    return chapter;
  }

  async updateChapterStatus(id: number, status: string, progress: number): Promise<TranslationChapter | undefined> {
    const chapter = this.chapters.get(id);
    if (!chapter) return undefined;

    const updatedChapter: TranslationChapter = {
      ...chapter,
      status,
      progress
    };
    this.chapters.set(id, updatedChapter);
    return updatedChapter;
  }
}

export const storage = new MemStorage();
