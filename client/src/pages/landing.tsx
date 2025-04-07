import { FC } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import Logo from "@/components/ui/logo";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import Pricing from "@/components/landing/pricing";
import Testimonials from "@/components/landing/testimonials";
import CTA from "@/components/landing/cta";
import Footer from "@/components/landing/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Landing: FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>TraduLibro - Traducción de libros con IA</title>
        <meta name="description" content="Traduce tus libros EPUB y PDF a cualquier idioma conservando el formato original gracias a la potencia de Google Gemini 2.0 Flash AI." />
      </Helmet>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Logo />
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#features" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary">Características</a>
                <a href="#how-it-works" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary">Cómo funciona</a>
                <a href="#pricing" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary">Precios</a>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="default">Ir al Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary">
                      Iniciar sesión
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="default" className="ml-3">
                      Registrarse
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                    <span className="sr-only">Abrir menú principal</span>
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col space-y-4 mt-8">
                    <a href="#features" className="px-3 py-2 text-base font-medium text-gray-500 hover:text-primary">Características</a>
                    <a href="#how-it-works" className="px-3 py-2 text-base font-medium text-gray-500 hover:text-primary">Cómo funciona</a>
                    <a href="#pricing" className="px-3 py-2 text-base font-medium text-gray-500 hover:text-primary">Precios</a>
                    <div className="pt-4 border-t border-gray-200">
                      {user ? (
                        <Link href="/dashboard">
                          <Button className="w-full">Ir al Dashboard</Button>
                        </Link>
                      ) : (
                        <>
                          <Link href="/login">
                            <Button variant="outline" className="w-full mb-2">Iniciar sesión</Button>
                          </Link>
                          <Link href="/register">
                            <Button className="w-full">Registrarse</Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
