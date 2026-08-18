"use client";

import { motion } from "framer-motion";
import { ShieldCheck, UserCheck, Lock, Sparkles, Building, Landmark, Percent } from "lucide-react";

export default function Features() {
  const trustFeatures = [
    {
      id: "f1",
      title: "100% Verified Listings",
      description: "Our field agents personally audit every property, taking photos and verifying ownership documents before any listing goes live.",
      icon: ShieldCheck,
      badge: "Verified Properties",
      color: "text-[#6C4DFF] bg-[#6C4DFF]/10 border-brand-indigo/20",
    },
    {
      id: "f2",
      title: "Authenticated Users",
      description: "We verify owner and tenant government profiles, helping you communicate and contract only with genuine individuals.",
      icon: UserCheck,
      badge: "Verified Profiles",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      id: "f3",
      title: "Scam & Fake Listing Prevention",
      description: "Intelligent threat detection scans for duplicate properties, anomalous rent prices, and suspicious chat behavior.",
      icon: Lock,
      badge: "Fraud Shield",
      color: "text-brand-pink bg-brand-pink/10 border-brand-pink/20",
    },
    {
      id: "f4",
      title: "Escrow Deposit Lock",
      description: "Security deposits are held in secure, bank-level escrow accounts, ensuring your funds are protected until move-in clearance.",
      icon: ShieldCheck,
      badge: "Secure Escrows",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <section
      id="features"
      className="py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 transition-colors duration-300 relative overflow-hidden"
    >
      {/* Background visual accents */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-brand-indigo/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-brand-purple/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT COLUMN: trust summary dashboard graphic */}
          <div className="lg:col-span-5 space-y-8 text-center lg:text-left">
            
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Why Can You <br />
                <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">
                  Trust Rento?
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-md mx-auto lg:mx-0">
                We've built a zero-fraud rental platform where verified owners connect directly with verified tenants, bypassing middleman scams.
              </p>
            </div>

            {/* Quick trust metrics panel */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850 p-6 rounded-[2rem] space-y-4 shadow-inner max-w-sm mx-auto lg:mx-0">
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center text-brand-indigo shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none">100% Audited Rooms</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider mt-1">Direct Field Inspections</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none">Escrow-Locked Deposits</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider mt-1">Bank-Grade Cash Safeguard</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none">0% Broker Commission</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider mt-1">Zero Middleman Fraud</p>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Stack of 4 detailed trust pillars */}
          <div className="lg:col-span-7 space-y-5">
            {trustFeatures.map((feat) => {
              const IconComponent = feat.icon;
              return (
                <motion.div
                  key={feat.id}
                  whileHover={{ x: 6, y: -2 }}
                  className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-5 hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg dark:hover:shadow-slate-950/25 transition-all duration-300 flex flex-col sm:flex-row gap-4 items-start group"
                >
                  {/* Icon badge */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-transform duration-300 group-hover:scale-105 ${feat.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-none">
                        {feat.title}
                      </h3>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 group-hover:bg-brand-indigo/10 group-hover:text-brand-indigo transition-colors">
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}