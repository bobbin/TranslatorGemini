import { FC } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  button: {
    text: string;
    variant: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    action: string;
  };
  highlight?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: "Gratuito",
    description: "Perfecto para probar la plataforma y hacer pequeñas traducciones.",
    price: "€0",
    period: "/mes",
    features: [
      "Hasta 3 traducciones al mes",
      "Archivos de hasta 1 MB",
      "Soporte por email",
    ],
    button: {
      text: "Comenzar gratis",
      variant: "outline",
      action: "/register",
    },
  },
  {
    name: "Profesional",
    description: "Ideal para traducciones regulares y libros de mayor tamaño.",
    price: "€19",
    period: "/mes",
    features: [
      "Traducciones ilimitadas",
      "Archivos de hasta 20 MB",
      "Soporte prioritario",
      "Personalización avanzada de traducciones",
    ],
    button: {
      text: "Obtener plan Pro",
      variant: "default",
      action: "/register",
    },
    highlight: true,
  },
  {
    name: "Empresarial",
    description: "Para editoriales y traductores profesionales.",
    price: "€49",
    period: "/mes",
    features: [
      "Todo lo del plan Pro",
      "Archivos de hasta 50 MB",
      "API para integraciones",
      "Soporte personalizado 24/7",
    ],
    button: {
      text: "Contactar ventas",
      variant: "outline",
      action: "/contact",
    },
  },
];

const Pricing: FC = () => {
  return (
    <div id="pricing" className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Precios</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
            Planes que se adaptan a tus necesidades
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            Elije el plan que mejor se ajuste a tus necesidades de traducción.
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={plan.highlight ? "border-primary" : ""}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-2 mb-8">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-base font-medium text-gray-500">{plan.period}</span>
                </div>
                
                <div>
                  <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">¿Qué incluye?</h3>
                  <ul className="mt-4 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <div className="flex-shrink-0">
                          <Check className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="ml-3 text-sm text-gray-500">{feature}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={plan.button.action}>
                  <Button 
                    className="w-full" 
                    variant={plan.button.variant}
                  >
                    {plan.button.text}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
