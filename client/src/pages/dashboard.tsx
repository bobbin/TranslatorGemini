import { FC, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Helmet } from "react-helmet";
import Header from "@/components/dashboard/header";
import Stats from "@/components/dashboard/stats";
import TranslationsTable from "@/components/dashboard/translations-table";
import UploadTranslation from "@/components/dashboard/upload-translation";
import { queryClient } from "@/lib/queryClient";

const Dashboard: FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showUpload, setShowUpload] = useState(false);

  // Fetch user translations
  const {
    data: translations = [],
    isLoading: translationsLoading,
    error: translationsError,
  } = useQuery({
    queryKey: user ? [`/api/translations/${user.id}`] : null,
    enabled: !!user,
  });

  // Calculate stats based on translations
  const stats = {
    totalTranslations: translations.length,
    completedTranslations: translations.filter((t: any) => t.status === "completed").length,
    inProgressTranslations: translations.filter((t: any) => ["pending", "processing"].includes(t.status)).length,
  };

  // Handle new translation button click
  const handleNewTranslation = () => {
    setShowUpload(true);
    // Scroll to upload form
    setTimeout(() => {
      const uploadElement = document.getElementById("upload-section");
      if (uploadElement) {
        uploadElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Handle translation created event
  const handleTranslationCreated = () => {
    // Refetch translations
    queryClient.invalidateQueries({ queryKey: [`/api/translations/${user?.id}`] });
    setShowUpload(false);
    
    toast({
      title: "¡Traducción iniciada!",
      description: "Tu archivo está siendo procesado. Puedes ver el progreso en la tabla de traducciones.",
    });
  };

  // Show error if translations cannot be loaded
  useEffect(() => {
    if (translationsError) {
      toast({
        title: "Error al cargar traducciones",
        description: "No se pudieron cargar tus traducciones. Por favor, intenta de nuevo más tarde.",
        variant: "destructive",
      });
    }
  }, [translationsError, toast]);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>Dashboard - TraduLibro</title>
      </Helmet>

      <Header onNewTranslation={handleNewTranslation} />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {/* Stats Cards */}
            <Stats stats={stats} />

            {/* Translations Table */}
            {translationsLoading ? (
              <div className="mt-8 p-8 text-center">
                <p className="text-gray-500">Cargando traducciones...</p>
              </div>
            ) : (
              <TranslationsTable translations={translations} />
            )}

            {/* Upload New Translation Section */}
            {showUpload && (
              <div id="upload-section">
                <UploadTranslation onTranslationCreated={handleTranslationCreated} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
