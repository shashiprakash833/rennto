"use client";

import { motion } from "framer-motion";
import { CheckCircle, ShieldCheck, Mail, Home, Search, User } from "lucide-react";
import { useState } from "react";

export default function RentoAnimatedIllustration() {
  const [hoveredZone, setHoveredZone] = useState<"owner" | "hub" | "tenant" | null>(null);

  // Floating animation transitions for ambient physics
  const floatTransition = (delay: number) => ({
    y: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const,
      repeatType: "reverse" as const,
      delay: delay,
    }
  });

  const pulseTransition = {
    scale: [1, 1.1, 1],
    opacity: [0.95, 1, 0.95],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  return (
    <div 
      className="relative w-full aspect-[16/10] flex items-center justify-center overflow-visible bg-transparent transition-all duration-500 ease-out"
      style={{
        perspective: "1000px"
      }}
    >
      {/* 3D Rotatable Wrapper */}
      <motion.div 
        className="relative w-full h-full flex items-center justify-center overflow-visible bg-transparent"
        whileHover={{ 
          rotateX: 4,
          rotateY: -4,
          z: 15
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {/* Soft background ambient glow that shifts colors depending on hover */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] h-[95%] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
            hoveredZone === "owner" ? "bg-purple-600/12" :
            hoveredZone === "hub" ? "bg-indigo-600/12" :
            hoveredZone === "tenant" ? "bg-emerald-600/12" :
            "bg-brand-purple/8"
          }`} 
        />

        {/* Main SVG Scene */}
        <svg
          viewBox="0 0 850 500"
          className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] select-none overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            
            <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A5B4FC" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>

            <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.97" />
              <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.92" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <g stroke="#6366F1" strokeWidth="0.75" className="opacity-10 dark:opacity-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <path key={`grid-h-${i}`} d={`M 0,${50 + i * 50} L 850,${50 + i * 50}`} />
            ))}
            {Array.from({ length: 17 }).map((_, i) => (
              <path key={`grid-v-${i}`} d={`M ${50 + i * 50},0 L ${50 + i * 50},500`} />
            ))}
          </g>

          {/* ==================== ANIMATED CONNECTION PATHS ==================== */}
          {/* Path 1: Owner (100, 240) to Rento Hub (320, 180) */}
          <path
            id="ownerToHubPath"
            d="M 100,240 C 180,240 220,180 320,180"
            stroke="url(#purpleGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6,8"
            className="opacity-60"
          />

          {/* Glowing Streaming Particles on Path 1 */}
          <circle r="6" fill="#8B5CF6">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 100,240 C 180,240 220,180 320,180" />
            <animate attributeName="opacity" values="0.2;1;0.2" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <circle r="4" fill="#FFFFFF">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 100,240 C 180,240 220,180 320,180" />
          </circle>

          <circle r="6" fill="#8B5CF6">
            <animateMotion dur="3.5s" begin="1.75s" repeatCount="indefinite" path="M 100,240 C 180,240 220,180 320,180" />
            <animate attributeName="opacity" values="0.2;1;0.2" dur="3.5s" begin="1.75s" repeatCount="indefinite" />
          </circle>
          <circle r="4" fill="#FFFFFF">
            <animateMotion dur="3.5s" begin="1.75s" repeatCount="indefinite" path="M 100,240 C 180,240 220,180 320,180" />
          </circle>

          {/* Path 2: Rento Hub (520, 280) to Tenant (720, 270) */}
          <path
            id="hubToTenantPath"
            d="M 520,280 C 600,280 640,270 720,270"
            stroke="url(#emeraldGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6,8"
            className="opacity-60"
          />

          {/* Glowing Streaming Particles on Path 2 */}
          <circle r="6" fill="#10B981">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 520,280 C 600,280 640,270 720,270" />
            <animate attributeName="opacity" values="0.2;1;0.2" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle r="4" fill="#FFFFFF">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 520,280 C 600,280 640,270 720,270" />
          </circle>

          <circle r="6" fill="#10B981">
            <animateMotion dur="4s" begin="2s" repeatCount="indefinite" path="M 520,280 C 600,280 640,270 720,270" />
            <animate attributeName="opacity" values="0.2;1;0.2" dur="4s" begin="2s" repeatCount="indefinite" />
          </circle>
          <circle r="4" fill="#FFFFFF">
            <animateMotion dur="4s" begin="2s" repeatCount="indefinite" path="M 520,280 C 600,280 640,270 720,270" />
          </circle>

          {/* ==================== LEFT SIDE: OWNER ==================== */}
          <motion.g
            animate={{ y: [0, -7, 0] }}
            transition={floatTransition(0)}
            onMouseEnter={() => setHoveredZone("owner")}
            onMouseLeave={() => setHoveredZone(null)}
            className="cursor-pointer"
          >
            {/* Concentric Pulsing Radar Rings under Owner */}
            <motion.circle 
              cx="100" cy="240" r="50" 
              stroke="#8B5CF6" 
              strokeWidth="1.5" 
              animate={{ r: [50, 95], opacity: [0.6, 0] }} 
              transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }} 
            />
            <motion.circle 
              cx="100" cy="240" r="50" 
              stroke="#8B5CF6" 
              strokeWidth="1" 
              animate={{ r: [50, 130], opacity: [0.3, 0] }} 
              transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }} 
            />

            {/* Owner Platform base circle */}
            <motion.circle 
              cx="100" cy="240" r="50" 
              fill="white" 
              stroke={hoveredZone === "owner" ? "#8B5CF6" : "#E2E8F0"} 
              strokeWidth={hoveredZone === "owner" ? "3.5" : "2.5"}
              className="filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.05)] transition-all duration-300"
            />
            
            {/* Character representation */}
            <g transform="translate(80, 215)" className="text-brand-purple">
              <rect x="0" y="0" width="40" height="40" rx="20" fill="#F5F3FF" />
              <foreignObject x="8" y="8" width="24" height="24">
                <User className="w-6 h-6 text-brand-purple" />
              </foreignObject>
            </g>

            {/* Floating 'Property Listed' Card */}
            <motion.g 
              transform="translate(15, 120)"
              animate={hoveredZone === "owner" ? { scale: 1.06, y: -8 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <rect width="160" height="52" rx="14" fill="url(#glassGrad)" className="filter drop-shadow-[0_12px_24px_rgba(139,92,246,0.18)]" />
              <rect width="160" height="52" rx="14" stroke={hoveredZone === "owner" ? "#8B5CF6" : "#E9D5FF"} strokeWidth="1.5" />
              <foreignObject x="12" y="12" width="28" height="28">
                <div className="bg-purple-100 p-1.5 rounded-lg flex items-center justify-center">
                  <Home className="w-4.5 h-4.5 text-brand-purple" />
                </div>
              </foreignObject>
              <text x="50" y="24" fill="#0F172A" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Property Listed</text>
              <text x="50" y="38" fill="#10B981" fontSize="9.5" fontWeight="800" fontFamily="sans-serif">✓ HOST DASHBOARD</text>
            </motion.g>
          </motion.g>

          {/* ==================== CENTER: RENTO HUB (Hover reactive) ==================== */}
          <g 
            transform="translate(260, 80)"
            onMouseEnter={() => setHoveredZone("hub")}
            onMouseLeave={() => setHoveredZone(null)}
            className="cursor-pointer"
          >
            {/* Concentric Pulsing Radar Rings under Rento Hub */}
            <motion.ellipse 
              cx="160" cy="220" rx="180" ry="70" 
              stroke="#6366F1" 
              strokeWidth="2" 
              animate={{ rx: [180, 230], ry: [70, 90], opacity: [0.5, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }} 
            />
            <motion.ellipse 
              cx="160" cy="220" rx="180" ry="70" 
              stroke="#6366F1" 
              strokeWidth="1" 
              animate={{ rx: [180, 270], ry: [70, 110], opacity: [0.25, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 2 }} 
            />

            {/* Ground Platform */}
            <ellipse 
              cx="160" cy="220" rx="180" ry="70" 
              fill="white" 
              stroke={hoveredZone === "hub" ? "#6366F1" : "#E2E8F0"} 
              strokeWidth={hoveredZone === "hub" ? "3.5" : "2.5"}
              className="opacity-95 filter drop-shadow-[0_16px_36px_rgba(0,0,0,0.06)] transition-all duration-300" 
            />

            {/* 1. Apartment Building */}
            <motion.g
              animate={hoveredZone === "hub" ? { y: -12, scale: 1.03 } : { y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              transform="translate(10, 20)"
            >
              {/* Left face */}
              <path d="M 30,120 L 80,145 L 80,45 L 30,20 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
              {/* Right face */}
              <path d="M 80,145 L 130,120 L 130,20 L 80,45 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
              {/* Roof face */}
              <path d="M 30,20 L 80,45 L 130,20 L 80,-5 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
              
              {/* Balconies */}
              <path d="M 40,85 L 70,100 L 70,75 L 40,60 Z" fill="#818CF8" opacity="0.35" stroke="#4F46E5" strokeWidth="1.2" />
              <path d="M 90,100 L 120,85 L 120,60 L 90,75 Z" fill="#818CF8" opacity="0.35" stroke="#4F46E5" strokeWidth="1.2" />

              {/* Glowing Windows */}
              <motion.rect 
                x="42" y="35" width="10" height="15" rx="2" 
                fill={hoveredZone === "hub" ? "#F59E0B" : "#8B5CF6"} 
                className="transition-colors duration-300"
              />
              <motion.rect 
                x="58" y="43" width="10" height="15" rx="2" 
                fill={hoveredZone === "hub" ? "#F59E0B" : "#8B5CF6"} 
                className="transition-colors duration-300"
              />
              <motion.rect 
                x="92" y="43" width="10" height="15" rx="2" 
                fill={hoveredZone === "hub" ? "#F59E0B" : "#6366F1"} 
                className="transition-colors duration-300"
              />
              <motion.rect 
                x="108" y="35" width="10" height="15" rx="2" 
                fill={hoveredZone === "hub" ? "#F59E0B" : "#6366F1"} 
                className="transition-colors duration-300"
              />

              <text x="45" y="165" fill="#1E293B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Apartment</text>
            </motion.g>

            {/* 2. Premium Commercial Office Tower */}
            <motion.g
              animate={hoveredZone === "hub" ? { y: -45, scale: 1.04 } : { y: -30 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <path d="M 135,130 L 185,155 L 185,20 L 135,-5 Z" fill="#EEF2F6" stroke="#94A3B8" strokeWidth="1.5" />
              <path d="M 185,155 L 235,130 L 235,-5 L 185,20 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
              <path d="M 135,-5 L 185,20 L 235,-5 L 185,-30 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
              
              {/* Glass panel rows */}
              <motion.rect x="147" y="15" width="12" height="40" fill={hoveredZone === "hub" ? "#60A5FA" : "#3B82F6"} opacity="0.65" rx="1" />
              <motion.rect x="163" y="23" width="12" height="40" fill={hoveredZone === "hub" ? "#60A5FA" : "#3B82F6"} opacity="0.65" rx="1" />
              <motion.rect x="195" y="23" width="12" height="40" fill={hoveredZone === "hub" ? "#93C5FD" : "#60A5FA"} opacity="0.75" rx="1" />
              <motion.rect x="211" y="15" width="12" height="40" fill={hoveredZone === "hub" ? "#93C5FD" : "#60A5FA"} opacity="0.75" rx="1" />

              <motion.rect x="147" y="65" width="12" height="40" fill={hoveredZone === "hub" ? "#60A5FA" : "#3B82F6"} opacity="0.65" rx="1" />
              <motion.rect x="163" y="73" width="12" height="40" fill={hoveredZone === "hub" ? "#60A5FA" : "#3B82F6"} opacity="0.65" rx="1" />
              <motion.rect x="195" y="73" width="12" height="40" fill={hoveredZone === "hub" ? "#93C5FD" : "#60A5FA"} opacity="0.75" rx="1" />
              <motion.rect x="211" y="65" width="12" height="40" fill={hoveredZone === "hub" ? "#93C5FD" : "#60A5FA"} opacity="0.75" rx="1" />

              <text x="142" y="172" fill="#1E293B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Commercial</text>
            </motion.g>

            {/* 3. Hostel Building */}
            <motion.g
              animate={hoveredZone === "hub" ? { y: 18, scale: 1.03 } : { y: 50 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              transform="translate(200, 50)"
            >
              <path d="M 20,90 L 60,110 L 60,40 L 20,20 Z" fill="#FAF5FF" stroke="#D8B4FE" strokeWidth="1.5" />
              <path d="M 60,110 L 100,90 L 100,20 L 60,40 Z" fill="#F3E8FF" stroke="#D8B4FE" strokeWidth="1.5" />
              <path d="M 20,20 L 60,40 L 100,20 L 60,0 Z" fill="#FAF5FF" stroke="#D8B4FE" strokeWidth="1.5" />

              <path d="M 20,20 L 60,5 L 100,20 Z" fill="#C084FC" opacity="0.35" stroke="#A855F7" strokeWidth="1.5" />

              {/* Entry archway */}
              <path d="M 32,70 A 12,12 0 0 1 56,70 L 56,108 L 32,96 Z" fill="#7C3AED" />
              <rect x="70" y="45" width="12" height="20" rx="3" fill="#FFE4E6" opacity="0.95" />

              <text x="42" y="125" fill="#1E293B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Hostel</text>
            </motion.g>

            {/* Verified Badges */}
            <motion.g
              animate={pulseTransition}
              transform="translate(60, 30)"
            >
              <circle cx="14" cy="14" r="13" fill="#10B981" className="filter drop-shadow-[0_4px_12_rgba(16,185,129,0.4)]" />
              <foreignObject x="5.5" y="5.5" width="17" height="17">
                <CheckCircle className="w-4 h-4 text-white" />
              </foreignObject>
            </motion.g>
            
            <motion.g
              animate={pulseTransition}
              transform="translate(240, 55)"
            >
              <circle cx="14" cy="14" r="13" fill="#10B981" className="filter drop-shadow-[0_4px_12_rgba(16,185,129,0.4)]" />
              <foreignObject x="5.5" y="5.5" width="17" height="17">
                <CheckCircle className="w-4 h-4 text-white" />
              </foreignObject>
            </motion.g>
          </g>

          {/* ==================== RIGHT SIDE: TENANT ==================== */}
          <motion.g
            animate={{ y: [0, -7, 0] }}
            transition={floatTransition(0.15)}
            onMouseEnter={() => setHoveredZone("tenant")}
            onMouseLeave={() => setHoveredZone(null)}
            className="cursor-pointer"
          >
            {/* Concentric Pulsing Radar Rings under Tenant */}
            <motion.circle 
              cx="720" cy="270" r="50" 
              stroke="#10B981" 
              strokeWidth="1.5" 
              animate={{ r: [50, 95], opacity: [0.6, 0] }} 
              transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }} 
            />
            <motion.circle 
              cx="720" cy="270" r="50" 
              stroke="#10B981" 
              strokeWidth="1" 
              animate={{ r: [50, 130], opacity: [0.3, 0] }} 
              transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }} 
            />

            {/* Tenant Base Platform */}
            <motion.circle 
              cx="720" cy="270" r="50" 
              fill="white" 
              stroke={hoveredZone === "tenant" ? "#10B981" : "#E2E8F0"} 
              strokeWidth={hoveredZone === "tenant" ? "3.5" : "2.5"}
              className="filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.05)] transition-all duration-300"
            />

            {/* Tenant Icon */}
            <g transform="translate(700, 245)" className="text-brand-indigo">
              <rect x="0" y="0" width="40" height="40" rx="20" fill="#EEF2F6" />
              <foreignObject x="8" y="8" width="24" height="24">
                <Search className="w-6 h-6 text-brand-indigo" />
              </foreignObject>
            </g>

            {/* Floating 'Successful Match' Card */}
            <motion.g 
              transform="translate(630, 130)"
              animate={hoveredZone === "tenant" ? { scale: 1.06, y: -8 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <rect width="180" height="54" rx="14" fill="url(#glassGrad)" className="filter drop-shadow-[0_12px_24px_rgba(16,185,129,0.18)]" />
              <rect width="180" height="54" rx="14" stroke={hoveredZone === "tenant" ? "#10B981" : "#A7F3D0"} strokeWidth="1.5" />
              <foreignObject x="12" y="13" width="28" height="28">
                <div className="bg-emerald-100 p-1.5 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </foreignObject>
              <text x="48" y="24" fill="#0F172A" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Successful Match</text>
              <text x="48" y="38" fill="#10B981" fontSize="9.5" fontWeight="800" fontFamily="sans-serif">DIRECT TO TENANT</text>
            </motion.g>

            {/* Moving Tenant Inquiry Card */}
            <motion.g
              animate={{ x: [-15, 15, -15] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              transform="translate(610, 350)"
            >
              <rect width="160" height="46" rx="12" fill="white" className="filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]" />
              <rect width="160" height="46" rx="12" stroke="#E2E8F0" strokeWidth="1.5" className="dark:stroke-slate-800" />
              <foreignObject x="12" y="11" width="24" height="24">
                <div className="bg-indigo-50 p-1 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-brand-indigo" />
                </div>
              </foreignObject>
              <text x="44" y="22" fill="#0F172A" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">Tenant Inquiry</text>
              <text x="44" y="34" fill="#475569" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">"I'd like to book a visit"</text>
            </motion.g>
          </motion.g>

          {/* Dynamic labels on Grid Floor */}
          <text x="45" y="320" fill="#475569" fontSize="13" fontWeight="800" letterSpacing="1.5" fontFamily="sans-serif" className="opacity-80">PROPERTY OWNER</text>
          <text x="360" y="405" fill="#475569" fontSize="14" fontWeight="800" letterSpacing="2" fontFamily="sans-serif" className="opacity-80">RENTO HUB</text>
          <text x="685" y="345" fill="#475569" fontSize="13" fontWeight="800" letterSpacing="1.5" fontFamily="sans-serif" className="opacity-80">TENANT FINDER</text>
        </svg>
      </motion.div>
    </div>
  );
}
