import { Link } from "wouter";
import {
  Twitter,
  Facebook,
  Instagram,
  Linkedin
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold">TranslateBooks</h3>
            <p className="mt-4 text-gray-400">
              AI-powered book translation platform preserving original formatting.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">Product</h4>
            <ul className="mt-4 space-y-2">
              <li><Link href="#features" className="text-gray-400 hover:text-white">Features</Link></li>
              <li><Link href="#pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">API</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">Company</h4>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-white">About</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Blog</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Careers</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">Legal</h4>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-white">Privacy</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Terms</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} TranslateBooks. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">Twitter</span>
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">Facebook</span>
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">Instagram</span>
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
