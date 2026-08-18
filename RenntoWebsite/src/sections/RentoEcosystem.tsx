"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, ShieldCheck, Users, MessageSquare, CreditCard, BarChart3, Sparkles, Plus, ArrowRight
} from "lucide-react";

interface Hotspot {
  id: string;
  title: string;
  description: string;
  x: number; // percentage from left
  y: number; // percentage from top
  icon: any;
  color: string;
}

const ECOSYSTEM_ITEMS: Hotspot[] = [
  {
    id: "discovery",
    title: "Property Discovery",
    description: "Browse apartments, hostels, and commercial spaces.",
    x: 20,
    y: 24,
    icon: Home,
    color: "from-brand-indigo to-blue-500",
  },
  {
    id: "verification",
    title: "Property Verification",
    description: "Verified listings build trust and transparency.",
    x: 55,
    y: 20,
    icon: ShieldCheck,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "tenant",
    title: "Tenant Management",
    description: "Track tenant inquiries and occupancy.",
    x: 82,
    y: 36,
    icon: Users,
    color: "from-brand-purple to-brand-pink",
  },
  {
    id: "communication",
    title: "Direct Owner Contact",
    description: "Connect directly without broker interference.",
    x: 22,
    y: 65,
    icon: MessageSquare,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "payments",
    title: "Rent Collection",
    description: "Secure and streamlined payment workflows.",
    x: 48,
    y: 76,
    icon: CreditCard,
    color: "from-brand-indigo to-brand-purple",
  },
  {
    id: "analytics",
    title: "Analytics Dashboard",
    description: "Track performance, occupancy, and revenue.",
    x: 78,
    y: 60,
    icon: BarChart3,
    color: "from-blue-500 to-brand-purple",
  }
];

export default function RentoEcosystem() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <section 
      id="rento-ecosystem" 
      className="py-24 sm:py-32 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300 relative overflow-hidden"
    >
      {/* Background Soft Mesh Gradients */}
      <div className="absolute top-1/4 left-1/10 w-[35rem] h-[35rem] bg-brand-indigo/5 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/10 w-[30rem] h-[30rem] bg-brand-purple/5 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-indigo/10 dark:bg-brand-indigo/20 border border-brand-indigo/15 text-brand-indigo text-xs font-black uppercase tracking-widest shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Product Showcase
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Explore the <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Rento Ecosystem</span>
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg text-slate-655 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            See how Rento simplifies the entire rental journey — from property listing and verification to tenant discovery, communication, rent collection, and property management.
          </p>
        </div>

        {/* Centerpiece: Interactive Ecosystem Map */}
        <div className="relative max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full aspect-[850/500] rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-md p-4 sm:p-6"
          >
            {/* Base Image */}
            <img 
              src="/rento_isometric_ecosystem.png" 
              alt="Rento Isometric Ecosystem" 
              className="w-full h-full object-contain select-none pointer-events-none"
            />

            {/* Hotspot overlays */}
            {ECOSYSTEM_ITEMS.map((item, idx) => {
              const isActive = activeIdx === idx;
              const IconComponent = item.icon;

              return (
                <div
                  key={item.id}
                  className="absolute"
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                >
                  {/* Hotspot Pulsing Indicator */}
                  <button
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseLeave={() => setActiveIdx(null)}
                    onClick={() => setActiveIdx(isActive ? null : idx)}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-950/80 border-2 border-brand-indigo flex items-center justify-center relative cursor-pointer focus:outline-none transition-all duration-300 z-30 shadow-lg"
                    style={{ transform: "translate(-50%, -50%)" }}
                  >
                    {/* Pulsing rings */}
                    <span className="absolute inset-0 rounded-full bg-brand-indigo opacity-40 animate-ping pointer-events-none" />
                    
                    {/* Center Core dot */}
                    <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isActive ? "bg-brand-pink scale-125" : "bg-brand-indigo"
                    }`} />
                  </button>

                  {/* Glassmorphic Popover Overlay Card (Desktop Only) */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xl z-40 hidden sm:block select-none"
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shrink-0`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                          {item.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Feature Highlights Grid Below */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {ECOSYSTEM_ITEMS.map((item, idx) => {
            const isActive = activeIdx === idx;
            const IconComponent = item.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                className={`p-6 rounded-3xl border transition-all duration-500 cursor-pointer flex gap-4 text-left relative overflow-hidden ${
                  isActive
                    ? "bg-slate-50 dark:bg-slate-950/60 border-brand-indigo/35 shadow-xl shadow-brand-indigo/5 translate-y-[-4px]"
                    : "bg-white dark:bg-slate-950/20 border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950/40 hover:border-slate-200 dark:hover:border-slate-800 hover:shadow-md hover:translate-y-[-2px]"
                }`}
              >
                {/* Visual glow indicator inside card */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-indigo/5 to-transparent pointer-events-none" />
                )}

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 relative z-10 ${
                  isActive 
                    ? "bg-brand-indigo text-white shadow-md shadow-brand-indigo/20" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="relative z-10 space-y-1">
                  <h3 className={`text-base font-black transition-colors ${
                    isActive ? "text-brand-indigo" : "text-slate-900 dark:text-white"
                  }`}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
