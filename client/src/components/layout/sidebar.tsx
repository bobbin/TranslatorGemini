import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  History,
  Folder,
  UserCircle,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, href, active, onClick }: SidebarItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50",
          active && "bg-primary-50 text-primary-600 border-r-4 border-primary-600"
        )}
        onClick={onClick}
      >
        {icon}
        <span className="ml-3">{label}</span>
      </a>
    </Link>
  );
}

interface SidebarProps {
  closeMobileSidebar?: () => void;
}

export default function Sidebar({ closeMobileSidebar }: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useMobile();

  const handleItemClick = () => {
    if (isMobile && closeMobileSidebar) {
      closeMobileSidebar();
    }
  };

  return (
    <div className="w-64 bg-white shadow-md h-full">
      <div className="px-6 py-6">
        <div className="flex items-center">
          <Link href="/">
            <span className="text-primary-600 font-bold text-xl cursor-pointer">TranslateBooks</span>
          </Link>
        </div>
      </div>
      <nav className="mt-6">
        <div className="px-4 py-2">
          <p className="text-xs uppercase text-gray-500 font-medium">Main</p>
        </div>
        
        <SidebarItem 
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          href="/dashboard"
          active={location === "/dashboard"}
          onClick={handleItemClick}
        />
        
        <SidebarItem 
          icon={<History className="h-5 w-5" />}
          label="Translation History"
          href="/translations"
          active={location === "/translations"}
          onClick={handleItemClick}
        />
        
        <SidebarItem 
          icon={<Folder className="h-5 w-5" />}
          label="My Projects"
          href="/projects" 
          active={location === "/projects"}
          onClick={handleItemClick}
        />
        
        <div className="px-4 py-2 mt-4">
          <p className="text-xs uppercase text-gray-500 font-medium">Account</p>
        </div>
        
        <SidebarItem 
          icon={<UserCircle className="h-5 w-5" />}
          label="Profile"
          href="/profile"
          active={location === "/profile"}
          onClick={handleItemClick}
        />
        
        <SidebarItem 
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          href="/settings"
          active={location === "/settings"}
          onClick={handleItemClick}
        />
        
        <SidebarItem 
          icon={<HelpCircle className="h-5 w-5" />}
          label="Help & Support"
          href="/help"
          active={location === "/help"}
          onClick={handleItemClick}
        />
        
        <div className="mt-auto px-6 py-4">
          <Button 
            variant="ghost"
            className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-50"
            onClick={() => {
              // Handle logout logic here
              window.location.href = "/";
            }}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </nav>
    </div>
  );
}
