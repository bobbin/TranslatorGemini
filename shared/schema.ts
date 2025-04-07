import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const userPlans = ["free", "basic", "premium", "enterprise"] as const;
export type UserPlan = typeof userPlans[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  plan: text("plan").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations will be defined after all tables are declared

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  uiTheme: text("ui_theme").default("system").notNull(),
  defaultSourceLanguage: text("default_source_language").default("English"),
  defaultTargetLanguage: text("default_target_language").default("Spanish"),
  emailNotifications: boolean("email_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  uiTheme: true,
  defaultSourceLanguage: true,
  defaultTargetLanguage: true,
  emailNotifications: true,
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

export const updateUserSettingsSchema = createInsertSchema(userSettings)
  .pick({
    uiTheme: true,
    defaultSourceLanguage: true,
    defaultTargetLanguage: true,
    emailNotifications: true,
  })
  .partial();

export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;

// Types of files supported for translation
export const SUPPORTED_FILE_TYPES = ["epub", "pdf"] as const;
export type FileType = typeof SUPPORTED_FILE_TYPES[number];

// Translation status types
export const TRANSLATION_STATUS = [
  "pending",
  "extracting",
  "translating",
  "reconstructing",
  "completed",
  "failed",
] as const;
export type TranslationStatus = typeof TRANSLATION_STATUS[number];

// Languages supported for translation
export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Japanese",
  "Chinese",
  "Russian",
  "Portuguese",
  "Korean",
  "Arabic",
  "Hindi",
] as const;
export type Language = typeof LANGUAGES[number];

// Translation projects table
export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  originalFileUrl: text("original_file_url"),
  translatedFileUrl: text("translated_file_url"),
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  customPrompt: text("custom_prompt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  error: text("error"),
  metadata: json("metadata"),
  totalPages: integer("total_pages"),
  completedPages: integer("completed_pages").default(0),
});

// Schema for creating a new translation
export const insertTranslationSchema = createInsertSchema(translations)
  .pick({
    userId: true,
    fileName: true,
    fileType: true,
    sourceLanguage: true,
    targetLanguage: true,
    customPrompt: true,
  })
  .extend({
    fileType: z.enum(SUPPORTED_FILE_TYPES),
    sourceLanguage: z.enum(LANGUAGES),
    targetLanguage: z.enum(LANGUAGES),
  });

export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;

// Schema for updating a translation
export const updateTranslationSchema = createInsertSchema(translations)
  .pick({
    status: true,
    progress: true,
    translatedFileUrl: true,
    error: true,
    completedPages: true,
    totalPages: true,
  })
  .partial();

export type UpdateTranslation = z.infer<typeof updateTranslationSchema>;

// Define relations after all tables are declared
export const usersRelations = relations(users, ({ many }) => ({
  translations: many(translations),
  settings: many(userSettings),
}));

export const translationsRelations = relations(translations, ({ one }) => ({
  user: one(users, {
    fields: [translations.userId],
    references: [users.id],
  }),
}));
