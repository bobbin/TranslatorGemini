import { FC, useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UploadCloud, BookOpen, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FormSchema = z.object({
  sourceLanguage: z.string().min(1, { message: "Por favor selecciona un idioma" }),
  targetLanguage: z.string().min(1, { message: "Por favor selecciona un idioma" }),
  translationStyle: z.string().min(1, { message: "Por favor selecciona un estilo" }),
});

type FormValues = z.infer<typeof FormSchema>;

const languages = [
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
  { value: "fr", label: "Francés" },
  { value: "de", label: "Alemán" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Portugués" },
  { value: "ru", label: "Ruso" },
  { value: "zh", label: "Chino" },
  { value: "ja", label: "Japonés" },
  { value: "ar", label: "Árabe" },
];

const translationStyles = [
  { value: "standard", label: "Estándar (recomendado)" },
  { value: "literal", label: "Literal" },
  { value: "technical", label: "Técnico" },
  { value: "literary", label: "Literario" },
  { value: "coloquial", label: "Coloquial" },
];

interface UploadTranslationProps {
  onTranslationCreated: () => void;
}

const UploadTranslation: FC<UploadTranslationProps> = ({ onTranslationCreated }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      sourceLanguage: "es",
      targetLanguage: "en",
      translationStyle: "standard",
    },
  });
  
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/translations", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Traducción creada",
        description: "Tu traducción ha sido creada y está siendo procesada.",
      });
      setFile(null);
      onTranslationCreated();
    },
    onError: (error) => {
      toast({
        title: "Error al crear la traducción",
        description: error instanceof Error ? error.message : "Por favor intenta de nuevo",
        variant: "destructive",
      });
    },
  });
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };
  
  const onSubmit = (values: FormValues) => {
    if (!file) {
      toast({
        title: "Archivo requerido",
        description: "Por favor selecciona un archivo para traducir.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Sesión expirada",
        description: "Por favor inicia sesión de nuevo.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.id.toString());
    formData.append("sourceLanguage", values.sourceLanguage);
    formData.append("targetLanguage", values.targetLanguage);
    formData.append("translationStyle", values.translationStyle);
    
    uploadMutation.mutate(formData);
  };
  
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Nueva traducción</CardTitle>
        <CardDescription>
          Sube un archivo EPUB o PDF para traducirlo a otro idioma.
        </CardDescription>
      </CardHeader>
      <CardContent>
{!file ? (
        <div
          className={`max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-1 text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
              >
                <span>Sube un archivo</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".epub,.pdf"
                  onChange={handleFileChange}
                />
              </label>
              <p className="pl-1">o arrastra y suelta</p>
            </div>
            <p className="text-xs text-gray-500">
              EPUB o PDF hasta 20 MB
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-lg border-2 border-green-300 bg-green-50 rounded-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {file.name.endsWith('.epub') ? (
                  <BookOpen className="h-8 w-8 text-green-500" />
                ) : (
                  <File className="h-8 w-8 text-green-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setFile(null)}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <FormField
                  control={form.control}
                  name="sourceLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idioma origen</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un idioma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto">Autodetectar</SelectItem>
                          {languages.map((language) => (
                            <SelectItem key={language.value} value={language.value}>
                              {language.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="sm:col-span-3">
                <FormField
                  control={form.control}
                  name="targetLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idioma destino</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un idioma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((language) => (
                            <SelectItem key={language.value} value={language.value}>
                              {language.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="sm:col-span-6">
                <FormField
                  control={form.control}
                  name="translationStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estilo de traducción</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estilo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {translationStyles.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={uploadMutation.isPending || !file}
            >
              {uploadMutation.isPending ? "Subiendo..." : "Iniciar traducción"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UploadTranslation;
