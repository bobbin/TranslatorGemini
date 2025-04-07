import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { TranslationItem } from "@/components/dashboard/translation-item";
import { TranslationProgressModal } from "@/components/dashboard/translation-progress-modal";
import { Translation } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";

export default function Translations() {
  const [selectedTranslationId, setSelectedTranslationId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useMobile();

  // Fetch all translations
  const { data: translations, isLoading } = useQuery<Translation[]>({
    queryKey: ['/api/translations'],
  });

  // Mutation for retrying a failed translation
  const retryTranslation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PATCH', `/api/translations/${id}`, {
        status: 'pending',
        progress: 0,
        error: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/translations'] });
      toast({
        title: "Translation restarted",
        description: "Your translation is being processed again",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error restarting translation",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    }
  });

  const handleViewDetails = (id: number) => {
    setSelectedTranslationId(id);
    setIsModalOpen(true);
  };

  const handleRetry = (id: number) => {
    retryTranslation.mutate(id);
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
            <h1 className="text-2xl font-semibold text-gray-900">Translation History</h1>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Translations Content */}
        <main className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Translations</CardTitle>
              <CardDescription>All your translation projects</CardDescription>
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
                    onRetry={handleRetry}
                  />
                ))
              ) : (
                <div className="py-16 text-center">
                  <p className="text-gray-500">No translations found. Go to dashboard to start a new translation.</p>
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
