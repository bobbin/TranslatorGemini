import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  BookText, 
  FileText, 
  FolderOpen, 
  HelpCircle, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  User 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

function SidebarItem({ href, icon, children, isActive }: SidebarItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
          isActive ? "bg-muted font-medium text-primary" : "text-muted-foreground"
        )}
      >
        {icon}
        <span>{children}</span>
      </a>
    </Link>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="hidden border-r bg-background lg:block lg:w-64">
      <div className="flex h-screen flex-col p-4">
        <div className="flex items-center gap-2 px-2">
          <BookText className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">TraduLibro</span>
        </div>
        
        <ScrollArea className="flex-1 py-6">
          <nav className="flex flex-col gap-1 px-2">
            <SidebarItem 
              href="/dashboard" 
              icon={<LayoutDashboard className="h-4 w-4" />}
              isActive={location === "/dashboard"}
            >
              Dashboard
            </SidebarItem>
            
            <SidebarItem 
              href="/translations" 
              icon={<FileText className="h-4 w-4" />}
              isActive={location.startsWith("/translations")}
            >
              Translations
            </SidebarItem>
            
            <SidebarItem 
              href="/projects" 
              icon={<FolderOpen className="h-4 w-4" />}
              isActive={location === "/projects"}
            >
              My Projects
            </SidebarItem>
          </nav>
          
          <div className="mt-6">
            <h4 className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Settings
            </h4>
            <nav className="flex flex-col gap-1 px-2">
              <SidebarItem 
                href="/profile" 
                icon={<User className="h-4 w-4" />}
                isActive={location === "/profile"}
              >
                Profile
              </SidebarItem>
              
              <SidebarItem 
                href="/settings" 
                icon={<Settings className="h-4 w-4" />}
                isActive={location === "/settings"}
              >
                Settings
              </SidebarItem>
              
              <SidebarItem 
                href="/help" 
                icon={<HelpCircle className="h-4 w-4" />}
                isActive={location === "/help"}
              >
                Help
              </SidebarItem>
            </nav>
          </div>
        </ScrollArea>
        
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 px-2 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{user?.username || "User"}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.plan || "Free"} Plan</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}