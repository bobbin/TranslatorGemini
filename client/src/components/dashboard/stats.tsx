import { FC } from "react";
import { Book, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsProps {
  stats: {
    totalTranslations: number;
    completedTranslations: number;
    inProgressTranslations: number;
  };
}

const Stats: FC<StatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary rounded-md p-3">
              <Book className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total de traducciones
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {stats.totalTranslations}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-emerald-500 rounded-md p-3">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Traducciones completadas
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {stats.completedTranslations}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  En proceso
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {stats.inProgressTranslations}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stats;
