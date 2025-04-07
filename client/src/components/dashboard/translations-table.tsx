import { FC } from "react";
import { Link } from "wouter";
import { FileText, FileType } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";

interface Translation {
  id: number;
  fileName: string;
  fileType: string;
  sourceLanguage: string;
  targetLanguage: string;
  status: string;
  createdAt: string;
}

interface TranslationsTableProps {
  translations: Translation[];
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
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

const TranslationsTable: FC<TranslationsTableProps> = ({ translations }) => {
  return (
    <div className="mt-8">
      <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Traducciones recientes</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Formato</TableHead>
              <TableHead>Idioma origen</TableHead>
              <TableHead>Idioma destino</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead aria-label="Acciones"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {translations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No tienes traducciones aún. Empieza creando una nueva traducción.
                </TableCell>
              </TableRow>
            ) : (
              translations.map((translation) => (
                <TableRow key={translation.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg">
                        {translation.fileType === "epub" ? (
                          <FileText className="h-5 w-5 text-gray-500" />
                        ) : (
                          <FileType className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {translation.fileName}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="uppercase">{translation.fileType}</TableCell>
                  <TableCell>{translation.sourceLanguage}</TableCell>
                  <TableCell>{translation.targetLanguage}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(translation.status)} variant="outline">
                      {getStatusText(translation.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistance(new Date(translation.createdAt), new Date(), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell>
                    {translation.status === "completed" ? (
                      <a 
                        href={`/api/translations/${translation.id}/download`}
                        className="text-primary hover:text-primary-600"
                      >
                        Descargar
                      </a>
                    ) : translation.status === "processing" || translation.status === "pending" ? (
                      <Link href={`/translation/${translation.id}`}>
                        <Button variant="link" className="text-primary hover:text-primary-600">
                          Ver progreso
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-gray-400">No disponible</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TranslationsTable;
