import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import Portfolios from "@/components/Portfolios";
import About from "@/components/About";
import People from "@/components/People";
import { LoginModal } from "@/components/LoginModal";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { useAuth } from "@/contexts/AuthContext";
import lionLogo from "@/assets/lion-logo.png";
import { Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const navTabs = [
  { id: "home", label: "Home" },
  { id: "portfolios", label: "Portfolios" },
  { id: "about", label: "About" },
  { id: "people", label: "People" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user?.mustChangePassword) {
      setChangePasswordOpen(true);
    }
  }, [user]);

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return null;
      case "portfolios":
        return <Portfolios />;
      case "about":
        return <About />;
      case "people":
        return <People />;
      default:
        return null;
    }
  };

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with logo and navigation */}
      <header className="relative z-50 h-16 flex items-center justify-between border-b border-gold/20 bg-card/30 backdrop-blur-sm px-4 lg:px-6">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <img
            src={lionLogo}
            alt="Alpha Sigma Logo"
            className="w-8 h-8 lg:w-10 lg:h-10 object-contain opacity-90 drop-shadow-lg filter brightness-110"
          />
          <h1 className="text-sm lg:text-xl font-bold bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
            <span className="hidden sm:inline">Alpha Sigma Strategies</span>
            <span className="sm:hidden">Alpha Sigma</span>
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleNavigation(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "text-gold border-b-2 border-gold"
                  : "text-muted-foreground hover:text-gold"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Auth controls */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm text-gold font-medium">
                <User className="h-4 w-4" />
                {user.name.split(" ")[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-gold hover:bg-gold/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-gold transition-all duration-200"
            >
              Login
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-gold hover:bg-gold/10"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 z-40 bg-card border-b border-gold/20 backdrop-blur-sm">
          <nav className="flex flex-col p-4 space-y-2">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleNavigation(tab.id)}
                className={`px-4 py-3 text-left text-sm font-medium transition-all duration-200 rounded-lg ${
                  activeTab === tab.id
                    ? "text-gold bg-gold/10 border-l-4 border-gold"
                    : "text-muted-foreground hover:text-gold hover:bg-gold/5"
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Auth controls (mobile) */}
            {user ? (
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-gold/5 border-l-4 border-gold/30">
                <span className="flex items-center gap-1 text-sm text-gold font-medium">
                  <User className="h-4 w-4" />
                  {user.name.split(" ")[0]}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="text-muted-foreground hover:text-gold"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <button
                onClick={() => { setLoginModalOpen(true); setMobileMenuOpen(false); }}
                className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-gold hover:bg-gold/5 transition-all duration-200 rounded-lg"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === "home" && <Hero onNavigate={handleNavigation} />}
        {renderContent()}
      </main>

      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
};

export default Index;
