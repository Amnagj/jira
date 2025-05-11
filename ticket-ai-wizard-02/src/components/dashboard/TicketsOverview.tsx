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
 
  // Effet pour charger les statistiques filtrées par projet
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
          // Conserver les stats actuelles en cas d'erreur
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


  // Préparer les données pour le graphique par date
  const ticketsByDateData = stats.tickets_by_date.map(item => ({
    date: item._id,
    count: item.count
  }));


  // Préparer les données pour le top des mots-clés
  const topKeywordsData = stats.top_keywords.map(item => ({
    keyword: item._id,
    count: item.count
  }));


  // Préparer les données pour le graphique par projet
  const ticketsByProjectData = stats.tickets_by_project.map(item => ({
    project: item._id || "Non spécifié",
    count: item.count
  }));


  // Couleurs pour les graphiques
  const colors = ['#4f46e5', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'];


   return (
    <div className="space-y-4">
      {/* Filtre de projet */}
      <div className="flex justify-end">
        <Select value={selectedProject} onValueChange={setSelectedProject} disabled={loading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {initialStats?.projects_list.map((project) => (
              <SelectItem key={project} value={project}>{project || "Non spécifié"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Chargement des données...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nombre total de tickets */}
          <Card className={cn(
            "col-span-1",
            isDark ? "bg-card/70 border-white/10" : "bg-white"
          )}>
            <CardHeader>
              <CardTitle>Total des tickets</CardTitle>
              <CardDescription>
                {selectedProject !== "all"
                  ? `Nombre de tickets dans le projet ${selectedProject}`
                  : "Nombre total de tickets dans le système"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-center my-8">
                {stats.total_tickets}
              </div>
            </CardContent>
          </Card>


          {/* Tickets par date */}
          <Card className={cn(
            "col-span-2",
            isDark ? "bg-card/70 border-white/10" : "bg-white"
          )}>
            <CardHeader>
              <CardTitle>Évolution des tickets</CardTitle>
              <CardDescription>
                {selectedProject !== "all"
                  ? `Évolution des tickets du projet ${selectedProject} (30 derniers jours)`
                  : "Nombre de tickets ajoutés par jour (30 derniers jours)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    />
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


          {/* Distribution des tickets par projet */}
          {selectedProject === "all" && (
            <>
              <Card className={cn(
                "col-span-3 md:col-span-2",
                isDark ? "bg-card/70 border-white/10" : "bg-white"
              )}>
                <CardHeader>
                  <CardTitle>Tickets par projet</CardTitle>
                  <CardDescription>Distribution des tickets selon les projets</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
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
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#1f2937' : '#ffffff',
                            borderColor: isDark ? '#374151' : '#e5e7eb',
                            color: isDark ? '#ffffff' : '#000000'
                          }}
                        />
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


              <Card className={cn(
                "col-span-3 md:col-span-1",
                isDark ? "bg-card/70 border-white/10" : "bg-white"
              )}>
                <CardHeader>
                  <CardTitle>Répartition par projet</CardTitle>
                  <CardDescription>Distribution en pourcentage des tickets par projet</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {ticketsByProjectData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ticketsByProjectData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="project"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {ticketsByProjectData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#1f2937' : '#ffffff',
                            borderColor: isDark ? '#374151' : '#e5e7eb',
                            color: isDark ? '#ffffff' : '#000000'
                          }}
                          formatter={(value, name, props) => [`${value} tickets`, props.payload.project]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-muted-foreground">Aucune donnée disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}


          {/* Top mots-clés */}
          <Card className={cn(
            "col-span-3 md:col-span-2",
            isDark ? "bg-card/70 border-white/10" : "bg-white"
          )}>
            <CardHeader>
              <CardTitle>Top mots-clés</CardTitle>
              <CardDescription>
                {selectedProject !== "all"
                  ? `Les 5 mots-clés les plus fréquents dans le projet ${selectedProject}`
                  : "Les 5 mots-clés les plus fréquents dans les tickets"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {topKeywordsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topKeywordsData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                    <XAxis
                      dataKey="keyword"
                      stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    />
                    <Bar dataKey="count">
                      {topKeywordsData.map((entry, index) => (
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


          {/* Distribution visuelle des mots-clés */}
          <Card className={cn(
            "col-span-3 md:col-span-1",
            isDark ? "bg-card/70 border-white/10" : "bg-white"
          )}>
            <CardHeader>
              <CardTitle>Distribution des mots-clés</CardTitle>
              <CardDescription>
                {selectedProject !== "all"
                  ? `Répartition des mots-clés dans le projet ${selectedProject}`
                  : "Répartition des principaux mots-clés"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                      formatter={(value, name, props) => [`${value} tickets`, props.payload.keyword]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};


export default TicketsOverview;

