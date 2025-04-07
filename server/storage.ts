import { 
  users, type User, type InsertUser,
  translations, type Translation, type InsertTranslation, type UpdateTranslation
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Translation methods
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getTranslation(id: number): Promise<Translation | undefined>;
  updateTranslation(id: number, update: UpdateTranslation): Promise<Translation | undefined>;
  getUserTranslations(userId: number): Promise<Translation[]>;
  getRecentTranslations(userId: number, limit?: number): Promise<Translation[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private translations: Map<number, Translation>;
  private userIdCounter: number;
  private translationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.translations = new Map();
    this.userIdCounter = 1;
    this.translationIdCounter = 1;
    
    // Create a demo user
    this.createUser({
      username: "demo",
      password: "password"
    });
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Translation methods
  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const id = this.translationIdCounter++;
    const now = new Date();
    
    const translation: Translation = {
      ...insertTranslation,
      id,
      originalFileUrl: undefined,
      translatedFileUrl: undefined,
      status: "pending",
      progress: 0,
      createdAt: now,
      updatedAt: now,
      error: undefined,
      metadata: undefined,
      totalPages: undefined,
      completedPages: 0
    };
    
    this.translations.set(id, translation);
    return translation;
  }
  
  async getTranslation(id: number): Promise<Translation | undefined> {
    return this.translations.get(id);
  }
  
  async updateTranslation(id: number, update: UpdateTranslation): Promise<Translation | undefined> {
    const translation = this.translations.get(id);
    
    if (!translation) {
      return undefined;
    }
    
    const updatedTranslation: Translation = {
      ...translation,
      ...update,
      updatedAt: new Date()
    };
    
    this.translations.set(id, updatedTranslation);
    return updatedTranslation;
  }
  
  async getUserTranslations(userId: number): Promise<Translation[]> {
    return Array.from(this.translations.values())
      .filter(translation => translation.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getRecentTranslations(userId: number, limit = 5): Promise<Translation[]> {
    return Array.from(this.translations.values())
      .filter(translation => translation.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
