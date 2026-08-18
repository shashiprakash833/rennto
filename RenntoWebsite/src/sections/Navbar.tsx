"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, ShieldAlert, ArrowRight, Menu, X, LogOut, UserCheck, Sun, Moon } from "lucide-react";
import { UserContext } from "@/app/page";

interface NavbarProps {
  user: UserContext | null;
  setIsSignInModalOpen: (open: boolean) => void;
  onSignOut: () => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export default function Navbar({
  user,
  setIsSignInModalOpen,
  onSignOut,
  theme,
  setTheme,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (isHome) {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        const headerOffset = 80;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-brand-indigo/25 group-hover:scale-105 transition-transform">
                <img
                  src="/logo.png"
                  alt="Rennto Logo"
                  className="w-full h-full object-cover select-none"
                />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Rennto<span className="text-brand-indigo">.</span>
              </span>
            </Link>
          </div>

          {/* Middle Navigation (Common Sections) */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              href={isHome ? "#search-properties" : "/#search-properties"} 
              onClick={(e) => handleScroll(e, "search-properties")}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Search
            </Link>
            <Link 
              href={isHome ? "#how-it-works" : "/#how-it-works"} 
              onClick={(e) => handleScroll(e, "how-it-works")}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              How it Works
            </Link>
            <Link 
              href={isHome ? "#verified-rentals" : "/#verified-rentals"} 
              onClick={(e) => handleScroll(e, "verified-rentals")}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Verified Rentals
            </Link>
            <Link 
              href={isHome ? "#trust-safety" : "/#trust-safety"} 
              onClick={(e) => handleScroll(e, "trust-safety")}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Trust & Safety
            </Link>
            <Link href="/contact" className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Contact Us
            </Link>
          </nav>

          {/* Right Side - Tenant, Owner, Dark Mode, Sign In / Profile, Get Started / Sign Out */}
          <div className="hidden lg:flex items-center space-x-6">
            

            {user ? (
              // Authenticated User Menu Header State
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full">
                  <div className="w-5 h-5 rounded-full bg-brand-indigo flex items-center justify-center text-[10px] text-white font-extrabold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                    {user.email}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                    user.role === "tenant" ? "bg-brand-indigo/10 dark:bg-brand-indigo/20 text-brand-indigo" : "bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple"
                  }`}>
                    {user.role}
                  </span>
                </div>
                
                <button
                  onClick={onSignOut}
                  className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              // Guest Header State
              <>
                <Link
                  href="#download-app"
                  className="inline-flex items-center justify-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all rounded-full shadow-md shadow-brand-indigo/20"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-3">
            

            {/* Empty space for mobile layout where quick role switch used to be */}
            <div className="hidden" />

            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="p-2 rounded-xl text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-250 dark:border-slate-850 py-4 px-6 space-y-4 shadow-xl"
        >
          <div className="flex flex-col space-y-3">
            <Link
              href={isHome ? "#search-properties" : "/#search-properties"}
              onClick={(e) => {
                setIsOpen(false);
                handleScroll(e, "search-properties");
              }}
              className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
            >
              Search
            </Link>
            <Link
              href={isHome ? "#how-it-works" : "/#how-it-works"}
              onClick={(e) => {
                setIsOpen(false);
                handleScroll(e, "how-it-works");
              }}
              className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
            >
              How it Works
            </Link>
            <Link
              href={isHome ? "#verified-rentals" : "/#verified-rentals"}
              onClick={(e) => {
                setIsOpen(false);
                handleScroll(e, "verified-rentals");
              }}
              className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
            >
              Verified Rentals
            </Link>
            <Link
              href={isHome ? "#trust-safety" : "/#trust-safety"}
              onClick={(e) => {
                setIsOpen(false);
                handleScroll(e, "trust-safety");
              }}
              className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
            >
              Trust & Safety
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
            >
              Contact Us
            </Link>
          </div>

          <hr className="border-slate-100 dark:border-slate-850" />

          {user ? (
            <div className="flex flex-col space-y-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span className="truncate">{user.email}</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-indigo/10 dark:bg-brand-indigo/20 text-brand-indigo ml-auto">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="w-full text-center py-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1" />
              <Link
                href="#download-app"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all rounded-full shadow-md shadow-brand-indigo/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </header>
  );
}
