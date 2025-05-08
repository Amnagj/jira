
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../../lib/utils"
import { useTheme } from "@/hooks/useTheme"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const { theme } = useTheme();
    const isDark = theme === "dark";
    
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/20": variant === "default",
            "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
            [isDark ? "border border-white/20 bg-transparent text-white hover:bg-white/5" : "border border-gray-300 bg-transparent text-gray-800 hover:bg-gray-50"]: variant === "outline",
            [isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-800 hover:bg-gray-200"]: variant === "secondary",
            [isDark ? "text-white hover:text-white hover:bg-white/10" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"]: variant === "ghost",
            [isDark ? "text-blue-400 underline-offset-4 hover:underline" : "text-blue-600 underline-offset-4 hover:underline"]: variant === "link",
          },
          {
            "h-10 py-2 px-4": size === "default",
            "h-9 px-3 rounded-md text-sm": size === "sm",
            "h-11 px-8 rounded-md": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

// Export buttonVariants for use in other components
export const buttonVariants = (props?: Partial<ButtonProps>) => {
  const { variant = "default", size = "default" } = props || {}
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
    {
      "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/20": variant === "default",
      "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
      [isDark ? "border border-white/20 bg-transparent text-white hover:bg-white/5" : "border border-gray-300 bg-transparent text-gray-800 hover:bg-gray-50"]: variant === "outline",
      [isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-800 hover:bg-gray-200"]: variant === "secondary",
      [isDark ? "text-white hover:text-white hover:bg-white/10" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"]: variant === "ghost",
      [isDark ? "text-blue-400 underline-offset-4 hover:underline" : "text-blue-600 underline-offset-4 hover:underline"]: variant === "link",
    },
    {
      "h-10 py-2 px-4": size === "default",
      "h-9 px-3 rounded-md text-sm": size === "sm",
      "h-11 px-8 rounded-md": size === "lg",
      "h-10 w-10": size === "icon",
    }
  )
}
