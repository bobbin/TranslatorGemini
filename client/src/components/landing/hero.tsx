import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Hero() {
  return (
    <div className="bg-gradient-to-r from-primary-600 to-[#8B5CF6] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              AI-Powered Book Translation
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-primary-50">
              Translate your EPUBs and PDFs instantly while preserving the original formatting using Google Gemini 2.0 Flash AI.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button size="lg" variant="default" className="bg-white text-primary-700 hover:bg-primary-50">
                  Start Translating
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                onClick={() => {
                  const element = document.getElementById('how-it-works');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative">
              <svg className="w-full" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
                <rect width="560" height="320" x="20" y="40" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
                <rect width="180" height="280" x="40" y="60" rx="4" fill="#e2e8f0" />
                <rect width="320" height="40" x="240" y="60" rx="4" fill="#e2e8f0" />
                <rect width="320" height="220" x="240" y="120" rx="4" fill="#e2e8f0" />
              </svg>
              <div className="absolute -left-8 -bottom-8 w-64 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-gray-800 font-medium">Translation Complete</p>
                </div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
