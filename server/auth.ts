import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

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

export function setupAuth(app: Express) {
  // Set up a session secret
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    name: 'connect.sid',
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user: Express.User, done) => {
    console.log('Serializing user:', user);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing id:', id);
      console.log('Type of id:', typeof id);
      
      if (typeof id !== 'number') {
        console.log('Converting id to number');
        id = Number(id);
      }
      
      const user = await storage.getUser(id);
      console.log('Deserialized user:', user);
      if (!user) {
        console.log('User not found for id:', id);
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error('Error deserializing user:', err);
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, fullName } = req.body;
      
      // Validate required fields
      if (!username || !password || !email) {
        return res.status(400).json({ message: "Username, password, and email are required" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        email,
        fullName: fullName || null
      });

      // Create default settings for the user
      await storage.createUserSettings({
        userId: user.id,
        uiTheme: "system",
        defaultSourceLanguage: "English",
        defaultTargetLanguage: "Spanish",
        emailNotifications: true
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }

      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't send the password back to the client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}