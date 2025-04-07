import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function CallToAction() {
  return (
    <div className="bg-primary-600 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Ready to translate your books?</h2>
          <p className="mt-4 text-xl text-primary-100 max-w-3xl mx-auto">
            Get started today and experience the power of AI-assisted book translation.
          </p>
          <div className="mt-8">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-50">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
