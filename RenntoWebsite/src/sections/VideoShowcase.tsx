"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Eye, ShieldCheck, UserCheck, CheckCircle, Smartphone, 
  Volume2, Settings, Maximize2, Tv, Sparkles, AlertCircle
} from "lucide-react";

export default function VideoShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);

  // We can use a high-quality, beautiful cinematic architectural or real estate technology video
  const youtubeVideoId = "dQw4w9WgXcQ"; // Can be replaced by any active youtube video ID (e.g. real estate walkthrough or startup promo)

  const steps = [
    {
      id: "v1",
      title: "Property Registration",
      desc: "Owners upload ownership certificates, photos, and amenities via the secure onboarding form.",
      color: "from-brand-indigo to-brand-indigo/80"
    },
    {
      id: "v2",
      title: "Admin Verification",
      desc: "Rento auditors inspect deeds against registry data and run site reviews to grant the verified seal.",
      color: "from-brand-purple to-brand-purple/80"
    },
    {
      id: "v3",
      title: "Tenant Discovery",
      desc: "Tenants use the live map finder to secure broker-free properties with absolute document trust.",
      color: "from-brand-purple to-brand-pink"
    }
  ];

  return (
    <section id="video-experience" className="py-24 bg-slate-900 text-white relative overflow-hidden transition-colors duration-300">
      
      {/* Cinematic glowing background radial vectors */}
      <div className="absolute top-0 right-1/4 w-[50rem] h-[50rem] bg-brand-indigo/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-brand-purple/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Cyberpunk grid dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-70 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            See the Ecosystem <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Come to Life</span>
          </h2>
          <p className="text-lg text-slate-400 font-medium">
            Learn how property owners, tenants, and admin verification sync flawlessly to create a modern trust-centered rental marketplace.
          </p>
        </div>

        {/* Cinematic Workspace Content Layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT SIDE: Narrative Storytelling Grid */}
          <div className="lg:col-span-5 space-y-8 order-2 lg:order-1">
            <div className="space-y-6">
              <h3 className="text-xl font-black tracking-tight border-l-4 border-brand-indigo pl-4 uppercase">
                The Verified Rentals Ecosystem
              </h3>
              <p className="text-sm text-slate-400 font-semibold leading-relaxed">
                Rento introduces a new paradigm in real estate: an on-site authenticated, zero- brokerage network built on document transparency. Explore our step-by-step cycle.
              </p>
            </div>

            <div className="space-y-5">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${step.color} flex items-center justify-center shrink-0 text-white font-black text-xs shadow-md shadow-slate-900/50`}>
                    0{idx + 1}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white group-hover:text-brand-indigo transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: PREMIUM YT VIDEO PLAYER CONTAINER */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative w-full aspect-video rounded-[2.25rem] bg-slate-950 border border-white/10 shadow-2xl overflow-hidden group shadow-brand-indigo/5"
            >
              
              {/* YouTube Iframe Embed Mode */}
              {isPlaying ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1`}
                  title="Rento Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0 rounded-[2.25rem] relative z-25"
                />
              ) : (
                
                // HIGH FIDELITY VIDEO PREVIEW CARD COVER
                <div 
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 w-full h-full cursor-pointer flex flex-col justify-between p-6 z-20"
                >
                  {/* Decorative preview background gradients simulating high-end tech video */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/50 -z-10" />
                  
                  {/* Visual mockup background vector overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:3rem_3rem] -z-10 opacity-60" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-indigo/10 rounded-full blur-[60px] pointer-events-none -z-10" />

                  {/* Top Bar Simulated Controls */}
                  <div className="flex justify-between items-center bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Tv className="w-4 h-4 text-brand-indigo" />
                      <span>Rento Ecosystem Explainer Video</span>
                    </div>
                    <span className="text-[9px] bg-red-600 text-white font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
                      HD 1080P
                    </span>
                  </div>

                  {/* CENTER PLAY BUTTON WITH DYNAMIC RIPPLE EFFECTS */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      
                      {/* Ripple waves (Continuous expanding pulses) */}
                      <motion.div 
                        animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                        className="absolute inset-0 bg-brand-indigo rounded-full blur-xs -z-10"
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.4 }}
                        className="absolute inset-0 bg-brand-purple rounded-full blur-xs -z-10"
                      />

                      {/* Floating Play Disk */}
                      <motion.button
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-20 h-20 bg-gradient-to-tr from-brand-indigo to-brand-purple rounded-full flex items-center justify-center text-white shadow-xl shadow-brand-indigo/20 relative z-10 transition-shadow duration-300 group-hover:shadow-brand-purple/40"
                      >
                        <Play className="w-8 h-8 fill-current ml-1" />
                      </motion.button>

                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-350 bg-black/40 backdrop-blur border border-white/5 px-4 py-1.5 rounded-full">
                      Click to Play Demo
                    </span>
                  </div>

                  {/* BOTTOM BAR: SIMULATED MEDIA PLAYER PANEL + PREVIEW SOUNDWAVE */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl space-y-3">
                    
                    {/* Autoplay preview visual soundwave */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>Autoplay Teaser Spectrum</span>
                      <span className="text-[9px] text-brand-indigo font-extrabold">Active</span>
                    </div>

                    <div className="flex justify-between items-end gap-1.5 h-7 pt-1 px-2 border-b border-white/5 pb-2">
                      {[...Array(24)].map((_, i) => {
                        // Generate random heights for simulated sound waves
                        const heights = [12, 24, 16, 8, 20, 14, 28, 18, 10, 22, 16, 12, 18, 26, 14, 8, 22, 16, 10, 24, 14, 18, 12, 20];
                        return (
                          <motion.div
                            key={i}
                            animate={{ 
                              height: [heights[i] * 0.4, heights[i], heights[i] * 0.4] 
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 1.2 + (i % 5) * 0.15,
                              ease: "easeInOut",
                              delay: (i % 4) * 0.1
                            }}
                            className={`flex-1 rounded-sm bg-gradient-to-t ${
                              i < 8 ? "from-brand-indigo to-brand-indigo/60" : i < 16 ? "from-brand-indigo/60 to-brand-purple" : "from-brand-purple to-brand-pink"
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Controls row mockup */}
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-300 pt-1">
                      <div className="flex items-center gap-4">
                        <Volume2 className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-mono">00:00 / 02:45</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-400">
                        <Settings className="w-4 h-4" />
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
