"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-slate-900">
          
          {/* Logo & Pitch */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-brand-indigo/15">
                <img
                  src="/logo.png"
                  alt="Rennto Logo"
                  className="w-full h-full object-cover select-none"
                />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Rennto<span className="text-brand-indigo">.</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
              Rennto is a high-trust, brokerage-free rental platform bridging owners and tenants through rigorous admin checks, digital agreements, and smart collect toolkits.
            </p>
            {/* Social Icons */}
            <div className="flex space-x-4">
              <a href="#twitter" className="w-8 h-8 rounded-lg bg-slate-905 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#linkedin" className="w-8 h-8 rounded-lg bg-slate-905 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
                </svg>
              </a>
              <a href="#github" className="w-8 h-8 rounded-lg bg-slate-905 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick links columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:col-span-5 gap-8">
            
            {/* Products Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-white tracking-wider">Product</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
                <li>
                  <Link 
                    href={isHome ? "#search-properties" : "/#search-properties"} 
                    onClick={(e) => handleScroll(e, "search-properties")}
                    className="hover:text-white transition-colors"
                  >
                    Hostel Pages
                  </Link>
                </li>
                <li>
                  <Link 
                    href={isHome ? "#search-properties" : "/#search-properties"} 
                    onClick={(e) => handleScroll(e, "search-properties")}
                    className="hover:text-white transition-colors"
                  >
                    Apartments
                  </Link>
                </li>
                <li>
                  <Link 
                    href={isHome ? "#search-properties" : "/#search-properties"} 
                    onClick={(e) => handleScroll(e, "search-properties")}
                    className="hover:text-white transition-colors"
                  >
                    Office Leases
                  </Link>
                </li>
                <li>
                  <a
                    href="#download-app"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById("download-app");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        window.dispatchEvent(new CustomEvent("rento-highlight-qr"));
                      } else {
                        window.location.href = "/#download-app";
                      }
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Mobile App
                  </a>
                 </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-white tracking-wider">Resources</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
                <li>
                  <Link 
                    href={isHome ? "#how-it-works" : "/#how-it-works"} 
                    onClick={(e) => handleScroll(e, "how-it-works")}
                    className="hover:text-white transition-colors"
                  >
                    Verification Flow
                  </Link>
                </li>
                <li>
                  <Link 
                    href={isHome ? "#features" : "/#features"} 
                    onClick={(e) => handleScroll(e, "features")}
                    className="hover:text-white transition-colors"
                  >
                    Landlord Portal
                  </Link>
                </li>
                <li>
                  <Link 
                    href={isHome ? "#features" : "/#features"} 
                    onClick={(e) => handleScroll(e, "features")}
                    className="hover:text-white transition-colors"
                  >
                    Tenant Safety
                  </Link>
                </li>
                <li>
                  <Link 
                    href={isHome ? "#faq" : "/#faq"} 
                    onClick={(e) => handleScroll(e, "faq")}
                    className="hover:text-white transition-colors"
                  >
                    General FAQs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contacts Column */}
            <div className="space-y-4 col-span-2 sm:col-span-1">
              <h4 className="text-xs font-extrabold uppercase text-white tracking-wider">Contact</h4>
              <ul className="space-y-3 text-xs font-semibold text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-indigo" />
                  <span>support@rennto.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-brand-indigo" />
                  <span>+1 (800) 555-0199</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-indigo shrink-0 mt-0.5" />
                  <span>Hyderabad,<br />Telangana, India</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Newsletter Column */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-extrabold uppercase text-white tracking-wider">Stay Updated</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Subscribe to our newsletter for early access to premium verified student hostels and apartment listings.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-brand-indigo rounded-xl text-xs font-semibold text-white focus:outline-none transition-all pr-10"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-brand-indigo hover:bg-brand-purple active:scale-95 transition-all text-white rounded-lg flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
              <AnimatePresence>
                {isSubscribed && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-emerald-500 font-bold"
                  >
                    ✓ Subscribed successfully!
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-slate-500 gap-4">
          <p>© 2026 Rennto Inc. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="px-3.5 py-1.5 rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo hover:bg-brand-indigo hover:text-white transition-all duration-300 text-xs font-bold shadow-xs">
              Privacy Policy
            </Link>
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="px-3.5 py-1.5 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple hover:bg-brand-purple hover:text-white transition-all duration-300 text-xs font-bold shadow-xs">
              Terms & Conditions
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}