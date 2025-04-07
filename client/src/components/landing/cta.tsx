import { FC } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const CTA: FC = () => {
  return (
    <div className="bg-primary">
      <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          <span className="block">¿Listo para traducir tus libros?</span>
          <span className="block">Prueba TraduLibro hoy.</span>
        </h2>
        <p className="mt-4 text-lg leading-6 text-indigo-100">
          Comienza a traducir tus libros y documentos con la potencia de la IA. Regístrate gratis y prueba nuestra plataforma.
        </p>
        <Link href="/register">
          <Button 
            size="lg" 
            className="mt-8 px-5 py-3 text-base font-medium rounded-md text-primary-600 bg-white hover:bg-indigo-50"
            variant="outline"
          >
            Registrarse gratis
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CTA;
