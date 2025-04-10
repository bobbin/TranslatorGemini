import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

// Crear una tienda de sesiones PostgreSQL
const PostgresStore = connectPg(session);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Extender la sesión de Express para incluir userId
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Middleware for checking if user is authenticated - use this instead of req.isAuthenticated()
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "No autenticado" });
  }
  
  // Add user to request object
  const userId = req.session.userId;
  storage.getUser(userId)
    .then(user => {
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }
      
      // Add user to request object (compatible con passport)
      (req as any).user = user;
      (req as any).isAuthenticated = () => true;
      
      next();
    })
    .catch(err => {
      console.error("Error al obtener usuario:", err);
      res.status(500).json({ message: "Error del servidor" });
    });
}

export function setupAuth(app: Express) {
  // Configurar una clave secreta de sesión fija para desarrollo
  const sessionSecret = process.env.SESSION_SECRET || 'tradulibro-secret-key-for-development-fixed';

  // Configurar la sesión
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PostgresStore({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semana
      httpOnly: true,
      secure: false, // Desactivar para desarrollo
      sameSite: 'lax',
      path: '/'
    }
  };

  // Aplicar middleware de sesión
  app.use(session(sessionSettings));

  // Autenticación más simple sin Passport.js
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, fullName } = req.body;
      
      // Validar campos requeridos
      if (!username || !password || !email) {
        return res.status(400).json({ message: "Se requieren nombre de usuario, contraseña y correo electrónico" });
      }
      
      // Comprobar si el usuario ya existe
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      // Crear el usuario
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        email,
        fullName: fullName || null
      });

      // Crear configuración predeterminada para el usuario
      await storage.createUserSettings({
        userId: user.id,
        uiTheme: "system",
        defaultSourceLanguage: "English",
        defaultTargetLanguage: "Spanish",
        emailNotifications: true
      });

      // Iniciar sesión
      req.session.userId = user.id;
      
      // No devolver la contraseña al cliente
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      console.error("Error al registrar:", err);
      res.status(500).json({ message: "Error al registrar usuario" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validar campos requeridos
      if (!username || !password) {
        return res.status(400).json({ message: "Se requieren nombre de usuario y contraseña" });
      }
      
      // Buscar usuario
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
      
      // Verificar contraseña
      const passwordValid = await comparePasswords(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
      
      // Iniciar sesión
      req.session.userId = user.id;
      
      // Registrar sesión iniciada
      console.log("Sesión iniciada para usuario:", user.id);
      console.log("Datos de sesión:", req.session);
      
      // No devolver la contraseña al cliente
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      res.status(500).json({ message: "Error al iniciar sesión" });
    }
  });

  app.post("/api/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Error al cerrar sesión" });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Sesión cerrada correctamente" });
      });
    } else {
      res.status(200).json({ message: "No hay sesión activa" });
    }
  });

  app.get("/api/user", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "No autenticado" });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }
      
      // No devolver la contraseña al cliente
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Error al obtener usuario:", err);
      res.status(500).json({ message: "Error del servidor" });
    }
  });
}