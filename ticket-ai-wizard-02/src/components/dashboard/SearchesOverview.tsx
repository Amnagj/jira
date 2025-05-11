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
  Sector,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  SearchesStats,
  getSearchesStats,
  getUsersStats,
  UsersStats,
} from "@/api/dashboardService";
import {
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  UsersIcon,
  GitBranch,
  BarChartIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Composant pour un secteur actif personnalisé
const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <text x={cx} y={cy} dy={-15} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#333">
        {`${value} tickets (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

// Composant de classification des résultats amélioré
const ResultsClassification = ({ stats, isDark }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  
  // S'il n'y a pas de statistiques, retourner un message
  if (!stats) {
    return <div>Aucune donnée disponible</div>;
  }
  
  // Calculs nécessaires
  const totalTickets = stats.total_searches;
  const automatable_searches = Math.round(
    stats.success_searches * (stats.automation_rate / 100)
  );
  const lowScore_searches = stats.success_searches - automatable_searches;
  
  // Données pour le graphique principal (tickets résolus vs sans solution)
  const mainChartData = [
    {
      name: "Tickets résolus",
      value: stats.success_searches,
      color: "#2563eb", // Bleu plus vibrant
    },
    {
      name: "Sans solution",
      value: stats.error_searches,
      color: "#93c5fd", // Bleu clair
    },
  ];
  
  // Données pour le graphique secondaire (décomposition des tickets résolus)
  const subChartData = [
    {
      name: "Score ≥ 70%",
      value: automatable_searches,
      color: "#1d4ed8", // Bleu foncé
    },
    {
      name: "Score < 70%",
      value: lowScore_searches,
      color: "#60a5fa", // Bleu moyen
    },
  ];
  
  // Palette de couleurs
  const COLORS = ["#2563eb", "#93c5fd"]; // Bleu vibrant, Bleu clair
  const SUB_COLORS = ["#1d4ed8", "#60a5fa"]; // Bleu foncé, Bleu moyen
  
  // Calcul des angles pour une visualisation cohérente
  const totalValue = mainChartData.reduce((sum, item) => sum + item.value, 0);
  
  // Calcul de l'angle de départ et de fin pour le secteur "tickets résolus"
  // Dans un cercle complet qui commence à -90° (ou 270° en mathématiques)
  const startAngle = -90; // Angle de départ fixe pour le cercle
  const successRatio = totalValue > 0 ? stats.success_searches / totalValue : 0;
  const successAngle = successRatio * 360; // Angle pour la section "tickets résolus"
  
  // Angles pour le secteur "tickets résolus"
  const resolvedStartAngle = startAngle;
  const resolvedEndAngle = startAngle + successAngle;
  
  // Angles pour le secteur "sans solution"
  const errorStartAngle = resolvedEndAngle;
  const errorEndAngle = startAngle + 360;
  
  // Calcul des proportions pour les sous-secteurs
  const highScoreRatio = stats.success_searches > 0 ? automatable_searches / stats.success_searches : 0;
  
  // Angles précis pour les sous-secteurs
  const highScoreStartAngle = resolvedStartAngle;
  const highScoreEndAngle = resolvedStartAngle + (highScoreRatio * successAngle);
  const lowScoreStartAngle = highScoreEndAngle;
  const lowScoreEndAngle = resolvedEndAngle;
  
  // Gestion des événements au survol
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(null);
  };
  
  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-2 rounded ${
            isDark ? "bg-slate-800 text-white" : "bg-white text-slate-800"
          } border border-slate-300`}
        >
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{`${payload[0].value} tickets`}</p>
          <p className="text-xs text-slate-500">{`${(
            payload[0].payload.percent * 100
          ).toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white", "col-span-full lg:col-span-1")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChartIcon size={20} className="text-blue-600" />
          Classification des résultats
        </CardTitle>
        <CardDescription>
          Répartition des tickets avec détail de la qualité des résultats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Graphique principal: Tickets résolus vs sans solution */}
              <Pie
                data={mainChartData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                labelLine={true}
                startAngle={startAngle}
                endAngle={startAngle + 360}
              >
                {mainChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              
              {/* Graphique secondaire: Répartition des tickets avec score ≥ 70% */}
              {stats.success_searches > 0 && automatable_searches > 0 && (
                <Pie
                  data={[subChartData[0]]} // Score ≥ 70%
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={90}
                  startAngle={highScoreStartAngle}
                  endAngle={highScoreEndAngle}
                  dataKey="value"
                  label={({ name }) =>
                    `${name}: ${Math.round(
                      (automatable_searches / stats.success_searches) * 100
                    )}%`
                  }
                  labelLine={false}
                >
                  <Cell fill={SUB_COLORS[0]} />
                </Pie>
              )}
              
              {/* Graphique secondaire: Répartition des tickets avec score < 70% */}
              {stats.success_searches > 0 && lowScore_searches > 0 && (
                <Pie
                  data={[subChartData[1]]} // Score < 70%
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={90}
                  startAngle={lowScoreStartAngle}
                  endAngle={lowScoreEndAngle}
                  dataKey="value"
                  label={({ name }) =>
                    `${name}: ${Math.round(
                      (lowScore_searches / stats.success_searches) * 100
                    )}%`
                  }
                  labelLine={false}
                >
                  <Cell fill={SUB_COLORS[1]} />
                </Pie>
              )}
              <Tooltip content={customTooltip} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: 20 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm text-center mt-4 text-muted-foreground">
          {stats.total_searches > 0 ? (
            <div className="space-y-1">
              <p>{`${stats.success_searches} tickets résolus (${Math.round(
                (stats.success_searches / stats.total_searches) * 100
              )}% du total)`}</p>
              <p>{`→ Dont ${automatable_searches} tickets avec score ≥ 70% (${
                stats.success_searches > 0
                  ? Math.round(
                      (automatable_searches / stats.success_searches) * 100
                    )
                  : 0
              }% des résolus)`}</p>
              <p>{`→ Et ${lowScore_searches} tickets avec score < 70% (${
                stats.success_searches > 0
                  ? Math.round(
                      (lowScore_searches / stats.success_searches) * 100
                    )
                  : 0
              }% des résolus)`}</p>
            </div>
          ) : (
            "Aucun ticket disponible"
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface SearchesOverviewProps {
  stats: SearchesStats | null;
  isDark: boolean;
  onProjectChange?: (project: string | null) => void;
}

const SearchesOverview: React.FC<SearchesOverviewProps> = ({
  stats,
  isDark,
}) => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [filteredStats, setFilteredStats] = useState<SearchesStats | null>(
    stats
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [usersStats, setUsersStats] = useState<UsersStats | null>(null);
  const [usernames, setUsernames] = useState<{[key: string]: string}>({});

  // Récupérer les statistiques des utilisateurs
  useEffect(() => {
    const fetchUsersStats = async () => {
      try {
        const response = await getUsersStats();
        if (response.status === "success" && response.stats) {
          setUsersStats(response.stats);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des statistiques utilisateurs:",
          error
        );
      }
    };
    fetchUsersStats();
  }, []);

  // Filtrer les stats par projet
  useEffect(() => {
    const fetchProjectData = async () => {
      if (selectedProject === "all") {
        setFilteredStats(stats);
        return;
      }
      setLoading(true);
      try {
        const response = await getSearchesStats(selectedProject);
        if (response.status === "success" && response.stats) {
          setFilteredStats(response.stats);
        } else {
          // En cas d'erreur, on revient aux stats complètes
          setFilteredStats(stats);
        }
      } catch (error) {
        console.error("Erreur lors du filtrage par projet:", error);
        setFilteredStats(stats);
      } finally {
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

  // Préparer les données pour les utilisateurs avec leurs noms d'utilisateur
  const topUsersData = filteredStats.top_users.map((item) => ({
    username: item.username || "Utilisateur inconnu",
    count: item.count,
  }));

  // Palette de couleurs bleues plus vibrantes et variées
  const blueColors = [
    "#0c4a6e", // Bleu très foncé
    "#0369a1", // Bleu foncé
    "#0ea5e9", // Bleu vif
    "#38bdf8", // Bleu clair vif
    "#7dd3fc", // Bleu ciel
    "#0f172a", // Bleu-gris foncé
    "#1e40af", // Bleu royal foncé
    "#3b82f6", // Bleu royal
    "#60a5fa", // Bleu moyen
    "#93c5fd", // Bleu pastel
  ];

  return (
    <div className="space-y-6">
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
            <div className="text-3xl font-bold text-blue-600">
              {filteredStats.total_searches}
            </div>
          </CardContent>
        </Card>

        {/* Temps de réponse moyen */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              Temps de réponse moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {filteredStats.avg_response_time
                ? `${filteredStats.avg_response_time.toFixed(2)} s`
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        {/* Total des utilisateurs */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UsersIcon size={18} className="text-blue-600" />
              Total des utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {usersStats ? usersStats.total_users : "..."}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {usersStats
                ? `${
                    usersStats.admin_users === 1
                      ? "1 administrateur"
                      : `${usersStats.admin_users} administrateurs`
                  } · 
                  ${
                    usersStats.regular_users === 1
                      ? "1 utilisateur"
                      : `${usersStats.regular_users} utilisateurs`
                  }`
                : "..."}
            </div>
          </CardContent>
        </Card>

        {/* Score de similarité moyen */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch size={18} className="text-blue-600" />
              Similarité moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {filteredStats.avg_similarity
                ? `${Math.round(filteredStats.avg_similarity)}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mise en page améliorée des graphiques - disposition en grille responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classification des résultats */}
        <ResultsClassification stats={filteredStats} isDark={isDark} />

        {/* Recherches par date */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white", "col-span-full lg:col-span-2")}
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
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: "#0ea5e9", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top utilisateurs */}
        <Card className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white", "col-span-full")}>
          <CardHeader>
            <CardTitle>Top utilisateurs</CardTitle>
            <CardDescription>Les utilisateurs les plus actifs</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topUsersData}
                margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
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
                  formatter={(value, name, props) => [
                    `${value} recherches`,
                    props.payload.username,
                  ]}
                  labelFormatter={() => ""}
                />
                <Bar dataKey="count">
                  {topUsersData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={blueColors[index % blueColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SearchesOverview;