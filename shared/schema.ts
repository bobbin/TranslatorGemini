import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
