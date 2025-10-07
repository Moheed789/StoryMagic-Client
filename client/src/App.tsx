import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { routes } from "./routes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/PublicOnlyRoute";
import Header from "@/components/Header";
import { LoadingScreen } from "@/components/ui/loading";
import RegistrationSuccessModal from "./pages/auth/RegistrationSuccessModal";

function Router() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Switch>
      {routes.map((route) => (
        <Route key={route.path} path={route.path}>
          {route.isProtected ? (
            <ProtectedRoute>{route.component}</ProtectedRoute>
          ) : route.isPublicOnly ? (
            <PublicOnlyRoute>{route.component}</PublicOnlyRoute>
          ) : (
            route.component
          )}
        </Route>
      ))}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> 
        <TooltipProvider>
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            <RegistrationSuccessModal />
            <Header />
            <main className="flex-1">
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
