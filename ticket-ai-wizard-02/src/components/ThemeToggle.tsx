
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Sun size={16} className="text-yellow-400 dark:text-gray-400" />
      <Switch 
        checked={theme === "dark"}
        onCheckedChange={toggleTheme}
        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-blue-400"
      />
      <Moon size={16} className="text-gray-400 dark:text-blue-300" />
    </div>
  );
};

export default ThemeToggle;
