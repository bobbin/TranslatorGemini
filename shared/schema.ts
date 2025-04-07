import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  plan: text("plan").default("free").notNull(), // 'free', 'pro', 'enterprise'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  plan: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // 'epub', 'pdf'
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  status: text("status").notNull(), // 'pending', 'processing', 'completed', 'failed'
  progress: integer("progress").default(0).notNull(), // percentage completed
  originalFilePath: text("original_file_path"),
  translatedFilePath: text("translated_file_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  metadata: json("metadata").default({}).notNull(), // store additional metadata like chapters, page count, etc.
});

export const insertTranslationSchema = createInsertSchema(translations).pick({
  userId: true,
  fileName: true,
  fileType: true,
  sourceLanguage: true,
  targetLanguage: true,
  status: true,
  originalFilePath: true,
});

export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;

export const translationChapters = pgTable("translation_chapters", {
  id: serial("id").primaryKey(),
  translationId: integer("translation_id").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  chapterTitle: text("chapter_title"),
  status: text("status").notNull(), // 'pending', 'processing', 'completed', 'failed'
  progress: integer("progress").default(0).notNull(), // percentage completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranslationChapterSchema = createInsertSchema(translationChapters).pick({
  translationId: true,
  chapterNumber: true,
  chapterTitle: true,
  status: true,
});

export type InsertTranslationChapter = z.infer<typeof insertTranslationChapterSchema>;
export type TranslationChapter = typeof translationChapters.$inferSelect;
