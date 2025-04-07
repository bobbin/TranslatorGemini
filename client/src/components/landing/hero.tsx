import { FC } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const Hero: FC = () => {
  return (
    <div className="py-12 sm:py-16 bg-gradient-to-r from-primary to-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              <span className="block">Traduce libros con</span>
              <span className="block text-indigo-200">inteligencia artificial</span>
            </h1>
            <p className="mt-3 text-base text-white sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
              Traduce tus libros EPUB y PDF a cualquier idioma conservando el formato original gracias a la potencia de Google Gemini 2.0 Flash AI.
            </p>
            <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
              <Link href="/register">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  Comenzar gratis
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="ml-4 bg-white text-primary-600 hover:bg-gray-50">
                  Ver demo
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
            <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
              <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                <svg
                  className="w-full"
                  viewBox="0 0 600 400"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="600" height="400" fill="#e2e8f0" />
                  <path d="M150 100 L450 100 L450 300 L150 300 Z" fill="#f8fafc" />
                  <path d="M200 150 L400 150" stroke="#cbd5e1" strokeWidth="4" />
                  <path d="M200 180 L400 180" stroke="#cbd5e1" strokeWidth="4" />
                  <path d="M200 210 L400 210" stroke="#cbd5e1" strokeWidth="4" />
                  <path d="M200 240 L350 240" stroke="#cbd5e1" strokeWidth="4" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button variant="default" className="h-16 w-16 rounded-full flex items-center justify-center">
                    <Play className="h-8 w-8" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
