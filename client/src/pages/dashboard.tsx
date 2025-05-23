import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Languages, HardDrive } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TranslationForm } from "@/components/dashboard/translation-form";
import { TranslationItem } from "@/components/dashboard/translation-item";
import { TranslationProgressModal } from "@/components/dashboard/translation-progress-modal";
import { Translation } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";

export default function Dashboard() {
  const [selectedTranslationId, setSelectedTranslationId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useMobile();

  // Fetch recent translations
  const { data: translations, isLoading } = useQuery<Translation[]>({
    queryKey: ['/api/translations/recent'],
  });

  // Calculate stats
  const stats = {
    booksTranslated: translations?.filter(t => t.status === 'completed').length || 0,
    languagesUsed: translations 
      ? [...new Set([...translations.map(t => t.sourceLanguage), ...translations.map(t => t.targetLanguage)])].length 
      : 0,
    storageUsed: "0 MB", // This would be calculated from actual file sizes in a real app
  };

  const handleViewDetails = (id: number) => {
    setSelectedTranslationId(id);
    setIsModalOpen(true);
  };

  const handleTranslationCreated = (id: number) => {
    setSelectedTranslationId(id);
    setIsModalOpen(true);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar */}
      {isMobile && isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileSidebarOpen(false)}>
          <div className="fixed inset-y-0 left-0 z-50 h-full w-64" onClick={(e) => e.stopPropagation()}>
            <Sidebar closeMobileSidebar={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="w-64 fixed inset-y-0">
          <Sidebar />
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 ${!isMobile ? "ml-64" : ""}`}>
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            {isMobile && (
              <button 
                onClick={toggleMobileSidebar}
                className="text-gray-600 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatsCard 
              icon={<BookOpen className="h-5 w-5" />}
              label="Books Translated"
              value={stats.booksTranslated}
            />
            <StatsCard 
              icon={<Languages className="h-5 w-5" />}
              label="Languages Used"
              value={stats.languagesUsed}
            />
            <StatsCard 
              icon={<HardDrive className="h-5 w-5" />}
              label="Storage Used"
              value={stats.storageUsed}
            />
          </div>

          {/* New Translation Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Translation</CardTitle>
              <CardDescription>Upload a file and select languages to start translation</CardDescription>
            </CardHeader>
            <CardContent>
              <TranslationForm onTranslationCreated={handleTranslationCreated} />
            </CardContent>
          </Card>

          {/* Recent Translations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Translations</CardTitle>
                <CardDescription>Your recently translated documents</CardDescription>
              </div>
              <Link href="/translations">
                <Button variant="outline" size="sm">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : translations && translations.length > 0 ? (
                translations.map((translation) => (
                  <TranslationItem
                    key={translation.id}
                    translation={translation}
                    onViewDetails={handleViewDetails}
                  />
                ))
              ) : (
                <div className="py-16 text-center">
                  <p className="text-gray-500">No translations found. Start by uploading a file above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Translation Progress Modal */}
      <TranslationProgressModal
        translationId={selectedTranslationId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
