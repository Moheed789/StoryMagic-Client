"use client";
import { Button } from "@/components/ui/button";
import {
  BookOpenIcon,
  ChevronDown,
  LogOutIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Header() {
  const { user, signOutUser, loading } = useAuth();
  console.log({ user });
  const [loc, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goHomeBottom = useCallback(() => {
    const scroll = () =>
      document.getElementById("bottom")?.scrollIntoView({ behavior: "smooth" });

    if (window.location.pathname === "/") {
      requestAnimationFrame(scroll);
    } else {
      navigate("/");
      setTimeout(() => {
        scroll();
      }, 100);
    }
  }, [navigate]);

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
            <h1
              className="text-xl font-display font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent cursor-pointer"
              onClick={() => navigate("/")}
            >
              StoryMagic
            </h1>
          </div>

          <nav className="flex items-center gap-3 relative">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  className="border border-[#D2D2D2]"
                  onClick={() => navigate("/mystories")}
                >
                  My Stories
                </Button>

                <Button
                  variant="ghost"
                  className="gap-2 bg-[#8C5AF2] text-white hover:bg-[#7B4CEB]"
                  onClick={() => goHomeBottom()}
                >
                  <SparklesIcon className="h-4 w-4" />
                  Create Story
                </Button>

                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="ghost"
                    className={`
                flex items-center justify-between px-[16px] rounded-lg
                text-[#8C5AF2] font-medium transition-all duration-200
                ${open ? "bg-[#F0F0F0]" : ""}
                hover:bg-[#F0F0F0]
                
              `}
                    onClick={() => setOpen(!open)}
                  >
                    {user.apiProfile?.fullName || "John Smith"}
                    <ChevronDown
                      className={`h-4 w-4 transform transition-transform duration-300  ${
                        open
                          ? "rotate-180 text-[#8C5AF2]"
                          : "rotate-0 text-[#8C5AF2]"
                      }`}
                    />
                  </Button>

                  {open && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-[16px] shadow-lg border border-gray-200 p-5 z-50">
                      <div className="mb-3">
                        <h3 className="text-[16px] font-story font-[600] text-[#002014]">
                          {user.apiProfile?.fullName || "John Smith"}
                        </h3>
                        <p className="text-[14px] font-story font-[600]  text-[#8DA99E]">
                          {user.apiProfile?.email || "johnsmith12@gmail.com"}
                        </p>
                      </div>

                      <hr className="my-4 border-[#E8EDEB]" />

                      <div className="space-y-[16px]">
                        <button
                          className="flex items-center gap-[17px] text-[#515B57] font-story font-[500] hover:text-[#8C5AF2] w-full text-[14px] "
                          onClick={() => {
                            setOpen(false);
                            navigate("/profile");
                          }}
                        >
                          <UserIcon className="h-4 w-4" />
                          <span>User Profile</span>
                        </button>

                        <button
                          className="flex items-center gap-[17px] text-[#515B57] font-story font-[500] hover:text-[#8C5AF2] text-[14px] w-full"
                          onClick={() => {
                            setOpen(false);
                            navigate("/subscription");
                          }}
                        >
                          <SettingsIcon className="h-4 w-4" />
                          <span>Pricing Plan</span>
                        </button>
                      </div>

                      <hr className="my-4 border-[#E8EDEB]" />

                      <Button
                        onClick={() => {
                          setOpen(false);
                          onLogout();
                        }}
                        className="bg-[#EE282F] hover:bg-[#d53c2f] text-white w-full mt-2 gap-2 font-semibold "
                      >
                        <LogOutIcon className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
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
