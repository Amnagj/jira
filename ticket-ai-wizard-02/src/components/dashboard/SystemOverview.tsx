import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SystemStats, DatabaseStats } from "@/api/dashboardService";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ClockIcon,
  HardDriveIcon,
  CpuIcon,
  MemoryStickIcon,
  DatabaseIcon,
} from "lucide-react";




interface SystemOverviewProps {
  stats: SystemStats | null;
  dbStats: DatabaseStats | null;
  isDark: boolean;
}




// Function to format bytes to readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};




// Function to format uptime
const formatUptime = (hours: number) => {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  const minutes = Math.floor((hours * 60) % 60);
  if (days > 0) {
    return `${days}j ${remainingHours}h ${minutes}m`;
  }
  return `${remainingHours}h ${minutes}m`;
};




const SystemOverview: React.FC<SystemOverviewProps> = ({
  stats,
  dbStats,
  isDark,
}) => {
  if (!stats) {
    return <div>Aucune donnée système disponible</div>;
  }




  // Calculate total database size (sum of all collections)
  const totalDatabaseSize =
    dbStats?.collections?.reduce(
      (total, collection) => total + collection.size,
      0
    ) || 0;




  // Generate some mock usage history data (in a real app this would come from your backend)
  const generateHistoryData = (current: number, hours = 24) => {
    const data = [];
    const now = new Date();
    for (let i = hours; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const value = Math.max(
        20,
        Math.min(current - 15 + Math.random() * 30, 100)
      );
      data.push({
        time: time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: Math.round(value),
      });
    }
    return data;
  };




  const cpuHistory = generateHistoryData(stats.cpu_percent);
  const memoryHistory = generateHistoryData(stats.memory_usage.percent);




  // Colors for charts
  const cpuColor = isDark ? "#7c3aed" : "#6366f1";
  const memoryColor = isDark ? "#8b5cf6" : "#8b5cf6";
  const diskColors = isDark
    ? ["#7c3aed", "#2dd4bf", "#333333"]
    : ["#6366f1", "#0ea5e9", "#e5e7eb"];
  const dbColors = isDark
    ? ["#6366f1", "#8b5cf6", "#d946ef"]
    : ["#3b82f6", "#8b5cf6", "#e879f9"];




  // Disk usage data for pie chart
  const diskData = [
    { name: "Utilisé", value: stats.disk_usage.used },
    { name: "Libre", value: stats.disk_usage.free },
  ];




  // Database collections data for pie chart
  const dbData = dbStats?.collections
    ? dbStats.collections.map((collection) => ({
        name: collection.name,
        value: collection.size,
      }))
    : [];




  return (
    <>
      {/* System Uptime Card - Placed at the top right */}
      <div className=" flex justify-end">
        <div className="w-full lg:w-64">
          <div className="py-2">
            <div className="flex flex-col space-y-1">
              <div className="text-lg font-semibold">
                Temps de fonctionnement
              </div>
              <div className="text-sm text-gray-500">
                Depuis le dernier redémarrage
              </div>
            </div>
            <div className="mt-">
              <div className="text-2xl font-bold">
                {formatUptime(stats.uptime_hours)}
              </div>
              <div className="text-sm text-gray-500 ">
                <div className="flex">
                  <span>Démarré le :</span>
                  <span>
                    {new Date(
                      Date.now() - stats.uptime_hours * 3600 * 1000
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main grid for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* CPU Usage Card */}
        <Card
          className={cn(
            "overflow-hidden",
            isDark ? "bg-card/70 border-white/10" : "bg-white"
          )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <div>
            <CardTitle className="text-lg font-medium">CPU</CardTitle>
            <CardDescription>Utilisation du processeur</CardDescription>
          </div>
          <CpuIcon
            className={cn(
              "w-5 h-5",
              isDark ? "text-white/70" : "text-gray-500"
            )}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-5">
            {stats.cpu_percent.toFixed(1)}%
          </div>
          <Progress
            value={stats.cpu_percent}
            className={cn("h-2", isDark ? "bg-gray-700" : "bg-gray-200")}
          />
          <div className="h-40 mt-9 mr-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuHistory}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke={isDark ? "#aaa" : "#666"}
                  interval="preserveStartEnd"
                  tickFormatter={(value, index) => index % 4 === 0 ? value : ''}
                />
                <YAxis
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  stroke={isDark ? "#aaa" : "#666"}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "CPU"]}
                  contentStyle={{
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    color: isDark ? "#fff" : "#333",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={cpuColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>




      {/* Memory Usage Card */}
      <Card
        className={cn(
          "overflow-hidden",
          isDark ? "bg-card/70 border-white/10" : "bg-white"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-medium">Mémoire</CardTitle>
            <CardDescription>Utilisation de la RAM</CardDescription>
          </div>
          <MemoryStickIcon
            className={cn(
              "w-5 h-5",
              isDark ? "text-white/70" : "text-gray-500"
            )}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {stats.memory_usage.percent.toFixed(1)}%
          </div>
          <Progress
            value={stats.memory_usage.percent}
            className={cn("h-2", isDark ? "bg-gray-700" : "bg-gray-200")}
          />
          <div className="text-xs mt-1">
            {formatBytes(stats.memory_usage.used)} / {formatBytes(stats.memory_usage.total)}
          </div>
          <div className="h-40 mt-6 mr-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memoryHistory}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke={isDark ? "#aaa" : "#666"}
                  interval="preserveStartEnd"
                  tickFormatter={(value, index) => index % 4 === 0 ? value : ''}
                />
                <YAxis
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  stroke={isDark ? "#aaa" : "#666"}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Mémoire"]}
                  contentStyle={{
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    color: isDark ? "#fff" : "#333",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={memoryColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>




      {/* Disk Usage Card */}
      <Card
        className={cn(
          "overflow-hidden",
          isDark ? "bg-card/70 border-white/10" : "bg-white"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-medium">Disque</CardTitle>
            <CardDescription>Utilisation de l'espace disque</CardDescription>
          </div>
          <HardDriveIcon
            className={cn(
              "w-5 h-5",
              isDark ? "text-white/70" : "text-gray-500"
            )}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {stats.disk_usage.percent.toFixed(1)}%
          </div>
          <Progress
            value={stats.disk_usage.percent}
            className={cn("h-2", isDark ? "bg-gray-700" : "bg-gray-200")}
          />
          <div className="text-xs mt-1">
            {formatBytes(stats.disk_usage.used)} / {formatBytes(stats.disk_usage.total)}
          </div>
          <div className="h-40 mt-2 flex items-center justify-center">
            <ResponsiveContainer width="90%" height="90%">
              <PieChart>
                <Pie
                  data={diskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={40}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {diskData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={diskColors[index % diskColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    formatBytes(value as number),
                    "Espace",
                  ]}
                  contentStyle={{
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    color: isDark ? "#fff" : "#333",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>




      {/* Database Usage Card */}
      <Card
        className={cn(
          "overflow-hidden",
          isDark ? "bg-card/70 border-white/10" : "bg-white"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-medium">
              Base de données
            </CardTitle>
            <CardDescription>Utilisation MongoDB</CardDescription>
          </div>
          <DatabaseIcon
            className={cn(
              "w-5 h-5",
              isDark ? "text-white/70" : "text-gray-500"
            )}
          />
        </CardHeader>
        <CardContent>
          {dbStats ? (
            <>
              <div className="text-2xl font-bold mb-2">
                {formatBytes(totalDatabaseSize)}
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Espace utilisé</span>
                  <span>{formatBytes(totalDatabaseSize)}</span>
                </div>
                <Progress
                  value={(totalDatabaseSize / (0.5 * 1024 * 1024 * 1024)) * 100}
                  className={cn("h-2", isDark ? "bg-gray-700" : "bg-gray-200")}
                />
              </div>
              <div className="h-40 mt-2 flex items-center justify-center p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dbData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name }) => name.substring(0, 99)} // Afficher seulement les premiers caractères
                      labelLine={true}
                    >
                      {dbData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={dbColors[index % dbColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        formatBytes(value as number),
                        "Espace",
                      ]}
                      contentStyle={{
                        backgroundColor: isDark ? "#1e293b" : "#fff",
                        borderColor: isDark ? "#334155" : "#e2e8f0",
                        color: isDark ? "#fff" : "#333",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p>Aucune donnée disponible</p>
            </div>
          )}
        </CardContent>
      </Card>




    </div>
    </>
  );
};




export default SystemOverview;

