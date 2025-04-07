import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PlanProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  buttonVariant?: "default" | "outline";
}

function Plan({ 
  name, 
  price, 
  description, 
  features, 
  isPopular, 
  buttonText,
  buttonVariant = "outline"
}: PlanProps) {
  return (
    <div className={`
      ${isPopular 
        ? "border-2 border-primary-500 rounded-lg p-8 bg-white shadow-lg relative" 
        : "border border-gray-200 rounded-lg p-8 bg-white shadow-sm hover:shadow-md transition-shadow"
      }
    `}>
      {isPopular && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900">{name}</h3>
      <p className="mt-4 text-3xl font-bold text-gray-900">{price}<span className="text-lg font-normal text-gray-500">/month</span></p>
      <p className="mt-4 text-gray-600">
        {description}
      </p>
      <ul className="mt-6 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex">
            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <span className="text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Button 
          className="w-full" 
          variant={buttonVariant}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

export function Pricing() {
  return (
    <div id="pricing" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Choose the plan that works for your translation needs.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Plan
            name="Basic"
            price="$9.99"
            description="Perfect for occasional translations."
            features={[
              "5 books per month",
              "Max 300 pages per book",
              "10 language pairs",
              "Email support"
            ]}
            buttonText="Choose Basic"
            buttonVariant="outline"
          />

          <Plan
            name="Professional"
            price="$24.99"
            description="For regular translation requirements."
            features={[
              "20 books per month",
              "Unlimited pages",
              "All language pairs",
              "Priority support",
              "Custom translation prompts"
            ]}
            isPopular={true}
            buttonText="Choose Professional"
            buttonVariant="default"
          />

          <Plan
            name="Enterprise"
            price="$99.99"
            description="For businesses with high-volume needs."
            features={[
              "Unlimited books",
              "Unlimited pages",
              "All language pairs",
              "24/7 dedicated support",
              "API access",
              "Custom integrations"
            ]}
            buttonText="Contact Sales"
            buttonVariant="outline"
          />
        </div>
      </div>
    </div>
  );
}
