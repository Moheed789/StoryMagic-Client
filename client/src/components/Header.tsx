"use client";
import { Button } from "@/components/ui/button";
import { BookOpenIcon, SparklesIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, signOutUser, loading } = useAuth();
  console.log({ user });
  const [, navigate] = useLocation();

  if (loading) return null;

  const onLogout = async () => {
    await signOutUser();
    navigate("/SignIn");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-chart-2 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              StoryMagic
            </h1>
          </div>

          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" className="gap-2">
                  <SparklesIcon className="h-4 w-4" />
                  Create Story
                </Button>
                <Button variant="ghost"   onClick={() => navigate("/mystories")}>
                 My Stories
                </Button>

                <Button variant="ghost">Examples</Button>
                <span className="text-sm text-gray-600">
                  {user.apiProfile?.fullName}
                </span>
                <Button variant="ghost" onClick={onLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  data-testid="button-see-examples"
                  variant="outline"
                  size="lg"
                  className="backdrop-blur-sm"
                  onClick={() => navigate("/signin")}
                >
                  SignIn
                </Button>
                <Button
                  data-testid="button-start-creating"
                  size="lg"
                  className="gap-2 font-semibold"
                  onClick={() => navigate("/signup")}
                >
                  Register
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
