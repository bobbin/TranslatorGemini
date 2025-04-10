import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "./use-toast";
import { apiRequest } from "../lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  plan: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored user on initial load
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);

    // Also fetch current user from server to verify session is still valid
    const verifySession = async () => {
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } else if (res.status === 401) {
          // Session expired, clear local storage
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Failed to verify session", error);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/login", { username, password });
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/register", {
        username,
        email,
        password,
        plan: "free",
      });
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      toast({
        title: "Registration successful",
        description: `Welcome to TraduLibro, ${userData.username}!`,
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}