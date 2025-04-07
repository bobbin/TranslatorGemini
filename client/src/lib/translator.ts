import { apiRequest } from "./queryClient";

// Languages supported by the translation service
export const languages = [
  { code: "auto", name: "Autodetectar" },
  { code: "es", name: "Español" },
  { code: "en", name: "Inglés" },
  { code: "fr", name: "Francés" },
  { code: "de", name: "Alemán" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Portugués" },
  { code: "ru", name: "Ruso" },
  { code: "zh", name: "Chino" },
  { code: "ja", name: "Japonés" },
  { code: "ko", name: "Coreano" },
  { code: "ar", name: "Árabe" },
  { code: "hi", name: "Hindi" },
];

// Translation styles
export const translationStyles = [
  { 
    id: "standard",
    name: "Estándar (recomendado)",
    description: "Traduce manteniendo un equilibrio entre precisión y naturalidad."
  },
  { 
    id: "literal",
    name: "Literal",
    description: "Traduce palabra por palabra, manteniendo la mayor fidelidad posible al texto original."
  },
  { 
    id: "technical",
    name: "Técnico",
    description: "Optimizado para documentos técnicos, preservando terminología específica."
  },
  { 
    id: "literary",
    name: "Literario",
    description: "Ideal para literatura, manteniendo el estilo narrativo y adaptando elementos culturales."
  },
  { 
    id: "coloquial",
    name: "Coloquial",
    description: "Traduce a un lenguaje más informal y conversacional."
  },
];

// Get language name from code
export function getLanguageName(code: string): string {
  const language = languages.find(lang => lang.code === code);
  return language ? language.name : code;
}

// Get translation style name from id
export function getStyleName(id: string): string {
  const style = translationStyles.find(style => style.id === id);
  return style ? style.name : id;
}

// Utility function to create a new translation
export async function createTranslation(
  userId: number,
  file: File,
  sourceLanguage: string,
  targetLanguage: string,
  translationStyle: string = "standard"
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId.toString());
  formData.append("sourceLanguage", sourceLanguage);
  formData.append("targetLanguage", targetLanguage);
  formData.append("translationStyle", translationStyle);
  
  const response = await apiRequest("POST", "/api/translations", formData);
  return response.json();
}

// Utility function to get a translation's status
export async function getTranslationStatus(id: number) {
  const response = await apiRequest("GET", `/api/translations/${id}`);
  return response.json();
}

// Utility function to download a translated file
export function downloadTranslatedFile(id: number, fileName: string) {
  window.location.href = `/api/translations/${id}/download`;
}
