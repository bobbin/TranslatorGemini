import { FC } from "react";
import { Book, Brain, Globe, FileType, Gauge, Cloud } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Book className="text-white h-5 w-5" />,
    title: "Mantiene el formato original",
    description: "Preservamos la estructura, imágenes, tablas y maquetación de tus archivos EPUB y PDF durante la traducción.",
  },
  {
    icon: <Brain className="text-white h-5 w-5" />,
    title: "Inteligencia artificial Gemini 2.0",
    description: "Aprovecha el poder de Gemini 2.0 Flash de Google para obtener traducciones rápidas, precisas y de alta calidad.",
  },
  {
    icon: <Globe className="text-white h-5 w-5" />,
    title: "Múltiples idiomas",
    description: "Traduce a más de 100 idiomas diferentes manteniendo la naturalidad y fluidez del texto.",
  },
  {
    icon: <FileType className="text-white h-5 w-5" />,
    title: "Compatible con EPUB y PDF",
    description: "Soporta los formatos más populares para libros electrónicos y documentos.",
  },
  {
    icon: <Gauge className="text-white h-5 w-5" />,
    title: "Procesamiento rápido",
    description: "Traduce libros enteros en minutos gracias a nuestra optimizada infraestructura en la nube.",
  },
  {
    icon: <Cloud className="text-white h-5 w-5" />,
    title: "Almacenamiento en la nube",
    description: "Accede a tus traducciones desde cualquier dispositivo con nuestra solución en la nube.",
  },
];

const Features: FC = () => {
  return (
    <div id="features" className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Características</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
            Traduce con precisión y mantén el formato
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            La combinación perfecta entre inteligencia artificial avanzada y procesamiento de documentos.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary rounded-md shadow-lg">
                        {feature.icon}
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.title}</h3>
                    <p className="mt-5 text-base text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
