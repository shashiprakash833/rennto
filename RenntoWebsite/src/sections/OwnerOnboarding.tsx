"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building, Upload, ShieldCheck, LayoutDashboard, 
  CheckCircle2, Plus, ArrowRight, Home, Image as ImageIcon,
  DollarSign, MapPin, Zap, Search, UserCheck
} from "lucide-react";

export default function AppExperience() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "register",
      title: "Property Registration",
      icon: Home,
      description: "Owners easily add property details and rich media."
    },
    {
      id: "verify",
      title: "Admin Verification",
      icon: ShieldCheck,
      description: "Our dedicated team verifies ownership and quality."
    },
    {
      id: "discover",
      title: "Tenant Discovery",
      icon: Search,
      description: "Tenants find the verified listing in their search."
    },
    {
      id: "connect",
      title: "Secure Connection",
      icon: UserCheck,
      description: "Direct connection with zero brokerage fees."
    }
  ];

  // Auto-cycle through steps for presentation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-900 transition-colors duration-300 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/5 dark:bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-600/5 dark:bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 fill-current" />
            The Complete Ecosystem
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Experience the <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Rento App</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
            From listing a property to finding a tenant, our platform ensures trust, safety, and a premium experience at every step.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Side: Step Tracker */}
          <div className="lg:col-span-5 space-y-4">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-6 rounded-3xl transition-all duration-300 relative overflow-hidden group ${
                    isActive 
                      ? "bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-500 shadow-xl dark:shadow-slate-950/50" 
                      : "bg-transparent border-2 border-transparent hover:bg-white/50 dark:hover:bg-slate-900/50 hover:border-slate-200 dark:hover:border-slate-800"
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeAppStep"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none"
                    />
                  )}
                  
                  <div className="relative flex items-center gap-5 z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                      isActive 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-black transition-colors ${
                        isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm font-medium transition-colors ${
                        isActive ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Side: Interactive Mockup Showcase */}
          <div className="lg:col-span-7 h-[500px] relative w-full perspective-1000">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Property Registration Form */}
              {activeStep === 0 && (
                <motion.div
                  key="app-step-0"
                  initial={{ opacity: 0, x: 20, rotateY: 10 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: -20, rotateY: -10 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl dark:shadow-slate-950/50 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Create Listing
                      </h3>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Draft</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property Title</label>
                        <div className="h-11 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center px-4">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Modern Co-living Space</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
                          <div className="h-11 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center px-4 gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Downtown Area</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price / mo</label>
                          <div className="h-11 w-full bg-slate-50 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center px-4 gap-2 shadow-[0_0_0_2px_rgba(79,70,229,0.1)] dark:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]">
                            <DollarSign className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">1,200</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Media</label>
                        <div className="h-20 w-full bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl flex flex-col items-center justify-center">
                           <Upload className="w-5 h-5 text-indigo-500 mb-1" />
                           <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Drag and drop images</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <div className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl shadow-lg flex items-center gap-2">
                      Submit for Verification <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Admin Verification */}
              {activeStep === 1 && (
                <motion.div
                  key="app-step-1"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl dark:shadow-slate-950/50 flex flex-col items-center justify-center text-center"
                >
                  <div className="relative mb-8">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl"
                    />
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center relative z-10 shadow-xl shadow-emerald-500/30">
                      <ShieldCheck className="w-12 h-12 text-white" />
                    </div>
                    {/* Floating checkmarks */}
                    <motion.div animate={{ y: -10, opacity: [0, 1, 0] }} transition={{ delay: 0.5, duration: 2, repeat: Infinity }} className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 rounded-full p-1 shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </motion.div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Admin Review Panel</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xs mx-auto mb-8">
                    Rento's trust team verifies the ownership documents and inspects property details to assign the "Verified" badge.
                  </p>

                  <div className="w-full max-w-sm space-y-3">
                    <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-3 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Ownership Proof</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Validated against public records</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-3 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Listing Quality</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Photos and amenities confirmed</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Tenant Discovery Preview */}
              {activeStep === 2 && (
                <motion.div
                  key="app-step-2"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-2xl dark:shadow-slate-950/50 flex flex-col"
                >
                  <div className="bg-white dark:bg-slate-950 rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
                    <div className="h-40 bg-gradient-to-tr from-indigo-500 to-purple-600 relative p-4 flex flex-col justify-between">
                      <span className="self-start px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-bold rounded-md flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Rento
                      </span>
                      <span className="self-start px-2 py-0.5 bg-black/35 backdrop-blur text-[8px] font-black text-white uppercase tracking-wider rounded z-10 mt-auto">
                        Apartment
                      </span>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wide">
                            Downtown • 0.5 km
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg">
                          Modern Co-living Space
                        </h4>
                        <p className="text-xs text-slate-450 dark:text-slate-500 font-medium mt-1">
                          Downtown Area
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-xl font-black text-slate-900 dark:text-white">$1,200</span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold lowercase">/month</span>
                        </div>
                        <div className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md">
                          View Details
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Secure Connection */}
              {activeStep === 3 && (
                <motion.div
                  key="app-step-3"
                  initial={{ opacity: 0, x: -20, rotateY: -10 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 20, rotateY: 10 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl dark:shadow-slate-950/50 flex flex-col items-center justify-center"
                >
                  <div className="flex items-center justify-between w-full max-w-[280px] mb-8">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl border-2 border-indigo-200 dark:border-indigo-800">
                        O
                      </div>
                      <span className="text-xs font-bold text-slate-500 mt-2">Owner</span>
                    </div>
                    
                    <div className="flex-1 px-4 relative flex items-center justify-center">
                       <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700 absolute"></div>
                       <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center relative z-10 text-white shadow-lg animate-pulse">
                         <UserCheck className="w-4 h-4" />
                       </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xl border-2 border-blue-200 dark:border-blue-800">
                        T
                      </div>
                      <span className="text-xs font-bold text-slate-500 mt-2">Tenant</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl w-full border border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white text-center mb-4">Direct Connection Established</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero Brokerage Fees
                      </li>
                      <li className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Secure In-App Chat
                      </li>
                      <li className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated Rent Collection
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
