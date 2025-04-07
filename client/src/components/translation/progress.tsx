import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, RotateCw, FileText, Info } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProgressComponentProps {
  translationId: number;
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "completed":
      return "Completado";
    case "processing":
      return "En proceso";
    case "pending":
      return "Pendiente";
    case "failed":
      return "Fallido";
    default:
      return status;
  }
}

const TranslationProgress: FC<ProgressComponentProps> = ({ translationId }) => {
  // Fetch translation details
  const { data: translation, isLoading: translationLoading } = useQuery({
    queryKey: [`/api/translations/${translationId}`],
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });
  
  // Fetch chapters
  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: [`/api/translations/${translationId}/chapters`],
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });
  
  if (translationLoading || chaptersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RotateCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Cargando progreso...</span>
      </div>
    );
  }
  
  if (!translation) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-500">
          No se pudo cargar la información de la traducción.
        </p>
      </div>
    );
  }
  
  // Create simulated log entries based on status and progress
  const logEntries = [];
  const now = new Date();
  
  if (translation.status === "pending" || translation.status === "processing" || translation.status === "completed") {
    logEntries.push(`[${now.toLocaleTimeString()}] Iniciando proceso de traducción`);
    logEntries.push(`[${now.toLocaleTimeString()}] Analizando archivo ${translation.fileType.toUpperCase()}`);
    logEntries.push(`[${now.toLocaleTimeString()}] Extrayendo contenido y estructura`);
    
    if (chapters && chapters.length > 0) {
      logEntries.push(`[${now.toLocaleTimeString()}] Identificados ${chapters.length} capítulos`);
      
      const completedChapters = chapters.filter(ch => ch.status === "completed");
      const processingChapters = chapters.filter(ch => ch.status === "processing");
      
      completedChapters.forEach(ch => {
        logEntries.push(`[${now.toLocaleTimeString()}] Capítulo ${ch.chapterNumber} traducido`);
      });
      
      processingChapters.forEach(ch => {
        logEntries.push(`[${now.toLocaleTimeString()}] Traduciendo Capítulo ${ch.chapterNumber} (${ch.progress}%)`);
      });
    }
    
    if (translation.status === "completed") {
      logEntries.push(`[${now.toLocaleTimeString()}] Traducción completa`);
      logEntries.push(`[${now.toLocaleTimeString()}] Reconstruyendo archivo ${translation.fileType.toUpperCase()}`);
      logEntries.push(`[${now.toLocaleTimeString()}] Archivo traducido listo para descargar`);
    }
  }
  
  return (
    <Card className="border-4 border-dashed border-gray-200 rounded-lg">
      <CardHeader>
        <CardTitle>Progreso de la traducción</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-2">
          <div>
            <div className="flex justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">Procesando capítulos</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">{translation.progress}%</span>
              </div>
            </div>
            <Progress value={translation.progress} className="mt-2" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Step 1: Extracting */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${
                    translation.progress > 0 ? "bg-emerald-500" : "bg-gray-200"
                  }`}>
                    {translation.progress > 0 ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Extracción de contenido
                      </dt>
                      <dd>
                        <div className="text-sm text-gray-900">
                          {translation.progress > 0 ? "Completado" : "Pendiente"}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Translating */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${
                    translation.progress > 0 && translation.progress < 100 
                      ? "bg-amber-500" 
                      : translation.progress === 100 
                        ? "bg-emerald-500" 
                        : "bg-gray-200"
                  }`}>
                    {translation.progress > 0 && translation.progress < 100 ? (
                      <RotateCw className="h-5 w-5 text-white animate-spin" />
                    ) : translation.progress === 100 ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Traducción con IA
                      </dt>
                      <dd>
                        <div className="text-sm text-gray-900">
                          {translation.progress > 0 && translation.progress < 100
                            ? `En proceso (${chapters?.filter(ch => ch.status === 'completed').length || 0}/${chapters?.length || 0} capítulos)`
                            : translation.progress === 100
                            ? "Completado"
                            : "Pendiente"}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Rebuilding */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${
                    translation.progress === 100 && translation.status === "completed"
                      ? "bg-emerald-500"
                      : translation.progress === 100 && translation.status === "processing"
                      ? "bg-amber-500"
                      : "bg-gray-200"
                  }`}>
                    {translation.progress === 100 && translation.status === "completed" ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : translation.progress === 100 && translation.status === "processing" ? (
                      <RotateCw className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Reconstrucción de archivo
                      </dt>
                      <dd>
                        <div className="text-sm text-gray-900">
                          {translation.progress === 100 && translation.status === "completed"
                            ? "Completado"
                            : translation.progress === 100 && translation.status === "processing"
                            ? "En proceso"
                            : "Pendiente"}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chapter Progress */}
          {chapters && chapters.length > 0 && (
            <div className="mt-8">
              <h4 className="text-base font-medium text-gray-900">Progreso por capítulo</h4>
              <div className="mt-4 max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Capítulo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Progreso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chapters.map((chapter) => (
                      <TableRow key={chapter.id}>
                        <TableCell className="font-medium">
                          {chapter.chapterTitle || `Capítulo ${chapter.chapterNumber}`}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(chapter.status)} variant="outline">
                            {getStatusText(chapter.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Progress value={chapter.progress} className="w-full h-2" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Translation Log */}
          <div className="mt-8">
            <h4 className="text-base font-medium text-gray-900">Registro de actividad</h4>
            <div className="mt-2 p-4 bg-gray-50 rounded-md max-h-48 overflow-y-auto text-sm text-gray-500">
              {logEntries.map((entry, index) => (
                <p key={index}>{entry}</p>
              ))}
            </div>
          </div>

          <Alert className="mt-8">
            <Info className="h-4 w-4" />
            <AlertTitle>Información</AlertTitle>
            <AlertDescription>
              Puedes cerrar esta ventana y volver más tarde. Tu traducción seguirá procesándose y estará disponible en tu dashboard cuando esté completa.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default TranslationProgress;
