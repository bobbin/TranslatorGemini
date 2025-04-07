import { FC } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Bell,
  User
} from "lucide-react";
import Logo from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  onNewTranslation: () => void;
}

const Header: FC<HeaderProps> = ({ onNewTranslation }) => {
  const { user, logout } = useAuth();
  
  const userInitials = user?.username 
    ? user.username.substring(0, 2).toUpperCase()
    : "U";
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Logo />
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Button 
                onClick={onNewTranslation}
                className="relative inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Nueva traducción</span>
              </Button>
            </div>
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className="rounded-full text-gray-400 hover:text-gray-500"
              >
                <Bell className="h-5 w-5" />
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="ml-3 rounded-full"
                    aria-label="User menu"
                  >
                    <Avatar>
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
