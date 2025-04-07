import { FC } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Testimonial {
  content: string;
  author: {
    name: string;
    role: string;
    initials: string;
  };
  stars: number;
}

const testimonials: Testimonial[] = [
  {
    content: "He traducido tres novelas con TraduLibro y estoy impresionado por la calidad de las traducciones. El formato se mantiene intacto y el texto suena natural.",
    author: {
      name: "María González",
      role: "Escritora independiente",
      initials: "MG",
    },
    stars: 5,
  },
  {
    content: "Como editorial pequeña, TraduLibro nos ha permitido expandir nuestro catálogo a nuevos mercados sin grandes inversiones en traductores profesionales.",
    author: {
      name: "Carlos Ruiz",
      role: "Editor de Libros Modernos",
      initials: "CR",
    },
    stars: 5,
  },
  {
    content: "Utilizo TraduLibro para traducir documentos técnicos y manuales de usuario. La precisión en términos técnicos es sorprendente y el formato PDF se mantiene perfectamente.",
    author: {
      name: "Ana Martínez",
      role: "Ingeniera de documentación",
      initials: "AM",
    },
    stars: 4.5,
  },
];

const StarRating: FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex text-yellow-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-current"
              : star - 0.5 <= rating
              ? "fill-current opacity-50"
              : "fill-none"
          }`}
        />
      ))}
    </div>
  );
};

const Testimonials: FC = () => {
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Testimonios</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
            Lo que dicen nuestros usuarios
          </p>
        </div>
        <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="flex flex-col overflow-hidden h-full">
              <CardContent className="flex-1 pt-6">
                <div className="flex items-center">
                  <StarRating rating={testimonial.stars} />
                </div>
                <p className="mt-3 text-base text-gray-500">
                  "{testimonial.content}"
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{testimonial.author.initials}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{testimonial.author.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.author.role}</p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
