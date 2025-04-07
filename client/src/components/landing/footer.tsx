import { FC } from "react";
import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Github } from "lucide-react";

const footerLinks = [
  { text: "Acerca de", href: "#" },
  { text: "Blog", href: "#" },
  { text: "Empleos", href: "#" },
  { text: "Prensa", href: "#" },
  { text: "Socios", href: "#" },
  { text: "Privacidad", href: "#" },
  { text: "Términos", href: "#" },
];

const socialLinks = [
  { 
    icon: <Facebook className="h-5 w-5" />, 
    href: "#", 
    label: "Facebook" 
  },
  { 
    icon: <Instagram className="h-5 w-5" />, 
    href: "#", 
    label: "Instagram" 
  },
  { 
    icon: <Twitter className="h-5 w-5" />, 
    href: "#", 
    label: "Twitter" 
  },
  { 
    icon: <Github className="h-5 w-5" />, 
    href: "#", 
    label: "GitHub" 
  },
];

const Footer: FC = () => {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          {footerLinks.map((link, index) => (
            <div key={index} className="px-5 py-2">
              <Link href={link.href} className="text-base text-gray-500 hover:text-gray-900">
                {link.text}
              </Link>
            </div>
          ))}
        </nav>
        <div className="mt-8 flex justify-center space-x-6">
          {socialLinks.map((socialLink, index) => (
            <a 
              key={index}
              href={socialLink.href}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">{socialLink.label}</span>
              {socialLink.icon}
            </a>
          ))}
        </div>
        <p className="mt-8 text-center text-base text-gray-400">
          &copy; {new Date().getFullYear()} TraduLibro. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
