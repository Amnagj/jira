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
  ReferenceLine,
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

// Composant de classification des résultats optimisé
const ResultsClassification = ({ stats, isDark }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!stats) {
    return <div>Aucune donnée disponible</div>;
  }

  const totalTickets = stats.total_searches;
  const automatable_searches = Math.round(
    stats.success_searches * (stats.automation_rate / 100)
  );
  const lowScore_searches = stats.success_searches - automatable_searches;

  const mainChartData = [
    {
      name: "Tickets résolus",
      value: stats.success_searches,
      color: "#2563eb",
    },
    {
      name: "Sans solution",
      value: stats.error_searches,
      color: "#93c5fd",
    },
  ];

  const subChartData = [
    {
      name: "Score ≥ 70%",
      value: automatable_searches,
      color: "#1d4ed8",
    },
    {
      name: "Score < 70%",
      value: lowScore_searches,
      color: "#60a5fa",
    },
  ];

  const COLORS = ["#2563eb", "#93c5fd"];
  const SUB_COLORS = ["#1d4ed8", "#60a5fa"];

  const totalValue = mainChartData.reduce((sum, item) => sum + item.value, 0);
  const startAngle = -90;
  const successRatio = totalValue > 0 ? stats.success_searches / totalValue : 0;
  const successAngle = successRatio * 360;

  const resolvedStartAngle = startAngle;
  const resolvedEndAngle = startAngle + successAngle;
  const errorStartAngle = resolvedEndAngle;
  const errorEndAngle = startAngle + 360;

  const highScoreRatio =
    stats.success_searches > 0
      ? automatable_searches / stats.success_searches
      : 0;
  const highScoreStartAngle = resolvedStartAngle;
  const highScoreEndAngle = resolvedStartAngle + highScoreRatio * successAngle;
  const lowScoreStartAngle = highScoreEndAngle;
  const lowScoreEndAngle = resolvedEndAngle;

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
    <Card className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}>
      <CardHeader className="py-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChartIcon size={18} className="text-blue-600" />
          Tickets automatisés vs manuels
        </CardTitle>
        <CardDescription className="text-xs">
          Répartition des tickets avec détail de la qualité
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Graphique principal: Tickets résolus vs sans solution */}
              <Pie
                data={mainChartData}
                cx="50%"
                cy="50%"
                outerRadius={50}
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
                  data={[subChartData[0]]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={65}
                  startAngle={highScoreStartAngle}
                  endAngle={highScoreEndAngle}
                  dataKey="value"
                  label={({ name }) =>
                    `${Math.round(
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
                  data={[subChartData[1]]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={65}
                  startAngle={lowScoreStartAngle}
                  endAngle={lowScoreEndAngle}
                  dataKey="value"
                  label={({ name }) =>
                    `${Math.round(
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
                wrapperStyle={{ paddingTop: 5 }}
                iconSize={8}
                fontSize={10}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-center mt-2 text-muted-foreground">
          {stats.total_searches > 0 ? (
            <div className="space-y-0">
              <p>{`${stats.success_searches} résolus (${Math.round(
                (stats.success_searches / stats.total_searches) * 100
              )}%)`}</p>
              <p>{`→ ${automatable_searches} avec score ≥70% (${
                stats.success_searches > 0
                  ? Math.round(
                      (automatable_searches / stats.success_searches) * 100
                    )
                  : 0
              }%)`}</p>
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
  isLoading?: boolean;
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
  const [usernames, setUsernames] = useState<{ [key: string]: string }>({});

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

  // Palette de couleurs bleues
  const blueColors = [
    "#0c4a6e",
    "#0369a1",
    "#0ea5e9",
    "#38bdf8",
    "#7dd3fc",
    "#0f172a",
    "#1e40af",
    "#3b82f6",
    "#60a5fa",
    "#93c5fd",
  ];
  // Ajouter cette fonction au début du composant SearchesOverview
  const calculateWeeklyVariation = (searchesByDateData) => {
    if (!searchesByDateData || searchesByDateData.length === 0)
      return { count: 0, percentage: 0 };

    // Calculer le nombre total de recherches pour la semaine actuelle (7 derniers jours)
    const currentWeekData = searchesByDateData.slice(-7);
    const currentWeekTotal = currentWeekData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    // Calculer le nombre total de recherches pour la semaine précédente (7 jours avant les 7 derniers)
    const previousWeekData = searchesByDateData.slice(-14, -7);
    const previousWeekTotal = previousWeekData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    // Calculer la variation en nombre et pourcentage
    const variation = currentWeekTotal - previousWeekTotal;
    const percentage =
      previousWeekTotal > 0
        ? Math.round((variation / previousWeekTotal) * 100)
        : 0;

    return {
      currentWeek: currentWeekTotal,
      previousWeek: previousWeekTotal,
      variation,
      percentage,
    };
  };

  // Fonction pour identifier les pics et creux dans les données
  const identifyPeaksAndValleys = (data) => {
    if (!data || data.length < 3) return { peaks: [], valleys: [] };

    // Calculer la moyenne et l'écart-type
    const values = data.map((item) => item.count);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length
    );

    // Seuil pour considérer une valeur comme exceptionnelle (1.5 écarts-types)
    const threshold = 1.5;

    // Identifier les pics et creux
    const peaks = data
      .filter((item) => item.count > mean + threshold * stdDev)
      .map((item) => ({
        date: item.date,
        count: item.count,
        difference: Math.round(item.count - mean),
      }));

    const valleys = data
      .filter((item) => item.count < mean - threshold * stdDev)
      .map((item) => ({
        date: item.date,
        count: item.count,
        difference: Math.round(item.count - mean),
      }));

    return { peaks, valleys, mean: Math.round(mean) };
  };

  return (
    <div className="space-y-4">
      {/* Première ligne: Filtre et KPIs */}

      <div className="flex flex-wrap items-center gap-4">
        {/* Filtre par projet */}
        <div className="w-48 ml-auto">
          <Select
            onValueChange={handleProjectChange}
            value={selectedProject}
            defaultValue="all"
            disabled={loading}
          >
            <SelectTrigger
              className={cn(
                isDark ? "bg-card/70 border-white/10" : "bg-white",
                "h-11"
              )}
            >
              <div className="flex items-center gap-2">
                <Filter size={14} />
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

      {/* KPIs en ligne */}
      <div className="flex flex-wrap gap-4 flex-1">
        {/* Nombre total de recherches */}
        <Card
          className={cn(
            isDark ? "bg-card/70 border-white/10" : "bg-white",
            "flex-1 min-w-24"
          )}
        >
          <CardHeader className="py-1 px-3">
            <CardTitle className="text-sm font-medium">
              Total recherches
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-3">
            <div className="text-lg font-bold text-blue-600">
              {filteredStats.total_searches}
            </div>
          </CardContent>
        </Card>

        {/* Temps de réponse moyen */}
        <Card
          className={cn(
            isDark ? "bg-card/70 border-white/10" : "bg-white",
            "flex-1 min-w-24"
          )}
        >
          <CardHeader className="py-1 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Clock size={12} className="text-blue-600" />
              Temps de réponse
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-3">
            <div className="text-lg font-bold text-blue-600">
              {filteredStats.avg_response_time
                ? `${filteredStats.avg_response_time.toFixed(2)} s`
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        {/* Total des utilisateurs */}
        <Card
          className={cn(
            isDark ? "bg-card/70 border-white/10" : "bg-white",
            "flex-1 min-w-24"
          )}
        >
          <CardHeader className="py-1 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <UsersIcon size={12} className="text-blue-600" />
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-3">
            <div className="text-lg font-bold text-blue-600">
              {usersStats ? usersStats.total_users : "..."}
            </div>
            <div className="text-xs text-muted-foreground">
              {usersStats
                ? `${usersStats.admin_users} admin · ${usersStats.regular_users} users`
                : "..."}
            </div>
          </CardContent>
        </Card>

        {/* Score de similarité moyen */}
        <Card
          className={cn(
            isDark ? "bg-card/70 border-white/10" : "bg-white",
            "flex-1 min-w-24"
          )}
        >
          <CardHeader className="py-1 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <GitBranch size={12} className="text-blue-600" />
              Similarité
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-3">
            <div className="text-lg font-bold text-blue-600">
              {filteredStats.avg_similarity
                ? `${Math.round(filteredStats.avg_similarity)}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deuxième ligne: Tous les graphiques sur une ligne */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Classification des résultats */}
        <ResultsClassification stats={filteredStats} isDark={isDark} />

        {/* Recherches par date */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader className="py-2">
            <CardTitle className="text-base flex justify-between items-center">
              <span>Évolution des recherches</span>
              {/* Indicateur de variation */}
              {(() => {
                const weeklyVariation =
                  calculateWeeklyVariation(searchesByDateData);
                return (
                  <div className="flex items-center">
                    <div
                      className={cn(
                        "text-xs px-2 py-1 rounded-md flex items-center gap-1",
                        weeklyVariation.variation > 0
                          ? "bg-green-100 text-green-800"
                          : weeklyVariation.variation < 0
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {weeklyVariation.variation > 0 ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3 h-3"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z"
                              clipRule="evenodd"
                            />
                          </svg>
                          +{weeklyVariation.percentage}%
                        </>
                      ) : weeklyVariation.variation < 0 ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3 h-3"
                          >
                            <path
                              fillRule="evenodd"
                              d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-.988.285l-4.286-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {weeklyVariation.percentage}%
                        </>
                      ) : (
                        <>0%</>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardTitle>
            <CardDescription className="text-xs flex justify-between">
              <span>Nombre de recherches par jour (30 derniers jours)</span>
              {(() => {
                const weeklyVariation =
                  calculateWeeklyVariation(searchesByDateData);
                return (
                  <span className="text-xs font-medium">
                    Cette semaine:{" "}
                    <span className="font-bold">
                      {weeklyVariation.currentWeek}
                    </span>{" "}
                    vs Sem. précédente:{" "}
                    <span className="font-bold">
                      {weeklyVariation.previousWeek}
                    </span>
                  </span>
                );
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-60">
              {(() => {
                // Identifier les pics et creux pour les utiliser dans le graphique
                const { peaks, valleys, mean } =
                  identifyPeaksAndValleys(searchesByDateData);

                // Créer un objet de lookup pour rapidement identifier les pics et creux par date
                const peakDates = new Set(peaks.map((p) => p.date));
                const valleyDates = new Set(valleys.map((v) => v.date));

                // Ajouter des propriétés aux données pour identifier les pics et creux
                const enhancedData = searchesByDateData.map((item) => ({
                  ...item,
                  isPeak: peakDates.has(item.date),
                  isValley: valleyDates.has(item.date),
                }));

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={enhancedData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={
                          isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                        }
                      />
                      <XAxis
                        dataKey="date"
                        stroke={
                          isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"
                        }
                        angle={-45}
                        textAnchor="end"
                        tick={{ fontSize: 10 }}
                        height={40}
                      />
                      <YAxis
                        stroke={
                          isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"
                        }
                        tick={{ fontSize: 10 }}
                        width={25}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#1f2937" : "#ffffff",
                          borderColor: isDark ? "#374151" : "#e5e7eb",
                          color: isDark ? "#ffffff" : "#000000",
                          fontSize: "12px",
                        }}
                        formatter={(value, name, props) => {
                          let label = `${value} tickets`;
                          if (props.payload.isPeak) {
                            const peakInfo = peaks.find(
                              (p) => p.date === props.payload.date
                            );
                            label += ` (pic: +${
                              peakInfo?.difference || 0
                            } vs moy.)`;
                          } else if (props.payload.isValley) {
                            const valleyInfo = valleys.find(
                              (v) => v.date === props.payload.date
                            );
                            label += ` (creux: ${
                              valleyInfo?.difference || 0
                            } vs moy.)`;
                          }
                          return [label, "Tickets"];
                        }}
                      />
                      {/* Ligne principale pour toutes les données */}
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy, payload } = props;

                          if (payload.isPeak) {
                            // Point rouge pour les pics
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={5}
                                fill="#16a34a" // Vert
                                stroke="#16a34a"
                                strokeWidth={1}
                              />
                            );
                          } else if (payload.isValley) {
                            // Point bleu pour les creux
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={5}
                                fill="#dc2626" // Rouge
                                stroke="#dc2626"
                                strokeWidth={1}
                              />
                            );
                          }

                          // Point normal pour les autres points
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={3}
                              fill="#0ea5e9"
                              stroke="none"
                            />
                          );
                        }}
                        activeDot={{ r: 6, stroke: "#0284c7", strokeWidth: 2 }}
                      />

                      {/* Ligne horizontale pour la moyenne */}
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>

            {/* Petite légende en bas */}
            <div className="flex justify-center gap-6 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-600"></span>
                <span>Pics</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-600"></span>
                <span>Creux</span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Top utilisateurs */}
        <Card
          className={cn(isDark ? "bg-card/70 border-white/10" : "bg-white")}
        >
          <CardHeader className="py-2">
            <CardTitle className="text-base">Top utilisateurs</CardTitle>
            <CardDescription className="text-xs">
              Les utilisateurs les plus actifs
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topUsersData}
                margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
                barSize={20}
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
                  height={40}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                  tick={{ fontSize: 10 }}
                  width={25}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    color: isDark ? "#ffffff" : "#000000",
                    fontSize: "12px",
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
