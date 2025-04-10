import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Translations from "@/pages/translations";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import HelpPage from "@/pages/help";
import ProjectsPage from "@/pages/projects";
import Navbar from "@/components/layout/navbar";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth } from "./hooks/use-auth";

function Router() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Don't show navbar on dashboard and other protected routes, auth page, or when not authenticated
  const showNavbar = 
    !location.startsWith("/dashboard") && 
    !location.startsWith("/translations") && 
    !location.startsWith("/profile") && 
    !location.startsWith("/settings") && 
    !location.startsWith("/help") && 
    !location.startsWith("/projects") && 
    !location.startsWith("/auth") && 
    (location === "/" || user);

  return (
    <>
      {showNavbar && <Navbar />}
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/translations" component={Translations} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <ProtectedRoute path="/help" component={HelpPage} />
        <ProtectedRoute path="/projects" component={ProjectsPage} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
