
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordInput } from "./PasswordInput";
import { loginSchema, LoginFormValues } from "../lib/auth-schemas";
import { useTheme } from "@/hooks/useTheme";

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void;
  isLoading: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isDark ? "label-cosmic" : "text-gray-700 font-medium"}>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="votre.email@exemple.com" 
                  {...field} 
                  className="cosmic-input"
                />
              </FormControl>
              <FormMessage className={isDark ? "text-red-300" : "text-red-500"} />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <PasswordInput 
              control={form.control} 
              name="password" 
              label="Mot de passe" 
              {...field}
              labelClass={isDark ? "label-cosmic" : "text-gray-700 font-medium"}
              inputClass="cosmic-input"
            />
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full cosmic-button py-6 relative overflow-hidden group" 
          disabled={isLoading}
        >
          <span className="relative z-10">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                Chargement...
              </>
            ) : "Se connecter"}
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        </Button>
        
      
      </form>
    </Form>
  );
};
