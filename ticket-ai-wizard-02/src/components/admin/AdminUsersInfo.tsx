

import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";


export const AdminUsersInfo = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";


  return (
    <Card className={cn(
      "p-8 relative",
      isDark ? "bg-card/70 border-white/10" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center mb-5">
        <h2 className="text-lg font-medium">Informations</h2>
      </div>
      <br />
     
      <div className="space-y-4">
        <p className={isDark ? "text-gray-300" : "text-gray-700"}>
          La création d'un nouvel utilisateur génère un compte avec les autorisations standards
          (non administrateur).
        </p>
        <br />
        <p className={isDark ? "text-gray-300" : "text-gray-700"}>
          L'utilisateur recevra un email contenant:
        </p>
       
        <ul className="list-disc pl-5 space-y-2">
          <li className={isDark ? "text-gray-300" : "text-gray-700"}>
            Son nom d'utilisateur
          </li>
          <li className={isDark ? "text-gray-300" : "text-gray-700"}>
            Un mot de passe généré aléatoirement
          </li>
          <li className={isDark ? "text-gray-300" : "text-gray-700"}>
            Un lien pour se connecter à l'application
          </li>
        </ul>
        <br />


        <p className={isDark ? "text-gray-300" : "text-gray-700"}>
          Au besoin, modifiez ses permissions en remplaçant son rôle d'utilisateur par celui d'administrateur dans la liste.
        </p>
       
        <br />
        <div className="pt-4">
          <p className={isDark ? "text-yellow-300" : "text-yellow-600"}>
            Assurez-vous que l'adresse email est correcte et que le serveur de messagerie est correctement configuré.
          </p>
        </div>
        <br />
      </div>
    </Card>
  );
};



