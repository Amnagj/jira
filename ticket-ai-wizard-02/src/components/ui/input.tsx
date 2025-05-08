
import * as React from "react"
import { cn } from "../../lib/utils"
import { useTheme } from "@/hooks/useTheme"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
          isDark
            ? "bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            : "bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
