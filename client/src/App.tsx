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
import NotFound from "./pages/not-found";
import Pricing from "./pages/auth/Pricing";
import StoryCreator from "./pages/auth/StoryCreator";
import Terms from "./pages/auth/Terms";
import Privacy from "./pages/auth/Privacy";
import Footer from "./components/Footer";

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

      <Route path="/" component={StoryCreator} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors">
            <RegistrationSuccessModal />
            <Header />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
