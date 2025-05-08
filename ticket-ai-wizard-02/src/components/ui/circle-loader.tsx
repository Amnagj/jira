import { Loader2 } from "lucide-react";

type CircleLoaderProps = {
  size?: "small" | "medium" | "large";
};

export const CircleLoader = ({ size = "medium" }: CircleLoaderProps) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-8 w-8",
  };

  return (
    <Loader2 className={`animate-spin text-blue-500 ${sizeClasses[size]}`} />
  );
};
