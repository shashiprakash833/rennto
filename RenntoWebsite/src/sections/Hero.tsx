"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import OwnerHomeScreenMockup from "../components/OwnerHomeScreenMockup";

export default function Hero() {
  const tenantScreenshots = [
    "/screenshots/tenant_home.jpg",
    "/screenshots/tenant_filters.jpg",
    "/screenshots/tenant_details.jpg",
  ];

  const ownerScreenshots = [
    "/screenshots/owner_app.jpg",
    "/screenshots/owner_requests.jpg",
    "/screenshots/owner_room_details.jpg",
  ];

  const [currentScreen, setCurrentScreen] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScreen((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Mobile mockups floating variables
  const ownerFloatTransition = {
    y: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut" as const,
      repeatType: "reverse" as const,
    }
  } as const;

  const tenantFloatTransition = {
    y: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut" as const,
      repeatType: "reverse" as const,
      delay: 0.5
    }
  } as const;

  return (
    <section id="hero-showcase" className="relative overflow-hidden py-16 lg:py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex items-center border-t border-slate-150 dark:border-slate-900">
      {/* Background Gradients & Grid */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 dark:opacity-20" />
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-purple/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[35rem] h-[35rem] bg-brand-indigo/10 rounded-full blur-[140px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
        
        {/* Connection Lines (Desktop Only SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0 opacity-30 dark:opacity-50 hidden lg:block" viewBox="0 0 1200 640">
          <defs>
            <linearGradient id="glow-grad-left" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6C4DFF" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="glow-grad-right" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#EC4899" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6C4DFF" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M 260,320 C 380,320 480,110 560,110" fill="none" stroke="url(#glow-grad-left)" strokeWidth="2.5" strokeDasharray="5,5" />
          <path d="M 940,320 C 820,320 720,110 640,110" fill="none" stroke="url(#glow-grad-right)" strokeWidth="2.5" strokeDasharray="5,5" />
        </svg>

        {/* Animated Connection Particles */}
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-brand-indigo shadow-[0_0_12px_#4F46E5] pointer-events-none z-10 hidden lg:block"
          animate={{
            left: ["22%", "50%"],
            top: ["50%", "17%"],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ transform: "translate(-50%, -50%)" }}
        />

        <motion.div
          className="absolute w-3 h-3 rounded-full bg-brand-pink shadow-[0_0_12px_#EC4899] pointer-events-none z-10 hidden lg:block"
          animate={{
            left: ["78%", "50%"],
            top: ["50%", "17%"],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
          style={{ transform: "translate(-50%, -50%)" }}
        />

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">

          {/* 1. LEFT COLUMN: OWNER MOBILE SCREEN */}
          <div className="hidden lg:flex lg:col-span-4 justify-center items-center relative h-[580px]">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={ownerFloatTransition}
              className="flex-shrink-0 z-10"
            >
              <div
                className="w-[275px] h-[560px] rounded-[2.8rem] bg-slate-950 p-[6px] border-[6px] border-slate-300 dark:border-slate-800 shadow-2xl relative hover:shadow-[0_0_50px_rgba(79,70,229,0.15)] transition-shadow duration-500 origin-center"
                style={{
                  transform: "perspective(1200px) rotateY(12deg) rotateX(3deg) translateZ(10px)",
                  transformStyle: "preserve-3d"
                }}
              >
                {/* Mobile Screen Container */}
                <div className="relative w-full h-full bg-white dark:bg-slate-950 rounded-[2.4rem] overflow-hidden">
                <motion.div
                  className="flex w-full h-full"
                  animate={{ x: `-${(currentScreen % 3) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="w-full h-full flex-shrink-0 overflow-hidden select-none">
                    <OwnerHomeScreenMockup />
                  </div>
                  <img
                    src="/screenshots/owner_requests.jpg"
                    alt="Owner Requests Screenshot"
                    className="w-full h-full object-cover flex-shrink-0 select-none"
                  />
                  <img
                    src="/screenshots/owner_room_details.jpg"
                    alt="Owner Details Screenshot"
                    className="w-full h-full object-cover flex-shrink-0 select-none"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
          </div>

          {/* 2. CENTER COLUMN: HERO MARKETING CONTENT */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.1,
                },
              },
            }}
            initial="hidden"
            animate="visible"
            className="col-span-1 lg:col-span-4 flex flex-col items-center text-center space-y-3 relative z-20 px-2 lg:-mt-2"
          >
            
            {/* 1. Rentto Logo */}
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 120 } }
              }}
              className="relative"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 rounded-[2rem] overflow-hidden flex items-center justify-center shadow-[0_0_35px_rgba(108,77,255,0.4)] border border-[#6C4DFF]/40 select-none group cursor-pointer relative"
              >
                <img
                  src="/logo.png"
                  alt="Rennto Logo"
                  className="w-full h-full object-cover select-none"
                />
                <div className="absolute inset-0 rounded-[2rem] bg-[#6C4DFF] opacity-30 blur-md -z-10 group-hover:scale-115 transition-transform duration-300" />
              </motion.div>
            </motion.div>
            
            {/* 2. Connecting Owners & Tenants Tag */}
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-[8.5px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider bg-white/80 dark:bg-slate-955/80 border border-slate-200/60 dark:border-slate-800/60 px-3.5 py-0.5 rounded-full shadow-xs"
            >
              Connecting Owners & Tenants
            </motion.span>

             {/* 3. Explore Verified Rentals Heading */}
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
              }}
              className="text-lg sm:text-xl lg:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5"
            >
              Explore Verified Rentals with <br />
              <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">
                Rentto.
              </span>
            </motion.h1>

            {/* 4. Marketing Tagline */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-[11px] text-slate-655 dark:text-slate-400 max-w-[280px] mx-auto font-bold leading-normal"
            >
              Rent verified student hostels and flats directly from owners with zero broker fees and escrow safety.
            </motion.p>

            {/* Rennto Platform Highlights */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
              className="grid grid-cols-2 gap-2 w-full max-w-[290px] pt-1"
            >
              {[
                { text: "Smart Search", desc: "Interactive map audits" },
                { text: "Direct Channels", desc: "No broker middlemen" },
                { text: "Verified Hosts", desc: "Background vetted" },
                { text: "Secure Escrows", desc: "Protected deposits" }
              ].map((h) => (
                <div key={h.text} className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/60 p-2 rounded-xl text-left">
                  <p className="text-[9px] font-black text-slate-850 dark:text-white leading-none">{h.text}</p>
                  <p className="text-[7.5px] text-slate-455 dark:text-slate-500 font-semibold mt-0.5 leading-none">{h.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* 5. QR Code Card (Increased size by 30% from base) */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
              }}
              className="w-full max-w-[310px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-4.5 shadow-xl shadow-slate-200/30 dark:shadow-none space-y-3.5 text-center mt-1 border-t-4 border-t-brand-purple relative overflow-hidden"
            >
              {/* Subtle background glow effect inside the card */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-brand-purple/5 rounded-full blur-2xl pointer-events-none -z-10" />

              {/* QR Code Container with floating animation */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatType: "reverse"
                }}
                className="w-40 h-40 mx-auto bg-white p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/20 flex items-center justify-center relative group"
              >
                <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  {/* Corner tracking squares */}
                  <rect x="5" y="5" width="25" height="25" rx="4" className="text-brand-purple" fill="currentColor" />
                  <rect x="10" y="10" width="15" height="15" rx="2" fill="white" />
                  <rect x="13" y="13" width="9" height="9" rx="1" className="text-brand-indigo" fill="currentColor" />

                  <rect x="70" y="5" width="25" height="25" rx="4" className="text-brand-purple" fill="currentColor" />
                  <rect x="75" y="10" width="15" height="15" rx="2" fill="white" />
                  <rect x="78" y="13" width="9" height="9" rx="1" className="text-brand-indigo" fill="currentColor" />

                  <rect x="5" y="70" width="25" height="25" rx="4" className="text-brand-purple" fill="currentColor" />
                  <rect x="10" y="75" width="15" height="15" rx="2" fill="white" />
                  <rect x="13" y="78" width="9" height="9" rx="1" className="text-brand-indigo" fill="currentColor" />

                  {/* Center visual anchor */}
                  <rect x="42" y="42" width="16" height="16" rx="3" className="text-brand-purple" fill="currentColor" />
                  <circle cx="50" cy="50" r="4" fill="white" />

                  {/* Qr Dots */}
                  <rect x="35" y="5" width="6" height="6" rx="1" className="text-slate-800" />
                  <rect x="45" y="12" width="12" height="6" rx="1" className="text-brand-indigo" />
                  <rect x="60" y="8" width="6" height="12" rx="1" className="text-slate-700" />

                  <rect x="5" y="35" width="6" height="12" rx="1" className="text-brand-indigo" />
                  <rect x="15" y="45" width="12" height="6" rx="1" className="text-slate-800" />
                  <rect x="5" y="55" width="6" height="6" rx="1" className="text-brand-purple" />

                  <rect x="35" y="85" width="12" height="6" rx="1" className="text-slate-700" />
                  <rect x="50" y="75" width="6" height="18" rx="1" className="text-brand-indigo" />
                  <rect x="60" y="80" width="6" height="6" rx="1" className="text-brand-purple" />

                  <rect x="85" y="35" width="10" height="6" rx="1" className="text-brand-purple" />
                  <rect x="75" y="45" width="6" height="12" rx="1" className="text-slate-800" />
                  <rect x="85" y="60" width="10" height="6" rx="1" className="text-brand-indigo" />

                  <rect x="35" y="30" width="6" height="6" rx="1" className="text-brand-purple" />
                  <rect x="30" y="50" width="6" height="6" rx="1" className="text-brand-indigo" />
                  <rect x="55" y="35" width="12" height="6" rx="1" className="text-slate-700" />
                </svg>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-brand-purple/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-black text-brand-purple bg-white/95 border border-brand-purple/25 px-2.5 py-0.5 rounded-full shadow uppercase tracking-wider scale-95">
                    Scan Me
                  </span>
                </div>
              </motion.div>

              {/* Text Label */}
              <div className="space-y-0.5">
                <h4 className="text-[11.5px] font-black text-slate-800 dark:text-slate-200">
                  Scan to Download the Rentto App
                </h4>
                <p className="text-[8px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Available for Android & iOS
                </p>
              </div>

              {/* Official Google Play badge */}
              <div className="flex justify-center pt-0.5">
                <motion.a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2.5 bg-black text-white px-4.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 shadow-md cursor-pointer hover:bg-slate-900 transition-all select-none"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M3.25 2.75C3.0625 2.9375 3 3.225 3 3.6V20.4C3 20.775 3.0625 21.0625 3.25 21.25L3.3375 21.3375L12.75 11.925V11.75V11.575L3.3375 2.1625L3.25 2.75Z" fill="#00E676" />
                    <path d="M15.9 15.075L12.75 11.925V11.75V11.575L15.9 8.425L15.9875 8.475L19.725 10.6C20.7875 11.2 20.7875 12.3 19.725 12.9L15.9875 15.025L15.9 15.075Z" fill="#FFC107" />
                    <path d="M12.75 11.75L3.25 21.25C3.5625 21.5625 4.075 21.5875 4.675 21.25L15.9 15.075L12.75 11.75Z" fill="#FF3D00" />
                    <path d="M12.75 11.75L15.9 8.425L4.675 2.25C4.075 1.9125 3.5625 1.9375 3.25 2.25L12.75 11.75Z" fill="#1976D2" />
                  </svg>
                  <div className="text-left leading-tight">
                    <p className="text-[6px] text-slate-300 font-extrabold uppercase tracking-wide">GET IT ON</p>
                    <p className="text-[10px] font-black text-white">Google Play</p>
                  </div>
                </motion.a>
              </div>
            </motion.div>
          </motion.div>

          {/* 3. RIGHT COLUMN: TENANT MOBILE SCREEN */}
          <div className="hidden lg:flex lg:col-span-4 justify-center items-center relative h-[580px]">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={tenantFloatTransition}
              className="flex-shrink-0 z-10"
            >
              <div
                className="w-[275px] h-[560px] rounded-[2.8rem] bg-slate-950 p-[6px] border-[6px] border-slate-300 dark:border-slate-800 shadow-2xl relative hover:shadow-[0_0_50px_rgba(236,72,153,0.15)] transition-shadow duration-500 origin-center"
                style={{
                  transform: "perspective(1200px) rotateY(-12deg) rotateX(3deg) translateZ(10px)",
                  transformStyle: "preserve-3d"
                }}
              >
                {/* Mobile Screen Container */}
                <div className="relative w-full h-full bg-white dark:bg-slate-950 rounded-[2.4rem] overflow-hidden">
                <motion.div
                  className="flex w-full h-full"
                  animate={{ x: `-${(currentScreen % tenantScreenshots.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {tenantScreenshots.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`Tenant App Screenshot ${idx + 1}`}
                      className="w-full h-full object-cover flex-shrink-0 select-none"
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
          </div>

          {/* 4. MOBILE-ONLY APP SHOWCASE: Display screens side-by-side below center content */}
          <div className="flex lg:hidden flex-row justify-center items-center gap-4 w-full mt-10 overflow-hidden select-none scale-[0.8] sm:scale-95 origin-center">
            
            {/* Left Screen (Owner App Mockup) */}
            <div className="w-[185px] h-[380px] rounded-[2rem] bg-slate-950 p-[4px] border-[4px] border-slate-300 dark:border-slate-800 shadow-xl relative flex-shrink-0">
              <div className="relative w-full h-full bg-white dark:bg-slate-950 rounded-[1.7rem] overflow-hidden">
                <motion.div
                  className="flex w-full h-full"
                  animate={{ x: `-${(currentScreen % 3) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="w-full h-full flex-shrink-0 overflow-hidden select-none">
                    <OwnerHomeScreenMockup />
                  </div>
                  <img
                    src="/screenshots/owner_requests.jpg"
                    alt="Owner Requests Screenshot"
                    className="w-full h-full object-cover flex-shrink-0 select-none"
                  />
                  <img
                    src="/screenshots/owner_room_details.jpg"
                    alt="Owner Details Screenshot"
                    className="w-full h-full object-cover flex-shrink-0 select-none"
                  />
                </motion.div>
              </div>
            </div>

            {/* Right Screen (Tenant App Mockup) */}
            <div className="w-[185px] h-[380px] rounded-[2rem] bg-slate-950 p-[4px] border-[4px] border-slate-300 dark:border-slate-800 shadow-xl relative flex-shrink-0">
              <div className="relative w-full h-full bg-white dark:bg-slate-950 rounded-[1.7rem] overflow-hidden">
                <motion.div
                  className="flex w-full h-full"
                  animate={{ x: `-${(currentScreen % tenantScreenshots.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {tenantScreenshots.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`Tenant App Screenshot ${idx + 1}`}
                      className="w-full h-full object-cover flex-shrink-0 select-none"
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </div>

          {/* 5. MOBILE-ONLY DETAILS: Extra Rennto features below mockups */}
          <div className="block lg:hidden w-full max-w-sm mx-auto space-y-4 px-4 pt-4 text-center">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "🤝 100% Direct", desc: "No Broker Fees" },
                { label: "🛡️ On-Site Audits", desc: "Verified Listings" },
                { label: "🔒 Escrow Safety", desc: "Secure Deposits" },
                { label: "💬 Real-Time Chat", desc: "Instant Connection" }
              ].map((item) => (
                <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-2.5 rounded-xl text-left shadow-xs">
                  <p className="text-[10px] font-black text-slate-850 dark:text-white leading-none">{item.label}</p>
                  <p className="text-[8px] text-slate-455 dark:text-slate-500 font-bold mt-0.5 leading-none">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[10.5px] text-slate-500 font-bold leading-normal">
              Join thousands of renters finding verified hostels, flats, and PG accommodations directly from trust-badge owners.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
