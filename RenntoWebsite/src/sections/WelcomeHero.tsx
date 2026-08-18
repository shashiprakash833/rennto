import { motion } from "framer-motion";
import { ArrowRight, Shield, Users, CheckCircle2, Lock, Sparkles, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";


interface CounterProps {
  value: number;
  suffix: string;
  label: string;
}

function StatCounter({ value, suffix, label }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalDuration = 2000; // 2 seconds
    const startTime = performance.now();
    let animationFrameId: number;

    const updateCount = (now: number) => {
      const progress = Math.min((now - startTime) / totalDuration, 1);
      setDisplayValue(Math.floor(progress * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  return (
    <div className="text-left">
      <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight block">
        <span>{displayValue.toLocaleString()}</span>
        <span className="text-brand-indigo">{suffix}</span>
      </span>
      <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wider block mt-0.5">
        {label}
      </span>
    </div>
  );
}

export default function WelcomeHero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };
  return (
    <section className="relative overflow-hidden pt-28 pb-12 lg:pt-32 lg:pb-20 lg:min-h-screen flex flex-col justify-start lg:flex-row lg:items-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Soft Mesh Gradients & Subtle Purple Ambient Shapes */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-70 dark:opacity-20" />
      <div className="absolute top-1/2 right-1/10 -translate-y-1/2 w-[48rem] h-[48rem] bg-gradient-to-tr from-brand-indigo/8 via-brand-purple/12 to-brand-pink/4 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/12 w-[32rem] h-[32rem] bg-brand-indigo/6 rounded-full blur-[130px] -z-10 pointer-events-none" />

      {/* Dynamic Floating Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
        {[
          { size: "w-2.5 h-2.5", left: "8%", top: "22%", delay: 0 },
          { size: "w-3.5 h-3.5", left: "85%", top: "18%", delay: 1.5 },
          { size: "w-2 h-2", left: "18%", top: "75%", delay: 3 },
          { size: "w-3 h-3", left: "78%", top: "72%", delay: 0.5 },
          { size: "w-2.5 h-2.5", left: "48%", top: "12%", delay: 2 },
          { size: "w-3.5 h-3.5", left: "90%", top: "55%", delay: 4 },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            className={`absolute ${item.size} rounded-full bg-brand-purple/20 dark:bg-brand-indigo/35 blur-[1.5px]`}
            style={{ left: item.left, top: item.top }}
            animate={{
              y: [0, -35, 0],
              x: [0, 15, 0],
              opacity: [0.25, 0.75, 0.25],
            }}
            transition={{
              duration: 8 + idx * 2.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Headline & SaaS messaging */}
          <div className="col-span-1 lg:col-span-5 space-y-8 text-center lg:text-left z-10">
            
            {/* Premium Headline */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]"
              >
                Find <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent drop-shadow-xs">Verified Rentals</span>. <br />
                List Properties with <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent drop-shadow-xs">Confidence</span>.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xs sm:text-sm text-slate-600 dark:text-slate-455 font-semibold max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Rennto connects property owners and tenants directly. Discover student PGs, luxury hostels, and premium apartments with zero brokerage, background verification, and secure escrows.
              </motion.p>
            </div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-row items-center justify-center lg:justify-start gap-4 mt-8 w-full"
            >
              <a
                href="#verified-rentals"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink text-white px-5 sm:px-10 py-4 rounded-2xl font-black shadow-lg shadow-brand-indigo/15 hover:shadow-brand-pink/30 hover:scale-105 active:scale-98 transition-all duration-300 text-xs sm:text-sm text-center cursor-pointer"
              >
                Find Rentals
              </a>
              <a
                href="#download-app"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-5 sm:px-8 py-4 rounded-2xl font-black hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-98 transition-all duration-300 text-xs sm:text-sm text-center cursor-pointer"
              >
                List Property
                <ArrowRight className="w-4 h-4 text-brand-purple" />
              </a>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Character and Buildings Illustrations side by side with advanced orbit animations */}
          <div 
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              setMousePosition({ x: 0, y: 0 });
            }}
            className="col-span-1 lg:col-span-7 flex flex-row justify-between items-center gap-6 sm:gap-8 relative py-8 z-10 w-full max-w-[640px] aspect-[1.6] mx-auto lg:scale-105 xl:scale-110 lg:origin-right lg:translate-y-10 select-none"
          >
            {/* Circular Orbit SVG Background with Parallax displacement */}
            <motion.svg 
              animate={{ 
                x: mousePosition.x * 20, 
                y: mousePosition.y * 20 
              }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible opacity-75 z-0" 
              viewBox="0 0 600 375"
            >
              <defs>
                <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#6C4DFF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0.3" />
                </linearGradient>
                
                {/* Glow Filter for SVG Elements */}
                <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Concentric rotating outer dashed orbit */}
              <motion.circle 
                cx="300" cy="187" r="155" 
                fill="none" stroke="url(#orbit-grad)" strokeWidth="1.5" strokeDasharray="6,8"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
                className="origin-[300px_187px]"
              />
              
              {/* Concentric rotating inner dashed orbit */}
              <motion.circle 
                cx="300" cy="187" r="95" 
                fill="none" stroke="url(#orbit-grad)" strokeWidth="1" strokeDasharray="4,6"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
                className="origin-[300px_187px]"
              />
              
              {/* Connection bezier bridge paths */}
              <path id="top-bridge" d="M 150,187 Q 300,67 450,187" fill="none" stroke="url(#orbit-grad)" strokeWidth="1.5" strokeDasharray="4,4" className="opacity-45" />
              <path id="bottom-bridge" d="M 450,187 Q 300,307 150,187" fill="none" stroke="url(#orbit-grad)" strokeWidth="1.5" strokeDasharray="4,4" className="opacity-45" />
              
              {/* Glowing animated particles flowing from character to building and back */}
              <motion.circle r="4" fill="#6C4DFF" filter="url(#neon-glow)" className="shadow-[0_0_10px_#6C4DFF]">
                <animateMotion dur="5.5s" repeatCount="indefinite" path="M 150,187 Q 300,67 450,187" />
              </motion.circle>
              <motion.circle r="4" fill="#EC4899" filter="url(#neon-glow)" className="shadow-[0_0_10px_#EC4899]">
                <animateMotion dur="7s" repeatCount="indefinite" path="M 450,187 Q 300,307 150,187" />
              </motion.circle>
            </motion.svg>

            {/* Premium Floating Widget 1 (Near Character) */}
            <motion.div
              animate={{ 
                x: mousePosition.x * -25,
                y: mousePosition.y * -25
              }}
              transition={{ 
                x: { type: "spring", stiffness: 80, damping: 15 },
                y: { type: "spring", stiffness: 80, damping: 15 }
              }}
              className="absolute top-[5%] left-[2%] z-20 pointer-events-none"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="flex items-center gap-3 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/40 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-xl"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div className="text-left leading-none">
                  <p className="text-[10px] font-black text-slate-850 dark:text-white uppercase tracking-wider">Verified Host</p>
                  <p className="text-[8.5px] text-slate-500 font-bold mt-1">Rahul S. • KYC Checked</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Premium Floating Widget 2 (Near Buildings) */}
            <motion.div
              animate={{ 
                x: mousePosition.x * -25,
                y: mousePosition.y * -25
              }}
              transition={{ 
                x: { type: "spring", stiffness: 80, damping: 15 },
                y: { type: "spring", stiffness: 80, damping: 15 }
              }}
              className="absolute bottom-[5%] right-[2%] z-20 pointer-events-none"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
                className="flex items-center gap-3 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/40 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-xl"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center font-bold text-xs">
                  ★
                </div>
                <div className="text-left leading-none">
                  <p className="text-[10px] font-black text-slate-850 dark:text-white uppercase tracking-wider">Hostels & Flats</p>
                  <p className="text-[8.5px] text-slate-500 font-bold mt-1">0% Brokerage • 5.0 Rating</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Premium Floating Widget 3 (Middle Bottom) */}
            <motion.div
              animate={{ 
                x: mousePosition.x * -20,
                y: mousePosition.y * -20
              }}
              transition={{ 
                x: { type: "spring", stiffness: 80, damping: 15 },
                y: { type: "spring", stiffness: 80, damping: 15 }
              }}
              className="absolute bottom-[2%] left-[30%] z-20 pointer-events-none"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.8 }}
                className="flex items-center gap-2.5 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/40 dark:border-slate-800/80 px-3 py-2 rounded-xl shadow-lg"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-pink/10 text-brand-pink flex items-center justify-center font-bold text-xs">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-none">
                  <p className="text-[9px] font-black text-slate-850 dark:text-white uppercase tracking-wider">Escrow Safety</p>
                  <p className="text-[7.5px] text-slate-500 font-semibold mt-0.5">Secure Deposit Hold</p>
                </div>
              </motion.div>
            </motion.div>

            {/* 1. Character Illustration (Increased max-width by 25%) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                rotateX: isHovered ? mousePosition.y * -25 : 0,
                rotateY: isHovered ? mousePosition.x * 25 : 0
              }}
              transition={{ 
                duration: 0.8, 
                delay: 0.2,
                rotateX: { type: "spring", stiffness: 120, damping: 14 },
                rotateY: { type: "spring", stiffness: 120, damping: 14 }
              }}
              className="relative flex-1 max-w-[270px] sm:max-w-[310px] aspect-square flex items-center justify-center z-10"
              style={{ perspective: 1000 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -12, 0],
                  rotateZ: [0, -1, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 6,
                  ease: "easeInOut",
                }}
                whileHover={{ scale: 1.08 }}
                className="relative w-full h-full flex items-center justify-center cursor-pointer"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute w-52 h-52 rounded-full bg-brand-purple/10 dark:bg-brand-purple/15 blur-3xl pointer-events-none -z-10 animate-pulse" />
                <img
                  src="/hero_backpack_purple.png"
                  alt="Rennto Character"
                  className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_20px_45px_rgba(108,77,255,0.25)]"
                />
              </motion.div>
            </motion.div>

            {/* 2. Buildings Illustration (Increased max-width by 25%) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                rotateX: isHovered ? mousePosition.y * -25 : 0,
                rotateY: isHovered ? mousePosition.x * 25 : 0
              }}
              transition={{ 
                duration: 0.8, 
                delay: 0.35,
                rotateX: { type: "spring", stiffness: 120, damping: 14 },
                rotateY: { type: "spring", stiffness: 120, damping: 14 }
              }}
              className="relative flex-1 max-w-[270px] sm:max-w-[310px] aspect-square flex items-center justify-center z-10"
              style={{ perspective: 1000 }}
            >
              <motion.div
                animate={{ 
                  y: [0, 12, 0],
                  rotateZ: [0, 1, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 6,
                  ease: "easeInOut",
                  delay: 0.3
                }}
                whileHover={{ scale: 1.08 }}
                className="relative w-full h-full flex items-center justify-center cursor-pointer"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute w-52 h-52 rounded-full bg-brand-indigo/10 dark:bg-brand-indigo/15 blur-3xl pointer-events-none -z-10 animate-pulse" />
                <img
                  src="/hero_buildings.png"
                  alt="Rennto Building Types"
                  className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_20px_45px_rgba(79,70,229,0.25)]"
                />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
