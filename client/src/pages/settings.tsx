import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserSettings {
  id: number;
  userId: number;
  darkMode: boolean;
  emailNotifications: boolean;
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
}

const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "userId"> = {
  darkMode: false,
  emailNotifications: true,
  defaultSourceLanguage: "English",
  defaultTargetLanguage: "Spanish",
};

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [settings, setSettings] = useState<Omit<UserSettings, "id" | "userId">>(DEFAULT_SETTINGS);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Fetch user settings and available languages
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch languages
        const langResponse = await fetch("/api/languages");
        const langData = await langResponse.json();
        setLanguages(langData.languages || []);

        // Fetch user settings
        try {
          const settingsResponse = await fetch("/api/user-settings");
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            setSettings({
              darkMode: settingsData.darkMode,
              emailNotifications: settingsData.emailNotifications,
              defaultSourceLanguage: settingsData.defaultSourceLanguage,
              defaultTargetLanguage: settingsData.defaultTargetLanguage,
            });
          }
        } catch (error) {
          console.error("Failed to fetch user settings:", error);
          // Use defaults if settings can't be fetched
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error loading settings",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handleSwitchChange = (field: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSelectChange = (value: string, field: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Esta ruta deberá implementarse en el servidor
      await apiRequest("POST", "/api/user-settings", settings);
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || loadingSettings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="translation">Translation</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
                <CardDescription>
                  Customize your application experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="darkMode" className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for the application
                    </p>
                  </div>
                  <Switch
                    id="darkMode"
                    checked={settings.darkMode}
                    onCheckedChange={() => handleSwitchChange("darkMode")}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="translation">
            <Card>
              <CardHeader>
                <CardTitle>Translation Settings</CardTitle>
                <CardDescription>
                  Default languages and translation preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sourceLanguage">Default Source Language</Label>
                    <Select
                      value={settings.defaultSourceLanguage}
                      onValueChange={(value) => handleSelectChange(value, "defaultSourceLanguage")}
                    >
                      <SelectTrigger id="sourceLanguage">
                        <SelectValue placeholder="Select source language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="targetLanguage">Default Target Language</Label>
                    <Select
                      value={settings.defaultTargetLanguage}
                      onValueChange={(value) => handleSelectChange(value, "defaultTargetLanguage")}
                    >
                      <SelectTrigger id="targetLanguage">
                        <SelectValue placeholder="Select target language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications when translations are complete
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={() => handleSwitchChange("emailNotifications")}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}