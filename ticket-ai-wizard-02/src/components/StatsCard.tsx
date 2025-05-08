
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BarChart, LineChart, PieChart } from "recharts";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatsCardProps) => {
  return (
    <div
      className={cn(
        "glass-card p-6 rounded-xl hover-scale",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <div className="mt-2 flex items-baseline">
            <h3 className="text-2xl font-bold">{value}</h3>
            {trend && (
              <span
                className={cn(
                  "ml-2 text-sm",
                  trend.isPositive ? "text-green-500" : "text-red-500"
                )}
              >
                {trend.isPositive ? "+" : "-"}
                {trend.value}%
              </span>
            )}
          </div>
          {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
        </div>
        {icon && <div className="p-2 bg-darkblue-800 rounded-lg">{icon}</div>}
      </div>
    </div>
  );
};

interface ChartCardProps {
  title: string;
  chart: "line" | "bar" | "pie";
  data: any[];
  className?: string;
}

export const ChartCard = ({ title, chart, data, className }: ChartCardProps) => {
  const renderChart = () => {
    switch (chart) {
      case "line":
        return (
          <LineChart width={300} height={150} data={data}>
            {/* LineChart configuration would go here */}
          </LineChart>
        );
      case "bar":
        return (
          <BarChart width={300} height={150} data={data}>
            {/* BarChart configuration would go here */}
          </BarChart>
        );
      case "pie":
        return (
          <PieChart width={300} height={150}>
            {/* PieChart configuration would go here */}
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "glass-card p-6 rounded-xl hover-scale",
        className
      )}
    >
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className="h-[150px]">{renderChart()}</div>
    </div>
  );
};
