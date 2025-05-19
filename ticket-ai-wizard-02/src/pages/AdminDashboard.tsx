import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import StarfieldBackground from "@/components/StarfieldBackground";
import { CosmicElements, GlowingOrb } from "@/components/CosmicElements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TicketsStats, SearchesStats, SystemStats, UsersStats, DatabaseStats, getAllStats, getSearchesStats } from "@/api/dashboardService";
import TicketsOverview from "@/components/dashboard/TicketsOverview";
import SearchesOverview from "@/components/dashboard/SearchesOverview";
import SystemOverview from "@/components/dashboard/SystemOverview";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const AdminDashboard : React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
 
 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketsStats, setTicketsStats] = useState<TicketsStats | null>(null);
  const [searchesStats, setSearchesStats] = useState<SearchesStats | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [usersStats, setUsersStats] = useState<UsersStats | null>(null);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [activeTab, setActiveTab] = useState("tickets");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSearchesStats = async (project: string = "all") => {
    setIsLoading(true);
    try {
      const response = await getSearchesStats(project);
      if (response.status === "success" && response.stats) {
        setSearchesStats(response.stats);
      } else {
        console.error("Erreur lors du chargement des statistiques:", response.message);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques des recherches:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // Gérer le changement de projet
  const handleProjectChange = (project: string) => {
    setSelectedProject(project);
    loadSearchesStats(project);
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Récupération des données
      const allStats = await getAllStats();
      
      if (allStats.tickets.status === 'success' && allStats.tickets.stats) {
        setTicketsStats(allStats.tickets.stats);
      }
      
      if (allStats.searches.status === 'success' && allStats.searches.stats) {
        setSearchesStats(allStats.searches.stats);
      }
      
      if (allStats.system.status === 'success' && allStats.system.stats) {
        setSystemStats(allStats.system.stats);
      }
      
      if (allStats.users.status === 'success' && allStats.users.stats) {
        setUsersStats(allStats.users.stats);
      }
      
      if (allStats.database.status === 'success' && allStats.database.stats) {
        setDatabaseStats(allStats.database.stats);
      }

      // Vérifier s'il y a des erreurs
      const errors = [];
      if (allStats.tickets.status === 'error') errors.push(allStats.tickets.message);
      if (allStats.searches.status === 'error') errors.push(allStats.searches.message);
      if (allStats.system.status === 'error') errors.push(allStats.system.message);
      if (allStats.users.status === 'error') errors.push(allStats.users.message);
      if (allStats.database.status === 'error') errors.push(allStats.database.message);
      
      if (errors.length > 0) {
        setError(errors.join(', '));
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données", err);
      setError("Une erreur est survenue lors de la récupération des données.");
    } finally {
      setRefreshing(false);
    }
  };

  // Récupération des données au chargement du composant
  useEffect(() => {
    loadSearchesStats();


    const fetchData = async () => {
      try {
        setLoading(true);
        const allStats = await getAllStats();
       
        if (allStats.tickets.status === 'success' && allStats.tickets.stats) {
          setTicketsStats(allStats.tickets.stats);
        }
       
        if (allStats.searches.status === 'success' && allStats.searches.stats) {
          setSearchesStats(allStats.searches.stats);
        }
       
        if (allStats.system.status === 'success' && allStats.system.stats) {
          setSystemStats(allStats.system.stats);
        }
       
        if (allStats.users.status === 'success' && allStats.users.stats) {
          setUsersStats(allStats.users.stats);
        }
       
        if (allStats.database.status === 'success' && allStats.database.stats) {
          setDatabaseStats(allStats.database.stats);
        }


        // Vérifier s'il y a des erreurs
        const errors = [];
        if (allStats.tickets.status === 'error') errors.push(allStats.tickets.message);
        if (allStats.searches.status === 'error') errors.push(allStats.searches.message);
        if (allStats.system.status === 'error') errors.push(allStats.system.message);
        if (allStats.users.status === 'error') errors.push(allStats.users.message);
        if (allStats.database.status === 'error') errors.push(allStats.database.message);
       
        if (errors.length > 0) {
          setError(errors.join(', '));
        } else {
          setError(null);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des données", err);
        setError("Une erreur est survenue lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    };


    fetchData();


    // Mettre à jour les données toutes les 30 secondes
  }, []);


  useEffect(() => {
    if (activeTab === "searches" && selectedProject) {
      const fetchFilteredData = async () => {
        try {
          setLoading(true);
          const response = await getSearchesStats(selectedProject);
          if (response.status === 'success' && response.stats) {
            setSearchesStats(response.stats);
          }
        } catch (err) {
          console.error("Erreur lors du filtrage par projet", err);
        } finally {
          setLoading(false);
        }
      };
     
      fetchFilteredData();
    }
  }, [activeTab, selectedProject]);


  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden",
      isDark ? "text-white bg-[#0a1535]" : "bg-white text-gray-800"
    )}>
      {isDark && <StarfieldBackground />}
      {isDark && <CosmicElements />}
      <Navbar />
      <div className="h-6" />
      <main className="container mx-auto pt-8 pb-4 px-4 relative z-10">
       


        {/* Un seul composant Tabs qui gère à la fois les onglets et leur contenu */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          {/* TabsList modifié pour être plus spacieux et centré */}
         
           
            <TabsList className="flex justify-center space-x-4 py-6 px-4 mt-8">
             
                <h1 className={cn(
                  "text-2xl font-semibold mb-1 pr-8",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Tableau de bord administrateur          
                </h1>
             


              <TabsTrigger
                value="tickets"
                className="px-6 py-2 text-sm font-semibold rounded-md shadow-md border hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                Base de données 
              </TabsTrigger>
              <TabsTrigger
                value="searches"
                className="px-6 py-2 text-sm font-semibold rounded-md shadow-md border hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                Statistiques des Recherches
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="px-6 py-2 text-sm font-semibold rounded-md shadow-md border hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                Ressources Système
              </TabsTrigger>
              <Button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 ml-4"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                {refreshing ? "Actualisation..." : "Actualiser"}
              </Button>
            </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, index) => (
                  <Card
                    key={index}
                    className={cn(
                      "h-auto",
                      isDark ? "bg-card/70 border-white/10" : "bg-white"
                    )}
                  >
                    <CardHeader className="p-3">
                      <Skeleton className="h-5 w-1/2 mb-1" />
                      <Skeleton className="h-3 w-3/4" />
                    </CardHeader>
                    <CardContent className="p-3">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <TicketsOverview stats={ticketsStats} isDark={isDark} />
            )}
          </TabsContent>


          <TabsContent value="searches" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, index) => (
                  <Card
                    key={index}
                    className={cn(
                      "h-auto",
                      isDark ? "bg-card/70 border-white/10" : "bg-white"
                    )}
                  >
                    <CardHeader className="p-3">
                      <Skeleton className="h-5 w-1/2 mb-1" />
                      <Skeleton className="h-3 w-3/4" />
                    </CardHeader>
                    <CardContent className="p-3">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <SearchesOverview
                stats={searchesStats}
                isDark={isDark}
                onProjectChange={handleProjectChange}
                isLoading={isLoading}
              />
            )}
          </TabsContent>


          <TabsContent value="system" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, index) => (
                  <Card
                    key={index}
                    className={cn(
                      "h-auto",
                      isDark ? "bg-card/70 border-white/10" : "bg-white"
                    )}
                  >
                    <CardHeader className="p-3">
                      <Skeleton className="h-5 w-1/2 mb-1" />
                      <Skeleton className="h-3 w-3/4" />
                    </CardHeader>
                    <CardContent className="p-3">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <SystemOverview stats={systemStats} dbStats={databaseStats} isDark={isDark} />
            )}
          </TabsContent>
        </Tabs>


        {error && (
          <Alert className="mt-2 bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-300">
            <AlertTitle className="text-red-800 dark:text-red-300">Erreur</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-400">{error}</AlertDescription>
          </Alert>
        )}
      </main>
     
      {isDark && (
        <>
          <GlowingOrb className="fixed top-1/4 left-1/5 -z-10" size={250} color="rgba(79, 70, 229, 0.08)" />
          <GlowingOrb className="fixed bottom-1/4 right-1/5 -z-10" size={300} color="rgba(124, 58, 237, 0.06)" />
        </>
      )}
    </div>
  );
};


export default AdminDashboard;

