import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { TicketsStats } from "@/api/dashboardService";

interface TicketsOverviewProps {
  stats: TicketsStats | null;
  isDark: boolean;
}

const TicketsOverview: React.FC<TicketsOverviewProps> = ({ stats, isDark }) => {
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

  // Couleurs pour les graphiques
  const colors = ['#4f46e5', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Nombre total de tickets */}
      <Card className={cn(
        "col-span-1",
        isDark ? "bg-card/70 border-white/10" : "bg-white"
      )}>
        <CardHeader>
          <CardTitle>Total des tickets</CardTitle>
          <CardDescription>Nombre total de tickets dans le système</CardDescription>
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
          <CardDescription>Nombre de tickets ajoutés par jour (30 derniers jours)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
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
        </CardContent>
      </Card>

      {/* Top mots-clés */}
      <Card className={cn(
        "col-span-3 md:col-span-2",
        isDark ? "bg-card/70 border-white/10" : "bg-white"
      )}>
        <CardHeader>
          <CardTitle>Top mots-clés</CardTitle>
          <CardDescription>Les 5 mots-clés les plus fréquents dans les tickets</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
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
        </CardContent>
      </Card>

      {/* Distribution visuelle des mots-clés */}
      <Card className={cn(
        "col-span-3 md:col-span-1",
        isDark ? "bg-card/70 border-white/10" : "bg-white"
      )}>
        <CardHeader>
          <CardTitle>Distribution des mots-clés</CardTitle>
          <CardDescription>Répartition des principaux mots-clés</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketsOverview;
