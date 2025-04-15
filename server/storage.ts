import { 
  users, type User, type InsertUser,
  translations, type Translation, type InsertTranslation, type UpdateTranslation,
  userSettings, type UserSettings, type InsertUserSettings, type UpdateUserSettings
} from "@shared/schema";
import connectPg from "connect-pg-simple";
import session from "express-session";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User | undefined>;
  updateUserStripeInfo(id: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;

  // Translation methods
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getTranslation(id: number): Promise<Translation | undefined>;
  updateTranslation(id: number, update: UpdateTranslation): Promise<Translation | undefined>;
  getUserTranslations(userId: number): Promise<Translation[]>;
  getRecentTranslations(userId: number, limit?: number): Promise<Translation[]>;
  getTranslationsByStatus(status: string): Promise<Translation[]>;

  // User Settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, settings: UpdateUserSettings): Promise<UserSettings | undefined>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private translations: Map<number, Translation>;
  private userSettings: Map<number, UserSettings>;
  private userIdCounter: number;
  private translationIdCounter: number;
  private userSettingsIdCounter: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.translations = new Map();
    this.userSettings = new Map();
    this.userIdCounter = 1;
    this.translationIdCounter = 1;
    this.userSettingsIdCounter = 1;

    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Create a demo user
    this.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      fullName: "Demo User"
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
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      fullName: insertUser.fullName || null,
      plan: "free", 
      createdAt: now, 
      updatedAt: now, 
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      ...userData, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(id, { stripeCustomerId });
  }

  async updateUserStripeInfo(id: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(id, info);
  }

  // Translation methods
  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const id = this.translationIdCounter++;
    const now = new Date();

    const translation: Translation = {
      ...insertTranslation,
      id,
      originalFileUrl: null,
      translatedFileUrl: null,
      originalS3Key: insertTranslation.originalS3Key || null,
      translatedS3Key: null,
      status: "pending",
      progress: 0,
      createdAt: now,
      updatedAt: now,
      error: null,
      metadata: null,
      totalPages: null,
      completedPages: 0,
      customPrompt: insertTranslation.customPrompt || null
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

  async getTranslationsByStatus(status: string): Promise<Translation[]> {
    return Array.from(this.translations.values()).filter(t => t.status === status);
  }

  // User settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return Array.from(this.userSettings.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const id = this.userSettingsIdCounter++;
    const now = new Date();

    const userSettings: UserSettings = {
      ...settings,
      id,
      uiTheme: settings.uiTheme || "system",
      defaultSourceLanguage: settings.defaultSourceLanguage || null,
      defaultTargetLanguage: settings.defaultTargetLanguage || null,
      emailNotifications: settings.emailNotifications ?? null,
      createdAt: now,
      updatedAt: now
    };

    this.userSettings.set(id, userSettings);
    return userSettings;
  }

  async updateUserSettings(userId: number, update: UpdateUserSettings): Promise<UserSettings | undefined> {
    const settings = Array.from(this.userSettings.values()).find(
      (settings) => settings.userId === userId
    );

    if (!settings) {
      return undefined;
    }

    const updatedSettings: UserSettings = {
      ...settings,
      ...update,
      updatedAt: new Date()
    };

    this.userSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }
}

// Database Storage implementation
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Volver a usar el almacenamiento PostgreSQL para sesiones
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      tableName: 'session',
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateStripeCustomerId(id: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(id, { stripeCustomerId });
  }

  async updateUserStripeInfo(id: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(id, info);
  }

  // Translation methods
  async createTranslation(translation: InsertTranslation): Promise<Translation> {
    const [newTranslation] = await db
      .insert(translations)
      .values(translation)
      .returning();
    return newTranslation;
  }

  async getTranslation(id: number): Promise<Translation | undefined> {
    const [translation] = await db
      .select()
      .from(translations)
      .where(eq(translations.id, id));
    return translation || undefined;
  }

  async updateTranslation(id: number, update: UpdateTranslation): Promise<Translation | undefined> {
    const [translation] = await db
      .update(translations)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(translations.id, id))
      .returning();
    return translation || undefined;
  }

  async getUserTranslations(userId: number): Promise<Translation[]> {
    return db
      .select()
      .from(translations)
      .where(eq(translations.userId, userId))
      .orderBy(desc(translations.createdAt));
  }

  async getRecentTranslations(userId: number, limit = 5): Promise<Translation[]> {
    return db
      .select()
      .from(translations)
      .where(eq(translations.userId, userId))
      .orderBy(desc(translations.createdAt))
      .limit(limit);
  }

  async getTranslationsByStatus(status: string): Promise<Translation[]> {
    return await db.query.translations.findMany({
      where: eq(translations.status, status)
    });
  }

  // User settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db
      .insert(userSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async updateUserSettings(userId: number, update: UpdateUserSettings): Promise<UserSettings | undefined> {
    const [settings] = await db
      .update(userSettings)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
    return settings || undefined;
  }
}

// Use the database storage implementation
// Nota: Estamos usando explícitamente la implementación de base de datos PostgreSQL
export const storage = new DatabaseStorage();