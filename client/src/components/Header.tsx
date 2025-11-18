import { Button } from "@/components/ui/button";
import {
  BookOpenIcon,
  ChevronDown,
  CircleDollarSign,
  LogOutIcon,
  MenuIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "./ui/loading";

export default function Header() {
  const { user, signOutUser, loading } = useAuth();
  const [loc, navigate] = useLocation();

  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const goToCartoonStyle = useCallback(() => {
    const scroll = () => {
      const el = document.getElementById("cartoon-style");
      if (el) {
        const offset =
          el.getBoundingClientRect().top +
          window.scrollY -
          window.innerHeight / 3;
        window.scrollTo({ top: offset, behavior: "smooth" });
      }
    };

    if (window.location.pathname === "/") {
      requestAnimationFrame(scroll);
    } else {
      navigate("/");
      setTimeout(() => {
        scroll();
      }, 200);
    }
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onLogout = async () => {
    await signOutUser();
    navigate("/SignIn");
  };

  if (loc.startsWith("/generated-story")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-chart-2 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1
              className="text-md md:text-xl font-display font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent cursor-pointer"
              onClick={() => navigate("/")}
            >
              StoryBloom
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-1 md:gap-3 relative ">
            {user || loading ? (
              <>
                <Button
                  variant="ghost"
                  className="border border-[#D2D2D2] md:text-[14px] text-[11px] py-[8px] px-[11px] sm:px-[16px] "
                  onClick={() => navigate("/mystories")}
                >
                  My Stories
                </Button>

                <Button
                  variant="ghost"
                  className="gap-2 bg-[#8C5AF2] text-white hover:bg-[#7B4CEB] md:text-[14px] text-[11px] px-[8px] py-[8px] sm:px-[16px] "
                  onClick={() => goToCartoonStyle()}
                >
                  <SparklesIcon className="h-4 w-4" />
                  Create Story
                </Button>

                <Button
                  data-testid="button-pricing"
                  variant="ghost"
                  onClick={() => navigate("/pricing")}
                >
                  Pricing
                </Button>

                <div className="relative" ref={dropdownRef}>
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Button
                      variant="ghost"
                      className={`
                flex items-center justify-between  rounded-lg py-[8px] px-[8px] sm:px-[16px] 
                text-[#8C5AF2] font-medium transition-all duration-200 md:text-[14px] text-[11px]
                ${open ? "bg-[#F0F0F0]" : ""}
                hover:bg-[#F0F0F0]
                
              `}
                      onClick={() => setOpen(!open)}
                    >
                      {user?.apiProfile?.fullName}
                      <ChevronDown
                        className={`h-4 w-4 transform transition-transform duration-300  ${
                          open
                            ? "rotate-180 text-[#8C5AF2]"
                            : "rotate-0 text-[#8C5AF2]"
                        }`}
                      />
                    </Button>
                  )}

                  {open && (
                    <div className="absolute right-0 mt-[32px]  bg-white rounded-[16px] shadow-lg border border-gray-200 p-5 z-50">
                      <div className="mb-3">
                        <h3 className="text-[16px] font-story font-[600] text-[#002014]">
                          {user?.apiProfile?.fullName}
                        </h3>
                        <p className="text-[14px] font-story font-[600]  text-[#8DA99E]">
                          {user?.apiProfile?.email}
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
                      </div>

                      <hr className="my-4 border-[#E8EDEB]" />

                      <Button
                        onClick={() => {
                          setOpen(false);
                          onLogout();
                        }}
                        className="bg-[#EE282F] hover:bg-[#d53c2f] text-white w-full mt-2 gap-2 font-semibold border-none "
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
                <Button
                  data-testid="button-pricing"
                  variant="ghost"
                  onClick={() => navigate("/pricing")}
                >
                  Pricing
                </Button>
              </>
            )}
          </nav>

          <div className="md:hidden relative" ref={mobileMenuRef}>
            <Button
              variant="ghost"
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MenuIcon className="h-5 w-5" />
            </Button>

            {mobileMenuOpen && (
              <div
                className={`absolute right-0 mt-[32px] bg-white rounded-[16px] shadow-lg border border-gray-200 p-5 z-50 ${
                  !user && !loading ? "w-[200px]" : ""
                }`}
              >
                {user || loading ? (
                  <>
                    <div className="mb-4 flex items-center gap-4 justify-between">
                      <div>
                        <h3 className="text-[16px] font-story font-[600] text-[#002014]">
                          {user.apiProfile?.fullName || "John Smith"}
                        </h3>
                        <p className="text-[14px] font-story font-[600] text-[#8DA99E]">
                          {user.apiProfile?.email || "johnsmith12@gmail.com"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onLogout();
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <LogOutIcon className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>

                    <hr className="my-2 border-[#E8EDEB]" />
                    <div className="space-y-2 ">
                      <button
                        className="flex items-center gap-3 text-[#515B57] font-story font-[500] hover:text-[#8C5AF2] w-full text-left text-[14px] p-2 rounded-lg hover:bg-gray-50"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/profile");
                        }}
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>User Profile</span>
                      </button>
                    </div>
                    <hr className="my-1 border-[#E8EDEB]" />
                    <div className="space-y-2 mb-3">
                      <button
                        data-testid="button-pricing"
                        className="flex items-center gap-3 text-[#515B57] font-story font-[500] hover:text-[#8C5AF2] w-full text-left text-[14px] p-2 rounded-lg hover:bg-gray-50"
                        onClick={() => navigate("/pricing")}
                      >
                        <CircleDollarSign className="h-4 w-4" />
                        <span>Pricing</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <Button
                        variant="ghost"
                        className="w-full bg-[#8C5AF2] text-white hover:bg-[#7B4CEB] gap-2"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          goToCartoonStyle();
                        }}
                      >
                        Create Story
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full border border-[#D2D2D2]"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/mystories");
                        }}
                      >
                        My Stories
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <button
                        data-testid="button-pricing"
                        className="flex items-center gap-1 text-[#515B57] font-story font-[500] hover:text-[#8C5AF2] w-full text-left text-[14px] p-2 rounded-lg hover:bg-gray-50"
                        onClick={() => navigate("/pricing")}
                      >
                        <CircleDollarSign className="h-4 w-4" />
                        <span>Pricing</span>
                      </button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/signin");
                        }}
                      >
                        SignIn
                      </Button>

                      <Button
                        className="w-full gap-2 font-semibold"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/signup");
                        }}
                      >
                        Register
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
