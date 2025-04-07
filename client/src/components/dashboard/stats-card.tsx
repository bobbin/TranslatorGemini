import { ReactNode } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
}

export function StatsCard({ icon, label, value }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-primary-100 text-primary-600">
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-gray-500 text-sm">{label}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
