import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileUpload } from "@/components/ui/file-upload";
import { LANGUAGES } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Languages } from "lucide-react";

const formSchema = z.object({
  sourceLanguage: z.string().min(1, "Source language is required"),
  targetLanguage: z.string().min(1, "Target language is required"),
  customPrompt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function TranslationForm({ onTranslationCreated }: { onTranslationCreated?: (id: number) => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get languages from API
  const { data: languagesData } = useQuery({
    queryKey: ['/api/languages'],
  });

  const languages = languagesData?.languages || LANGUAGES;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceLanguage: "English",
      targetLanguage: "Spanish",
      customPrompt: "",
    },
  });

  const createTranslation = useMutation({
    mutationFn: async (data: FormValues & { file: File }) => {
      setIsUploading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("sourceLanguage", data.sourceLanguage);
      formData.append("targetLanguage", data.targetLanguage);
      
      if (data.customPrompt) {
        formData.append("customPrompt", data.customPrompt);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);

      try {
        const response = await fetch('/api/translations', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }

        return await response.json();
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/translations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/translations/recent'] });
      
      toast({
        title: "Translation started",
        description: "Your file is being processed for translation",
      });
      
      if (onTranslationCreated) {
        onTranslationCreated(data.id);
      }
      
      // Reset form
      form.reset();
      setSelectedFile(null);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error starting translation",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file);
  };

  const onSubmit = (values: FormValues) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to translate",
        variant: "destructive",
      });
      return;
    }

    createTranslation.mutate({
      ...values,
      file: selectedFile,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FileUpload
          accept=".epub,.pdf"
          onFileSelected={handleFileSelected}
          uploading={isUploading}
          uploadProgress={uploadProgress}
          selectedFile={selectedFile}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sourceLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Language</FormLabel>
                <Select
                  disabled={isUploading}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Language</FormLabel>
                <Select
                  disabled={isUploading}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="customPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Translation Prompt (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any specific instructions for the AI translation..."
                  className="resize-none"
                  rows={3}
                  disabled={isUploading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="flex items-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Languages className="mr-2 h-4 w-4" />
                Start Translation
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
