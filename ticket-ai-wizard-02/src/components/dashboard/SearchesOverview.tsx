import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { SearchesStats, getSearchesStats } from "@/api/dashboardService";
import {
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  BarChart as BarChartIcon,
  GitBranch,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface SearchesOverviewProps {
  stats: SearchesStats | null;
  isDark: boolean;
  onProjectChange?: (project: string | null) => void;
}


const SearchesOverview: React.FC<SearchesOverviewProps> = ({
  stats,
  isDark
}) => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [filteredStats, setFilteredStats] = useState<SearchesStats | null>(stats);
  const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
    const fetchProjectData = async () => {
      if (selectedProject === "all") {
        setFilteredStats(stats);
        return;
      }
      setLoading(true);

      try {
        const response = await getSearchesStats(selectedProject);
        if (response.status === 'success' && response.stats) {
          setFilteredStats(response.stats);
        } else {
          // En cas d'erreur, on revient aux stats complètes
          setFilteredStats(stats);
        }
      } catch (error) {
        console.error("Erreur lors du filtrage par projet:", error);
        setFilteredStats(stats);
      }finally {
        setLoading(false);
      }

    };
    
    fetchProjectData();
  }, [selectedProject, stats]);

  if (!filteredStats) {
    return <div>Aucune donnée disponible</div>;
  }

  // Handler pour le changement de projet
  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
  };

  // Préparer les données pour le graphique par date
  const searchesByDateData = filteredStats.searches_by_date.map((item) => ({
    date: item._id,
    count: item.count,
  }));


  // Préparer les données pour les utilisateurs
  const topUsersData = filteredStats.top_users.map((item) => ({
    username: item.username || "Utilisateur inconnu",
    count: item.count,
  }));


  // Données pour le graphique de réussite
  const successRateData = [
    { name: "Réussies", value: filteredStats.success_searches },
    { name: "Échouées", value: filteredStats.error_searches },
  ];


  // Données pour le taux d'automatisation
  const automationRateData = [
    { name: "Automatisables", value: filteredStats.automation_rate },
    { name: "Manuels", value: 100 - filteredStats.automation_rate },
  ];


  // Données pour le volume par projet
  const projectVolumeData = filteredStats.project_volume.map((item) => ({
    project: item._id || "Non spécifié",
    count: item.count,
  }));


  // Données pour la distribution des scores de similarité
  const similarityDistributionData = filteredStats.similarity_distribution
    ? filteredStats.similarity_distribution.map((item) => ({
        range:
          typeof item._id === "number"
            ? `${item._id}-${item._id + 10}`
            : item._id.toString(),
        count: item.count,
      }))
    : [];


  // Couleurs pour les graphiques
  const colors = [
    "#4f46e5",
    "#7c3aed",
    "#8b5cf6",
    "#a78bfa",
    "#c4b5fd",
    "#ddd6fe",
    "#ede9fe",
    "#f5f3ff",
    "#6366f1",
    "#818cf8",
  ];
  const successColors = ["#10b981", "#ef4444"];
  const automationColors = ["#3b82f6", "#94a3b8"];


  // Calculer le taux de réussite
  const totalSearchesWithStatus = filteredStats.success_searches + filteredStats.error_searches;
  const successRate =
    totalSearchesWithStatus > 0
      ? Math.round((filteredStats.success_searches / totalSearchesWithStatus) * 100)
      : 0;


  return (
    <div className="space-y-4">
      {/* Filtre par projet */}
      <div className="flex justify-end">
        <div className="w-64">
          <Select
            onValueChange={handleProjectChange}
            value={selectedProject}
            defaultValue="all"
            disabled={loading}

          >
            <SelectTrigger
              className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
            >
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <SelectValue placeholder="Filtrer par projet" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {filteredStats.projects && filteredStats.projects.length > 0 ? (
                filteredStats.projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project || "Non spécifié"}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no_projects" disabled>
                  Aucun projet disponible
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nombre total de recherches */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total des recherches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredStats.total_searches}</div>
          </CardContent>
        </Card>


        {/* Temps de réponse moyen */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock size={18} />
              Temps de réponse moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredStats.avg_response_time
                ? `${filteredStats.avg_response_time.toFixed(2)} s`
                : "N/A"}
            </div>
          </CardContent>
        </Card>


        {/* Taux d'automatisation */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap size={18} />
              Taux d'automatisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredStats.automation_rate
                ? `${filteredStats.automation_rate.toFixed(1)}%`
                : "0%"}
            </div>
          </CardContent>
        </Card>


        {/* Score de similarité moyen */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch size={18} />
              Similarité moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredStats.avg_similarity
                ? `${filteredStats.avg_similarity.toFixed(1)}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Taux de réussite */}
        <Card
          className={cn(
            "col-span-1",
            isDark ? "bg-card/70 border-white/10" : "bg-white"
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {successRate >= 70 ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <XCircle size={20} className="text-red-500" />
              )}
              Taux de réussite
            </CardTitle>
            <CardDescription>
              Pourcentage de recherches réussies
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successRateData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {successRateData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={successColors[index % successColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>


        {/* Taux d'automatisation */}
        <Card
          className={cn(
            "col-span-1",
            isDark ? "bg-card/70 border-white/10" : "bg-white"
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap size={20} />
              Automatisation
            </CardTitle>
            <CardDescription>Tickets automatisables vs manuels</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={automationRateData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {automationRateData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={automationColors[index % automationColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>


        {/* Distribution des scores de similarité */}
        <Card
          className={cn(
            "col-span-1",
            isDark ? "bg-card/70 border-white/10" : "bg-white"
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon size={20} />
              Distribution des scores
            </CardTitle>
            <CardDescription>
              Répartition des scores de similarité
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={similarityDistributionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                />
                <XAxis
                  dataKey="range"
                  stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                />
                <YAxis
                  stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                />
                <Bar dataKey="count" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>


      {/* Graphiques étendus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Volume par projet */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader>
            <CardTitle>Volume par projet</CardTitle>
            <CardDescription>
              Nombre de tickets traités par projet
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectVolumeData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                />
                <XAxis
                  type="number"
                  stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                />
                <YAxis
                  dataKey="project"
                  type="category"
                  stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                  width={90}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                />
                <Bar dataKey="count">
                  {projectVolumeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>


        {/* Recherches par date */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader>
            <CardTitle>Évolution des recherches</CardTitle>
            <CardDescription>
              Nombre de recherches par jour (30 derniers jours)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={searchesByDateData}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                />
                <XAxis
                  dataKey="date"
                  stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                  angle={-45}
                  textAnchor="end"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ fill: "#4f46e5", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>


      {/* Top utilisateurs */}
      <Card className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}>
        <CardHeader>
          <CardTitle>Top utilisateurs</CardTitle>
          <CardDescription>Les utilisateurs les plus actifs</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topUsersData}
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
              />
              <XAxis
                dataKey="username"
                stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  color: isDark ? "#ffffff" : "#000000",
                }}
              />
              <Bar dataKey="count">
                {topUsersData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};


export default SearchesOverview;