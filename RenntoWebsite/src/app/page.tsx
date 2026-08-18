"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "../sections/Navbar";
import WelcomeHero from "../sections/WelcomeHero";
import AIPromoVideo from "../sections/AIPromoVideo";
import Hero from "../sections/Hero";
import PropertyDiscovery from "../sections/PropertyDiscovery";
import VerifiedRentals from "../sections/VerifiedRentals";
import Workflow from "../sections/Workflow";
import Features from "../sections/Features";
import TrustSafety from "../sections/TrustSafety";
import Testimonials from "../sections/Testimonials";
import FAQ from "../sections/FAQ";
import Footer from "../sections/Footer";
import SignInModal from "../components/SignInModal";
import Toast from "../components/Toast";
import DownloadApp from "../sections/DownloadApp";
import VideoShowcase from "../sections/VideoShowcase";

export interface UserContext {
  email: string;
  role: "tenant" | "owner"; // Kept for type compatibility if needed, but not actively toggled in UI
}

export default function Home() {
  const [user, setUser] = useState<UserContext | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync class theme settings on root element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleSignInSuccess = (email: string, selectedRole: "tenant" | "owner") => {
    setUser({ email, role: selectedRole });
    setToast({
      message: `Signed in successfully as ${email}!`,
      type: "success",
    });
  };

  const handleSignOut = () => {
    setUser(null);
    setToast({
      message: "You have signed out successfully.",
      type: "success",
    });
  };

  return (
    <main className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen overflow-x-hidden transition-colors duration-300">
      <Navbar
        user={user}
        setIsSignInModalOpen={setIsSignInModalOpen}
        onSignOut={handleSignOut}
        theme={theme}
        setTheme={setTheme}
      />
      
      {/* 1. HERO SECTION */}
      <WelcomeHero />

      {/* 2. AI PROMO VIDEO SECTION */}
      <AIPromoVideo />

      {/* 3. CURRENT HERO SHOWCASE */}
      <Hero />

      {/* 4. HOW RENTO WORKS */}
      <Workflow />

      {/* 5. SEARCH EXPERIENCE */}
      <PropertyDiscovery setToast={setToast} />

      {/* 6. VERIFIED RENTALS */}
      <VerifiedRentals />

      {/* 5.1 WHY TRUST RENTO (FEATURES) */}
      <Features />

      {/* 7.1 TRUST & SAFETY (DESIGNED FOR COMPLETE TRUST) */}
      <TrustSafety />
      
      {/* 7.15 VIDEO EXPERIENCE SHOWCASE */}
      <VideoShowcase />
      
      {/* 7.2 DOWNLOAD THE APP SECTION */}
      <DownloadApp />
      
      {/* 8. TESTIMONIALS */}
      <Testimonials />
      
      {/* 9. FAQ SECTION */}
      <FAQ />
      
      {/* 10. FOOTER */}
      <Footer />

      {/* Auth Modals */}
      <AnimatePresence>
        {isSignInModalOpen && (
          <SignInModal
            isOpen={isSignInModalOpen}
            onClose={() => setIsSignInModalOpen(false)}
            onSignInSuccess={handleSignInSuccess}
          />
        )}
      </AnimatePresence>

      {/* Global Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}