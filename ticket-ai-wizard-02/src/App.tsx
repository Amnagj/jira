import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { SearchHistoryProvider } from "@/hooks/useSearchHistory";
import { TicketStateProvider } from '@/components/TicketStateContext';
import { AdminUploadTicketStateProvider } from '@/components/AdminUploadTicketStateContext';

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import AdminUpload from "@/pages/AdminUpload";
import AdminUsers from "@/pages/AdminUsers";
import AdminManageUsers from "@/pages/AdminManageUsers";

// Create Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Check if user is logged in
  const isAuthenticated = localStorage.getItem("user") !== null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Create Admin Route Component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  try {
    const userString = localStorage.getItem("user");
    const isAuthenticated = userString !== null;
    const isAdmin = isAuthenticated && JSON.parse(userString || "{}")?.isAdmin === true;
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <TicketStateProvider>
                <AdminUploadTicketStateProvider>
                  <SearchHistoryProvider>
                    <Routes>
                      {/* Modification: La page / pointe vers l'Index au lieu du redirect */}
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminDashboard />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/admin/upload"
                        element={
                          <AdminRoute>
                            <AdminUpload />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/admin/users"
                        element={
                          <AdminRoute>
                            <AdminUsers />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/admin/manage-users"
                        element={
                          <AdminRoute>
                            <AdminManageUsers />
                          </AdminRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </SearchHistoryProvider>
                </AdminUploadTicketStateProvider>
              </TicketStateProvider>
            </AuthProvider>
          </BrowserRouter>
        </div>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
