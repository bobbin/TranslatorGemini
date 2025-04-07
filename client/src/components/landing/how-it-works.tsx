import { FC } from "react";

const HowItWorks: FC = () => {
  return (
    <div id="how-it-works" className="py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Cómo funciona</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
            Traduce tus libros en 3 simples pasos
          </p>
        </div>

        <div className="relative mt-12 lg:mt-16 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
          <div className="relative">
            <div className="relative text-base mx-auto">
              <div className="space-y-12">
                {/* Step 1 */}
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <span className="text-lg font-bold">1</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Sube tu archivo</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Simplemente arrastra y suelta tu archivo EPUB o PDF en nuestra plataforma. Detectaremos automáticamente el formato y el idioma original.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <span className="text-lg font-bold">2</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Selecciona el idioma de destino</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Elige entre más de 100 idiomas disponibles para la traducción. Puedes personalizar el estilo de traducción según tus necesidades.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <span className="text-lg font-bold">3</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Descarga tu libro traducido</h3>
                    <p className="mt-2 text-base text-gray-500">
                      En cuestión de minutos, recibirás tu archivo traducido listo para descargar, manteniendo el formato original.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 mx-auto relative lg:mt-0">
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
              <svg
                className="w-full h-auto"
                viewBox="0 0 600 500"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="600" height="500" fill="#f8fafc" />
                <rect x="100" y="100" width="400" height="300" rx="8" fill="#f1f5f9" />
                <rect x="150" y="150" width="300" height="50" rx="4" fill="#e2e8f0" />
                <rect x="150" y="220" width="300" height="50" rx="4" fill="#e2e8f0" />
                <rect x="150" y="290" width="150" height="50" rx="4" fill="#4f46e5" />
                <path d="M180 315 L190 325 L210 300" stroke="white" strokeWidth="3" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
