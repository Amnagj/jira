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


const AdminDashboard :  React.FC = () => {
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



  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
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
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
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
      <main className="container mx-auto pt-14 pb-5 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className={cn(
            "text-3xl font-bold mb-6",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Tableau de bord administrateur
          </h1>
         
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}


          <Tabs defaultValue="tickets" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="searches">Recherches</TabsTrigger>
              <TabsTrigger value="system">Système</TabsTrigger>
            </TabsList>


            <TabsContent value="tickets" className="space-y-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <Card key={index} className={cn(
                      isDark ? "bg-card/70 border-white/10" : "bg-white"
                    )}>
                      <CardHeader className="p-4">
                        <Skeleton className="h-6 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-[200px] w-full" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <Card key={index} className={cn(
                      isDark ? "bg-card/70 border-white/10" : "bg-white"
                    )}>
                      <CardHeader className="p-4">
                        <Skeleton className="h-6 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-[200px] w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <SearchesOverview stats={searchesStats} isDark={isDark} />
              )}
            </TabsContent>


            <TabsContent value="system" className="space-y-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(5)].map((_, index) => (
                    <Card key={index} className={cn(
                      isDark ? "bg-card/70 border-white/10" : "bg-white"
                    )}>
                      <CardHeader className="p-4">
                        <Skeleton className="h-6 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-[200px] w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <SystemOverview stats={systemStats} dbStats={databaseStats} isDark={isDark} />
              )}
            </TabsContent>
          </Tabs>
        </div>
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

