import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    if (location !== "/") {
      window.location.href = `/#${id}`;
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? "bg-white shadow-sm" : "bg-white/80 backdrop-blur-sm"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <span className="text-primary-600 font-bold text-xl cursor-pointer">TranslateBooks</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection("features")}
              className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection("how-it-works")}
              className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection("pricing")}
              className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
            >
              Pricing
            </button>
            
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <span className="font-medium">{user.username}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      Plan: <span className="font-medium capitalize ml-1">{user.plan}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/auth">
                <Button>Iniciar sesión</Button>
              </Link>
            )}
          </div>
          <div className="flex md:hidden items-center">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button
              onClick={() => scrollToSection("features")}
              className="text-gray-600 hover:text-primary-600 block px-3 py-2 text-base font-medium w-full text-left"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-gray-600 hover:text-primary-600 block px-3 py-2 text-base font-medium w-full text-left"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-gray-600 hover:text-primary-600 block px-3 py-2 text-base font-medium w-full text-left"
            >
              Pricing
            </button>
            
            {user ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2">
                  <Button className="w-full">Dashboard</Button>
                </Link>
                <div className="px-3 py-2">
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="font-medium text-gray-700">{user.username}</p>
                    <p className="text-sm text-gray-500 capitalize">Plan: {user.plan}</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="w-full mt-2" 
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/auth" className="block px-3 py-2">
                <Button className="w-full">Iniciar sesión</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
