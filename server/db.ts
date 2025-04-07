import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import { log } from "./vite";

// Check required environment variable
if (!process.env.DATABASE_URL) {
  log("DATABASE_URL environment variable is not set", "db");
  process.exit(1);
}

// Create Postgres client
export const queryClient = postgres(process.env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });

// Log DB connection
log("Database connection established", "db");