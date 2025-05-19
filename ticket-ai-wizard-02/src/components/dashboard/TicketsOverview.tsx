// src/components/dashboard/TicketsOverview.tsx
import React,{ useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { TicketsStats, getTicketsStats } from "@/api/dashboardService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";


interface TicketsOverviewProps {
  stats: TicketsStats | null;
  isDark: boolean;
}


const TicketsOverview: React.FC<TicketsOverviewProps> = ({ stats: initialStats, isDark }) => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [stats, setStats] = useState<TicketsStats | null>(initialStats);
  const [loading, setLoading] = useState<boolean>(false);


  // Charger les statistiques filtrées par projet
  useEffect(() => {
    async function loadProjectStats() {
      if (selectedProject === "all") {
        setStats(initialStats);
        return;
      }


      setLoading(true);
      try {
        const response = await getTicketsStats(selectedProject);
        if (response.status === "success" && response.stats) {
          setStats(response.stats);
        } else {
          console.error("Erreur lors du chargement des stats par projet:", response.message);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des stats:", error);
      } finally {
        setLoading(false);
      }
    }


    loadProjectStats();
  }, [selectedProject, initialStats]);


  if (!stats) {
    return <div>Aucune donnée disponible</div>;
  }


  // Préparer les données pour les graphiques
  const ticketsByDateData = stats.tickets_by_date.map(item => ({
    date: item._id,
    count: item.count,
  }));


  const ticketsByProjectData = stats.tickets_by_project.map(item => ({
    project: item._id || "Non spécifié",
    count: item.count,
  }));


  const topKeywordsData = stats.top_keywords.map(item => ({
    keyword: item._id,
    count: item.count,
  }));


  // Couleurs pour les graphiques
  const colors = ['#4f46e5', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'];


  return (
    <div className="space-y-4">
      {/* Filtre de projet */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {selectedProject === "all" ? "Vue d'ensemble des tickets" : `Projet : ${selectedProject}`}
        </h2>
        {/* KPI Total des tickets */}
      <div className="grid grid-cols-1 gap-4 mb-1 mt-3">
  <Card className={cn("w-full", isDark ? "bg-card/70 border-white/10" : "bg-white")}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">{stats.total_tickets}</div>
          <div>
            <CardTitle>Total des tickets</CardTitle>
            <CardDescription>
              {selectedProject !== "all"
                ? `Nombre de tickets dans le projet ${selectedProject}`
                : "Nombre total de tickets dans le système"}
            </CardDescription>
          </div>
        </div>
      </div>
    </CardHeader>
  </Card>
</div>
        <Select value={selectedProject} onValueChange={setSelectedProject} disabled={loading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {initialStats?.projects_list.map((project) => (
              <SelectItem key={project} value={project}>
                {project || "Non spécifié"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


     


      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {/* Évolution des tickets */}
        <Card className={cn("col-span-1", isDark ? "bg-card/70 border-white/10" : "bg-white")}>
          <CardHeader>
            <CardTitle>Évolution des tickets</CardTitle>
            <CardDescription>
              {selectedProject !== "all"
                ? `Évolution des tickets du projet ${selectedProject} (30 derniers jours)`
                : "Nombre de tickets ajoutés par jour (30 derniers jours)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            {ticketsByDateData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketsByDateData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                  <XAxis
                    dataKey="date"
                    stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ fill: '#4f46e5', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground">Aucune donnée disponible pour cette période</p>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Tickets par projet ou KPI Mots-clés */}
        {selectedProject === "all" ? (
          <Card className={cn("col-span-1", isDark ? "bg-card/70 border-white/10" : "bg-white")}>
            <CardHeader>
              <CardTitle>Tickets par projet</CardTitle>
              <CardDescription>Distribution des tickets selon les projets</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              {ticketsByProjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketsByProjectData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                    <XAxis
                      dataKey="project"
                      stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"} />
                    <Tooltip />
                    <Bar dataKey="count">
                      {ticketsByProjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className={cn("col-span-1", isDark ? "bg-card/70 border-white/10" : "bg-white")}>
            <CardHeader>
              <CardTitle>Mots-clés principaux</CardTitle>
              <CardDescription>Répartition des principaux mots-clés</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              {topKeywordsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topKeywordsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="keyword"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {topKeywordsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};


export default TicketsOverview;

