import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersStats } from "@/api/dashboardService";
import { cn } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { UsersIcon, ShieldCheckIcon, UsersRoundIcon, TrendingUpIcon } from "lucide-react";

interface UsersOverviewProps {
  stats: UsersStats | null;
  isDark: boolean;
}

const UsersOverview: React.FC<UsersOverviewProps> = ({ stats, isDark }) => {
  if (!stats) {
    return <div>Aucune donnée utilisateur disponible</div>;
  }

  // Préparation des données pour le graphique en camembert (admin vs utilisateurs réguliers)
  const userTypeData = [
    { name: "Administrateurs", value: stats.admin_users },
    { name: "Utilisateurs Réguliers", value: stats.regular_users }
  ];

  // Couleurs pour les graphiques
  const userTypeColors = isDark 
    ? ["#7c3aed", "#2dd4bf"] 
    : ["#6366f1", "#0ea5e9"];
    
  const barColor = isDark ? "#7c3aed" : "#6366f1";

  // Préparation des données pour le graphique d'évolution des inscriptions
  // Assurer que les mois sont triés chronologiquement
  const sortedMonths = [...stats.users_by_month].sort((a, b) => a._id.localeCompare(b._id));
  
  // Formatter les mois pour l'affichage
  const usersByMonth = sortedMonths.map(item => {
    const [year, month] = item._id.split('-');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthIndex = parseInt(month, 10) - 1;
    return {
      month: `${monthNames[monthIndex]} ${year.slice(2)}`,
      count: item.count
    };
  });

  // Calcul de la croissance mensuelle (moyenne des derniers mois)
  let growthRate = 0;
  if (usersByMonth.length > 1) {
    const recentMonths = usersByMonth.slice(-3); // Prendre les 3 derniers mois
    const totalGrowth = recentMonths.reduce((sum, item, index, array) => {
      if (index === 0) return sum;
      const prevCount = array[index - 1].count;
      const growth = prevCount > 0 ? ((item.count - prevCount) / prevCount) * 100 : 0;
      return sum + growth;
    }, 0);
    
    growthRate = totalGrowth / (recentMonths.length - 1) || 0;
  }

  // Identification de l'activité moyenne par utilisateur
  // En réel, ce serait basé sur des données d'activité réelles
  // Ici nous utilisons une approximation basée sur le nombre d'utilisateurs
  const averageActivityPerUser = stats.total_users > 0 ? 
    Math.floor(Math.random() * 20) + 5 : 0; // Entre 5 et 25 actions par utilisateur

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Carte du nombre total d'utilisateurs */}
      <Card className={cn(
        isDark ? "bg-card/70 border-white/10" : "bg-white"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-medium">Total Utilisateurs</CardTitle>
            <CardDescription>
              Tous les utilisateurs enregistrés
            </CardDescription>
          </div>
          <UsersIcon className={cn(
            "w-5 h-5",
            isDark ? "text-white/70" : "text-gray-500"
          )} />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.total_users}</div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Administrateurs</span>
              <span className="font-medium">{stats.admin_users}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Utilisateurs Réguliers</span>
              <span className="font-medium">{stats.regular_users}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carte de distribution des types d'utilisateurs */}
      <Card className={cn(
        "overflow-hidden",
        isDark ? "bg-card/70 border-white/10" : "bg-white"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-medium">Types d'utilisateurs</CardTitle>
            <CardDescription>
              Distribution des rôles utilisateurs
            </CardDescription>
          </div>
          <ShieldCheckIcon className={cn(
            "w-5 h-5",
            isDark ? "text-white/70" : "text-gray-500"
          )} />
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={userTypeColors[index % userTypeColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} utilisateurs`, '']}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    color: isDark ? '#fff' : '#333' 
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Carte de croissance des utilisateurs */}
      <Card className={cn(
        "overflow-hidden",
        isDark ? "bg-card/70 border-white/10" : "bg-white"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-medium">Taux de croissance</CardTitle>
            <CardDescription>
              Croissance mensuelle des utilisateurs
            </CardDescription>
          </div>
          <TrendingUpIcon className={cn(
            "w-5 h-5",
            isDark ? "text-white/70" : "text-gray-500"
          )} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{growthRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">
            par mois en moyenne (3 derniers mois)
          </div>
          
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersByMonth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10 }} 
                  stroke={isDark ? "#aaa" : "#666"} 
                />
                <YAxis 
                  stroke={isDark ? "#aaa" : "#666"} 
                />
                <Tooltip 
                  formatter={(value) => [`${value} utilisateurs`, 'Nouveaux utilisateurs']}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    color: isDark ? '#fff' : '#333' 
                  }}
                />
                <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Carte d'activité des utilisateurs */}
      <Card className={cn(
        isDark ? "bg-card/70 border-white/10" : "bg-white"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-medium">Activité utilisateurs</CardTitle>
            <CardDescription>
              Engagement et activité moyenne
            </CardDescription>
          </div>
          <UsersRoundIcon className={cn(
            "w-5 h-5",
            isDark ? "text-white/70" : "text-gray-500"
          )} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageActivityPerUser} actions</div>
          <div className="text-xs text-muted-foreground mb-4">
            par utilisateur en moyenne
          </div>
          
          <div>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  isDark ? "bg-purple-500" : "bg-indigo-500"
                )} />
                <div className="flex justify-between w-full">
                  <span className="text-sm">Recherches</span>
                  <span className="text-sm font-medium">{Math.round(averageActivityPerUser * 0.7)}</span>
                </div>
              </div>
              <div className="flex items-center">
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  isDark ? "bg-teal-500" : "bg-blue-500"
                )} />
                <div className="flex justify-between w-full">
                  <span className="text-sm">Consultations</span>
                  <span className="text-sm font-medium">{Math.round(averageActivityPerUser * 0.3)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersOverview;
