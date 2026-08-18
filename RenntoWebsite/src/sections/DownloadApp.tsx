"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, QrCode } from "lucide-react";

export default function DownloadApp() {
  const [highlightActive, setHighlightActive] = useState(false);

  useEffect(() => {
    const handleHighlightEvent = () => {
      setHighlightActive(true);
      const timer = setTimeout(() => setHighlightActive(false), 2500);
      return () => clearTimeout(timer);
    };

    window.addEventListener("rento-highlight-qr", handleHighlightEvent);
    return () => window.removeEventListener("rento-highlight-qr", handleHighlightEvent);
  }, []);

  return (
    <section id="download-app" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-brand-indigo/10 rounded-full blur-[140px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Simplified Container Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-12 gap-12 items-center bg-slate-950/60 border border-slate-800 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl"
        >
          {/* Left Panel */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black text-white">Rennto</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Get the <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Rennto App</span> now!
            </h2>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              For verified rentals, direct landlord chats, and secure escrow contracts curated specially for you.
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-800/80 max-w-md mx-auto lg:mx-0">
              <div>
                <span className="text-lg sm:text-xl font-black text-white block">4.8 ★</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">App Rating</span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-white block">150k+</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Renters</span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-white block">0%</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Broker Fees</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Clean QR block and simple device representation */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-8">
            
            {/* Simple QR Card */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex flex-col items-center text-center w-full max-w-[240px] shadow-lg relative">
              <div className="w-36 h-36 bg-white p-3 rounded-2xl flex items-center justify-center shadow-md">
                <QrCode className="w-full h-full text-slate-950" />
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs font-black text-white">Scan to download</p>
                <p className="text-[10px] text-slate-500 font-bold leading-normal">
                  Point camera to grab Android &amp; iOS client
                </p>
              </div>
            </div>

            {/* Simple Device Mockup */}
            <div className="relative w-64 h-[440px] bg-slate-900 rounded-[2.2rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden hidden sm:block shrink-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-b-xl z-20" />
              <div className="absolute inset-0 bg-slate-950 p-5 pt-8 flex flex-col justify-between text-slate-400">
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                    <span>Rennto App</span>
                    <span>94%</span>
                  </div>
                  <h4 className="text-sm font-black text-white">Explore Rentals</h4>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[9px] text-slate-500">
                    Search houses, hostels...
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex justify-between items-center text-[9px]">
                    <div>
                      <p className="font-bold text-white leading-none">Viman Suite</p>
                      <p className="text-[7.5px] text-slate-500 mt-1">PG / Co-Living</p>
                    </div>
                    <span className="text-[8px] bg-brand-indigo/10 border border-brand-indigo/25 px-2 py-0.5 rounded text-brand-indigo font-black">
                      Verified
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-900 pt-2 flex justify-between text-[8px] font-bold text-slate-655">
                  <span className="text-brand-indigo">🏠 Explore</span>
                  <span>💬 Chat</span>
                  <span>🔒 Escrow</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
