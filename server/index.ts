import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { startBatchProcessing } from "./lib/batch-processor";

const app = express();

// Verificar traducciones pendientes cada 5 minutos
const CHECK_PENDING_INTERVAL = 5 * 60 * 1000; // 5 minutos en milisegundos

async function checkPendingTranslations() {
  try {
    const pendingTranslations = await storage.getTranslationsByStatus('batch_processing');
    
    for (const translation of pendingTranslations) {
      // Solo reintentar si han pasado más de 2 minutos desde la última verificación
      const lastChecked = translation.lastChecked ? new Date(translation.lastChecked) : null;
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      
      if (!lastChecked || lastChecked < twoMinutesAgo) {
        if (translation.batchId) {
          log(`Restarting batch processing for translation ${translation.id}`);
          startBatchProcessing(translation.id, translation.batchId);
        }
      }
    }
  } catch (error) {
    log(`Error checking pending translations: ${error}`, 'error');
  }
}

// Iniciar el proceso de verificación periódica
setInterval(checkPendingTranslations, CHECK_PENDING_INTERVAL);

// Ejecutar una verificación inicial al arrancar
checkPendingTranslations();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
