"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, ShieldCheck, Search, QrCode, Sparkles, 
  Tv, Volume2, Settings, Maximize2, Check, ArrowRight,
  TrendingUp, Users, Building, Laptop, Smartphone
} from "lucide-react";

type VideoStage = "tenant-search" | "owner-listing" | "verified-badge" | "connection" | "qr-reveal";

interface StageConfig {
  id: VideoStage;
  title: string;
  subtitle: string;
  overlayText: string;
  duration: number; // in seconds
}

export default function AIPromoVideo() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stages: StageConfig[] = [
    {
      id: "tenant-search",
      title: "Tenant Discovery",
      subtitle: "Searching Verified PGs & Apartments",
      overlayText: "Verified Rentals",
      duration: 3,
    },
    {
      id: "owner-listing",
      title: "Owner Management",
      subtitle: "Listing Properties & Zero Fee Dashboard",
      overlayText: "Zero Broker Fees",
      duration: 3,
    },
    {
      id: "verified-badge",
      title: "Badge Verification",
      subtitle: "AI Audit & Deed Inspection Check",
      overlayText: "Trusted Owners",
      duration: 3,
    },
    {
      id: "connection",
      title: "Direct Connect",
      subtitle: "Escrow Protected Owner-Tenant Match",
      overlayText: "Trusted Tenants",
      duration: 3,
    },
    {
      id: "qr-reveal",
      title: "Rentto App",
      subtitle: "Scan to Download Rento iOS & Android App",
      overlayText: "One Platform for Rentals",
      duration: 3,
    },
  ];

  const currentStage = stages[currentStageIdx];

  // Global loop timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalTime = 100; // Update progress every 100ms
    const totalDuration = 15; // Total loop duration is 15 seconds
    const progressPerStep = (intervalTime / (totalDuration * 1000)) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + progressPerStep;
        if (nextProgress >= 100) {
          setCurrentStageIdx(0);
          return 0;
        }

        // Calculate stage index based on progress (5 stages, each 20%)
        const nextIdx = Math.floor(nextProgress / 20);
        if (nextIdx !== currentStageIdx && nextIdx < 5) {
          setCurrentStageIdx(nextIdx);
        }

        return nextProgress;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentStageIdx]);

  const handleStageSelect = (idx: number) => {
    setCurrentStageIdx(idx);
    setProgress(idx * 20);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section id="ai-promo-video" className="py-24 bg-slate-900 text-white relative overflow-hidden transition-colors duration-300">
      
      {/* Background visual indicators */}
      <div className="absolute top-0 right-1/4 w-[50rem] h-[50rem] bg-brand-indigo/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-brand-purple/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-70 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            See the Platform <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Come to Life</span>
          </h2>
          <p className="text-lg text-slate-400 font-medium">
            Watch how Rentto connects Property Owners and Tenants directly.
          </p>
        </div>

        {/* Cinematic Workspace Content Layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT SIDE: Narrative Storytelling Grid with step triggers */}
          <div className="lg:col-span-5 space-y-5 order-2 lg:order-1">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-l-4 border-brand-indigo pl-3">
                15-Second Platform Explainer
              </h3>
              <p className="text-sm text-slate-400 font-semibold leading-relaxed">
                Click on any step below to jump to that part of the motion demonstration.
              </p>
            </div>

            <div className="space-y-3">
              {stages.map((stage, idx) => {
                const isActive = idx === currentStageIdx;
                return (
                  <button
                    key={stage.id}
                    onClick={() => handleStageSelect(idx)}
                    className={`w-full text-left p-4.5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex items-center gap-4 group active:scale-98 ${
                      isActive 
                        ? "bg-white/10 border-brand-indigo/30 shadow-lg shadow-brand-indigo/5" 
                        : "bg-transparent border-white/5 hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Glowing highlight indicator */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeStageGlow" 
                        className="absolute inset-0 bg-gradient-to-r from-brand-indigo/10 to-transparent pointer-events-none" 
                      />
                    )}

                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-colors duration-300 relative z-10 ${
                      isActive 
                        ? "bg-brand-indigo text-white shadow-md shadow-brand-indigo/20" 
                        : "bg-white/5 text-slate-400 group-hover:text-slate-200"
                    }`}>
                      0{idx + 1}
                    </div>

                    <div className="relative z-10 flex-grow">
                      <h4 className={`text-sm font-black transition-colors ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      }`}>
                        {stage.title}
                      </h4>
                      <p className={`text-xs font-semibold transition-colors mt-0.5 ${
                        isActive ? "text-slate-300" : "text-slate-500"
                      }`}>
                        {stage.subtitle}
                      </p>
                    </div>

                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-brand-indigo animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE: PREMIUM MOTION GRAPHICS PLAYER CONTAINER */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative w-full aspect-[16/10] rounded-[2.25rem] bg-slate-950 border border-white/10 shadow-2xl overflow-hidden group shadow-brand-indigo/5"
            >
              {/* Background Video Loop (Ambient Real Estate Technology) */}
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-screen pointer-events-none z-0"
              >
                <source src="https://videos.pexels.com/video-files/5243166/5243166-hd_1920_1080_25fps.mp4" type="video/mp4" />
              </video>

              {/* Glossy Overlay Sheen */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none z-10" />

              {/* Top Simulated Video Player Bar */}
              <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Tv className="w-4 h-4 text-brand-indigo" />
                  <span>Rento System Demo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] bg-brand-purple text-white font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                    Looping Demo
                  </span>
                  <span className="text-[8px] bg-emerald-600 text-white font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                    LIVE
                  </span>
                </div>
              </div>

              {/* STAGE SCREEN CANVAS */}
              <div className="absolute inset-0 w-full h-full flex items-center justify-center p-8 z-10">
                <AnimatePresence mode="wait">
                  
                  {/* STAGE 1: TENANT SEARCH */}
                  {currentStage.id === "tenant-search" && (
                    <motion.div
                      key="stage-tenant-search"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="w-full max-w-[420px] aspect-[1.6] bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col justify-between backdrop-blur-sm"
                    >
                      {/* Search Mockup */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Tenant Portal</span>
                          <span className="text-[8px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-black uppercase">Browse</span>
                        </div>
                        
                        {/* Search field typing simulation */}
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                          <div className="w-full bg-slate-950 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-300 font-semibold flex items-center">
                            <motion.span
                              initial={{ width: 0 }}
                              animate={{ width: "auto" }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="overflow-hidden whitespace-nowrap inline-block border-r-2 border-brand-indigo"
                            >
                              Hostels near tech parks
                            </motion.span>
                          </div>
                        </div>

                        {/* Search Card Results */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-slate-950/60 border border-white/5 p-2 rounded-xl flex flex-col gap-1.5"
                          >
                            <div className="w-full h-12 bg-gradient-to-tr from-brand-indigo/30 to-brand-purple/30 rounded-lg shrink-0 flex items-center justify-center">
                              <Building className="w-5 h-5 text-brand-indigo" />
                            </div>
                            <div>
                              <h5 className="text-[9px] font-black text-slate-200">Grand PG Suites</h5>
                              <p className="text-[7.5px] text-slate-400 font-semibold mt-0.5">Hyderabad • Hostel</p>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-slate-950/60 border border-white/5 p-2 rounded-xl flex flex-col gap-1.5"
                          >
                            <div className="w-full h-12 bg-gradient-to-tr from-brand-purple/30 to-brand-pink/30 rounded-lg shrink-0 flex items-center justify-center">
                              <Building className="w-5 h-5 text-brand-purple" />
                            </div>
                            <div>
                              <h5 className="text-[9px] font-black text-slate-200">Koramangala Flat</h5>
                              <p className="text-[7.5px] text-slate-400 font-semibold mt-0.5">Bangalore • Apartment</p>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STAGE 2: OWNER LISTING */}
                  {currentStage.id === "owner-listing" && (
                    <motion.div
                      key="stage-owner-listing"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="w-full max-w-[420px] aspect-[1.6] bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col justify-between backdrop-blur-sm"
                    >
                      {/* Dashboard Mockup */}
                      <div className="space-y-3 flex-grow flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Owner Dashboard</span>
                          <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded font-black uppercase">Zero Brokerage</span>
                        </div>

                        {/* Middle Stats Card */}
                        <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-[8px] text-slate-450 font-bold uppercase">Total Brokerage Saved</p>
                            <motion.h4 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-lg font-black text-white mt-0.5"
                            >
                              $14,850.00
                            </motion.h4>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Add Property Button Simulation */}
                        <div className="flex gap-2">
                          <div className="flex-1 bg-slate-950 border border-white/5 p-2 rounded-xl text-center flex flex-col items-center justify-center">
                            <Users className="w-4 h-4 text-brand-indigo mb-1" />
                            <span className="text-[8px] text-slate-300 font-bold leading-none">Manage Tenants</span>
                          </div>
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="flex-1 bg-gradient-to-tr from-brand-indigo to-brand-purple text-white p-2 rounded-xl text-center flex flex-col items-center justify-center cursor-pointer relative"
                          >
                            <Building className="w-4 h-4 mb-1" />
                            <span className="text-[8px] font-black uppercase tracking-wider leading-none">List Property</span>
                            
                            {/* Pulse effect */}
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STAGE 3: VERIFIED BADGE */}
                  {currentStage.id === "verified-badge" && (
                    <motion.div
                      key="stage-verified-badge"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      className="w-full max-w-[420px] aspect-[1.6] bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col justify-between backdrop-blur-sm relative overflow-hidden"
                    >
                      {/* Laser scanning beam */}
                      <motion.div
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-brand-indigo shadow-[0_0_12px_#4f46e5] opacity-50 z-20"
                      />

                      {/* Main Showcase Property Card */}
                      <div className="space-y-3 flex-grow flex flex-col justify-between relative z-10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">AI Quality Check</span>
                          <span className="text-[8px] bg-brand-purple/20 text-brand-purple border border-brand-purple/30 px-2 py-0.5 rounded font-black uppercase">Auditing Deed</span>
                        </div>

                        {/* Big Property Card getting stamped */}
                        <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl flex gap-3 relative">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-tr from-brand-indigo to-brand-purple shrink-0 flex items-center justify-center text-white">
                            <Building className="w-7 h-7" />
                          </div>
                          <div className="flex-grow flex flex-col justify-between py-0.5">
                            <div>
                              <h5 className="text-[11px] font-black text-slate-200">Balaji Empire Hostel</h5>
                              <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Verified Documents Check</p>
                            </div>
                            
                            {/* Checklist */}
                            <div className="flex gap-2 text-[7px] text-emerald-400 font-bold">
                              <span>✓ Deed Validated</span>
                              <span>✓ Owner ID Matched</span>
                            </div>
                          </div>

                          {/* Stamp overlay */}
                          <motion.div 
                            initial={{ scale: 2.5, opacity: 0, rotate: -45 }}
                            animate={{ scale: 1, opacity: 1, rotate: -12 }}
                            transition={{ delay: 0.6, type: "spring", damping: 10 }}
                            className="absolute right-4 bottom-2 border-2 border-emerald-500 text-emerald-500 bg-emerald-950/80 px-2.5 py-1 rounded font-black text-[9px] uppercase tracking-widest flex items-center gap-1 shadow-lg"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 fill-emerald-500 text-slate-950" />
                            Verified
                          </motion.div>
                        </div>

                        {/* Bottom logs */}
                        <div className="font-mono text-[7px] text-slate-500 bg-black/40 p-2 rounded-lg flex items-center justify-between">
                          <span>$ rentto-verify --property-id=1092</span>
                          <span className="text-emerald-400 font-bold">SUCCESS ✅</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STAGE 4: CONNECTION ANIMATION */}
                  {currentStage.id === "connection" && (
                    <motion.div
                      key="stage-connection"
                      initial={{ opacity: 0, rotateY: 90 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: -90 }}
                      transition={{ duration: 0.4 }}
                      className="w-full max-w-[420px] aspect-[1.6] bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col justify-between backdrop-blur-sm"
                    >
                      <div className="space-y-4 flex-grow flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Ecosystem Match</span>
                          <span className="text-[8px] bg-brand-pink/15 text-brand-pink border border-brand-pink/20 px-2 py-0.5 rounded font-black uppercase">Direct Connection</span>
                        </div>

                        {/* Avatars connection simulation */}
                        <div className="flex items-center justify-between px-6 py-2 relative">
                          {/* Connection particle line */}
                          <div className="absolute left-16 right-16 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-10 overflow-hidden">
                            <motion.div 
                              animate={{ left: ["-100%", "100%"] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                              className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-brand-indigo to-transparent"
                            />
                          </div>

                          {/* Left Avatar (Tenant) */}
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-brand-indigo flex items-center justify-center text-white relative shadow-lg">
                              <Smartphone className="w-6 h-6 text-brand-indigo" />
                              <div className="absolute -bottom-1 -right-1 bg-brand-indigo text-white rounded-full p-0.5 border border-slate-900">
                                <Check className="w-2 h-2" />
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-300 font-bold">Tenant</span>
                          </div>

                          {/* Middle Secure Escrow Node */}
                          <motion.div 
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-brand-purple relative"
                          >
                            <ShieldCheck className="w-5 h-5" />
                          </motion.div>

                          {/* Right Avatar (Owner) */}
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-brand-purple flex items-center justify-center text-white relative shadow-lg">
                              <Laptop className="w-6 h-6 text-brand-purple" />
                              <div className="absolute -bottom-1 -right-1 bg-brand-purple text-white rounded-full p-0.5 border border-slate-900">
                                <Check className="w-2 h-2" />
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-300 font-bold">Owner</span>
                          </div>
                        </div>

                        {/* Match Status label */}
                        <div className="text-center font-bold text-[9px] text-slate-350">
                          Direct Rent Agreement Secured • <span className="text-brand-purple">Zero Intermediaries</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STAGE 5: LOGO & QR REVEAL */}
                  {currentStage.id === "qr-reveal" && (
                    <motion.div
                      key="stage-qr-reveal"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="w-full max-w-[420px] aspect-[1.6] bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col justify-between backdrop-blur-sm"
                    >
                      <div className="grid grid-cols-5 gap-3 h-full items-center">
                        {/* QR Code display */}
                        <div className="col-span-2 flex flex-col items-center justify-center gap-2">
                          <div className="w-24 h-24 bg-white p-2 rounded-xl shadow-lg border border-white/10 flex items-center justify-center">
                            <QrCode className="w-full h-full text-slate-950" />
                          </div>
                          <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase">Scan to download</span>
                        </div>

                        {/* Rentto Branding content */}
                        <div className="col-span-3 space-y-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-brand-indigo/10 border border-brand-indigo/25">
                              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <h4 className="text-sm font-black tracking-tight text-white leading-none">Rentto App</h4>
                          </div>
                          
                          <p className="text-[9px] text-slate-400 font-medium leading-normal">
                            Get direct landlord messaging, real-time alerts, rent contracts, and safe escrow payouts on the go.
                          </p>
                          
                          <div className="flex gap-1.5 font-bold text-[8px] uppercase tracking-wider text-slate-300">
                            <span className="bg-slate-950 px-2 py-1 rounded">✓ Android App</span>
                            <span className="bg-slate-950 px-2 py-1 rounded">✓ iOS App</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* FLOATING TEXT OVERLAYS (Sync'd with 15-second loop) */}
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-25 text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`overlay-${currentStageIdx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-base sm:text-lg font-black tracking-widest uppercase text-slate-200 px-4 py-1.5 rounded-full bg-slate-950/80 border border-white/5 backdrop-blur-md shadow-lg shadow-black/40"
                  >
                    {currentStage.overlayText}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* BOTTOM MEDIA PLAYER PANEL */}
              <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/60 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-4">
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current text-slate-950" /> : <Play className="w-4 h-4 fill-current ml-0.5 text-slate-950" />}
                </button>

                {/* Progress bar timeline */}
                <div className="flex-grow flex items-center gap-3">
                  <span className="text-[9px] font-mono text-slate-400">
                    {`00:${Math.floor((progress / 100) * 15).toString().padStart(2, '0')}`}
                  </span>
                  <div className="flex-grow h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                    <motion.div 
                      className="absolute left-0 top-0 h-full bg-brand-indigo"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">00:15</span>
                </div>

                {/* Volume, Settings, Maximize mockups */}
                <div className="flex items-center gap-3 text-slate-400 shrink-0">
                  {/* Soundwave animation (Only active when playing) */}
                  <div className="flex items-end gap-0.5 h-3">
                    {[1, 2, 3, 4].map((bar) => (
                      <motion.div
                        key={bar}
                        animate={isPlaying ? { height: [3, 10, 3] } : { height: 4 }}
                        transition={{ repeat: Infinity, duration: 0.6 + bar * 0.15, ease: "easeInOut" }}
                        className="w-0.5 bg-brand-indigo"
                      />
                    ))}
                  </div>
                  <Volume2 className="w-3.5 h-3.5" />
                  <Settings className="w-3.5 h-3.5" />
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
