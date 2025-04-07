import {
  Languages,
  PaintBucket,
  BookOpen,
  Upload,
  Gauge,
  History
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">
        {description}
      </p>
    </div>
  );
}

export function Features() {
  return (
    <div id="features" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Powerful Translation Features</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge AI with careful preservation of your document's formatting.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Languages className="h-6 w-6" />}
            title="Google Gemini 2.0 Flash AI"
            description="Powered by Google's most advanced AI translation model for high-quality, context-aware translations."
          />
          
          <FeatureCard
            icon={<PaintBucket className="h-6 w-6" />}
            title="Format Preservation"
            description="Maintains the original formatting, layout, and styling of your EPUB and PDF documents."
          />
          
          <FeatureCard
            icon={<BookOpen className="h-6 w-6" />}
            title="Chapter Structure"
            description="Intelligently preserves chapter structure and organization in your translated documents."
          />
          
          <FeatureCard
            icon={<Upload className="h-6 w-6" />}
            title="Simple Upload Process"
            description="Just drag and drop your EPUB or PDF file and let our system handle the rest."
          />
          
          <FeatureCard
            icon={<Gauge className="h-6 w-6" />}
            title="Real-time Progress"
            description="Monitor your translation progress in real-time with our interactive dashboard."
          />
          
          <FeatureCard
            icon={<History className="h-6 w-6" />}
            title="Translation History"
            description="Access all your previous translations with our organized project management system."
          />
        </div>
      </div>
    </div>
  );
}
