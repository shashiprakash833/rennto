"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, ShieldCheck, Award, Building, Check, ArrowRight,
  MapPin, DollarSign, Image as ImageIcon, SlidersHorizontal,
  Bell, Eye, MessageSquare, AlertCircle, ShieldAlert,
  Phone, Mail, ArrowUpRight, Search, Star, Heart, CheckCircle2, User, PhoneCall
} from "lucide-react";

interface StepConfig {
  id: number;
  title: string;
  description: string;
  badge: string;
}

export default function Workflow() {
  const [userType, setUserType] = useState<"owner" | "tenant">("owner");
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const ownerSteps: StepConfig[] = [
    { id: 1, title: "Register Property", description: "Add property details, upload photos, and set rent and amenities.", badge: "REGISTER" },
    { id: 2, title: "Verification Review", description: "Document verification, property inspection, and admin approval.", badge: "VERIFY" },
    { id: 3, title: "Earn Verified Badge", description: "Trust badge awarded, fraud protection enabled, verified listing status.", badge: "BADGE" },
    { id: 4, title: "Go Live", description: "Listing published, receive tenant inquiries, and start renting.", badge: "LIVE" }
  ];

  const tenantSteps: StepConfig[] = [
    { id: 1, title: "Create Account", description: "Register using mobile number or email.", badge: "ACCOUNT" },
    { id: 2, title: "Discover Homes", description: "Browse verified houses, hostels and commercial spaces.", badge: "DISCOVER" },
    { id: 3, title: "View Details", description: "Check photos, rent, amenities and location.", badge: "DETAILS" },
    { id: 4, title: "Connect Owner", description: "Call, chat or schedule a visit with the owner.", badge: "CONNECT" },
    { id: 5, title: "Move In", description: "Finalize rental and move into the property.", badge: "MOVE IN" }
  ];

  const steps = userType === "owner" ? ownerSteps : tenantSteps;

  // Autoplay loop timer (3 seconds per step)
  useEffect(() => {
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    
    if (!isAutoplay) return;

    autoplayTimerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500); // 4.5s gives ample time for mock screens to run their timeline animations

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isAutoplay, steps.length, userType]);

  // Handle user manual interaction: Pause autoplay, schedule resume after 10s
  const handleUserSelect = (idx: number) => {
    setIsAutoplay(false);
    setActiveStep(idx);

    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    
    resumeTimerRef.current = setTimeout(() => {
      setIsAutoplay(true);
    }, 10000); // Resume after 10s of inactivity
  };

  const handleStepClick = (idx: number) => {
    handleUserSelect(idx);
    stepRefs.current[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // Reset active step when flow changes
  useEffect(() => {
    setActiveStep(0);
    setIsAutoplay(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, [userType]);

  return (
    <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 relative overflow-hidden transition-colors duration-300">
      
      {/* Background visual indicators */}
      <div className="absolute top-1/2 left-1/4 w-[35rem] h-[35rem] bg-brand-purple/5 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-[25rem] h-[25rem] bg-brand-pink/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            How <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Rentto Works</span>
          </h2>
          <p className="text-base text-slate-550 dark:text-slate-400 font-medium">
            Learn how property owners and tenants connect through Rentto's secure rental marketplace.
          </p>
        </div>

        {/* Tab Selector Switch (Flow Toggle) */}
        <div className="flex justify-center mb-16">
          <div className="relative p-1 bg-slate-200/60 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl flex gap-1 shadow-inner backdrop-blur-sm">
            <button
              onClick={() => setUserType("owner")}
              className={`relative px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-colors duration-300 cursor-pointer ${
                userType === "owner"
                  ? "text-brand-purple dark:text-white"
                  : "text-slate-550 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-350"
              }`}
            >
              {userType === "owner" && (
                <motion.div
                  layoutId="activeWorkflowToggle"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/10 dark:border-slate-700/30"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">Property Owner</span>
            </button>
            
            <button
              onClick={() => setUserType("tenant")}
              className={`relative px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-colors duration-300 cursor-pointer ${
                userType === "tenant"
                  ? "text-brand-purple dark:text-white"
                  : "text-slate-550 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-350"
              }`}
            >
              {userType === "tenant" && (
                <motion.div
                  layoutId="activeWorkflowToggle"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/10 dark:border-slate-700/30"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">Tenant</span>
            </button>
          </div>
        </div>

        {/* Dynamic Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start relative">
          
          {/* LEFT COLUMN: Scrollable Steps Timeline */}
          <div className="lg:col-span-5 relative">
            
            {/* Absolute Progress Connecting Path */}
            <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-slate-200 dark:bg-slate-800 -z-10">
              <motion.div
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-brand-indigo via-brand-purple to-brand-pink origin-top"
                animate={{
                  height: `${(activeStep / (steps.length - 1)) * 100}%`
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ height: "0%" }}
              />
            </div>

            <div className="space-y-8 py-4">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                const isCompleted = idx < activeStep;
                
                return (
                  <div
                    key={`${userType}-${step.id}`}
                    ref={(el) => { stepRefs.current[idx] = el; }}
                    className="scroll-mt-32"
                  >
                    <button
                      onClick={() => handleStepClick(idx)}
                      className={`w-full text-left p-5 rounded-3xl transition-all duration-300 relative overflow-hidden group border-2 flex gap-4.5 items-start ${
                        isActive 
                          ? "bg-white dark:bg-slate-900 border-brand-purple/35 shadow-xl shadow-brand-purple/10 scale-[1.02]" 
                          : "bg-transparent border-transparent hover:bg-white/40 dark:hover:bg-slate-900/40 opacity-70"
                      }`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="activeTimelineGlow"
                          className="absolute inset-0 bg-gradient-to-r from-brand-purple/5 to-transparent pointer-events-none"
                        />
                      )}
                      
                      {/* Step Circle Indicator */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 border relative z-10 ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                          : isActive
                            ? "bg-gradient-to-tr from-brand-indigo to-brand-purple border-brand-purple text-white shadow-lg shadow-brand-purple/20 scale-105"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                      }`}>
                        <AnimatePresence mode="wait">
                          {isCompleted ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Check className="w-4.5 h-4.5 stroke-[3]" />
                            </motion.div>
                          ) : (
                            <motion.span
                              key="num"
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="text-xs font-black"
                            >
                              {idx + 1}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Content block */}
                      <div className="space-y-0.5 pr-2">
                        <span className={`text-[8px] font-black tracking-wider uppercase ${
                          isActive ? "text-brand-purple" : "text-slate-450 dark:text-slate-500"
                        }`}>
                          {step.badge}
                        </span>
                        <h3 className={`text-sm font-black transition-colors ${
                          isActive ? "text-slate-900 dark:text-white" : "text-slate-550 dark:text-slate-400 group-hover:text-slate-755"
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-[11.5px] font-semibold leading-relaxed transition-colors ${
                          isActive ? "text-slate-600 dark:text-slate-350" : "text-slate-450 dark:text-slate-500"
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Smartphone Mockup */}
          <div className="lg:col-span-7 lg:sticky lg:top-28 flex justify-center w-full z-20 pb-10">
            
            {/* Glow Backing */}
            <div className="absolute w-[24rem] h-[36rem] bg-brand-purple/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

            {/* Premium Phone Frame */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="w-full max-w-[270px] h-[486px] lg:max-w-[325px] lg:h-[585px] bg-slate-950 rounded-[2.25rem] lg:rounded-[3.25rem] p-2 lg:p-3 border-4 border-slate-900 shadow-2xl relative select-none flex flex-col justify-between"
            >
              {/* Sheen reflection */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/5 to-white/0 rounded-[2.25rem] lg:rounded-[3.25rem] pointer-events-none z-45" />

              {/* Speaker Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-b-xl z-50 flex items-center justify-center p-0.5">
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
                <div className="w-2.5 h-2.5 bg-slate-900 border border-slate-800 rounded-full ml-3" />
              </div>

              {/* Status Bar */}
              <div className="flex justify-between items-center px-6 pt-2 pb-1.5 text-[9px] font-bold text-slate-400 z-35 bg-slate-950 rounded-t-[1.95rem] lg:rounded-t-[2.75rem]">
                <span>12:30</span>
                <div className="flex items-center gap-1">
                  <span>📶</span>
                  <span>🔋 99%</span>
                </div>
              </div>

              {/* Autoplay timeline indicator at top of phone */}
              <div className="absolute top-[2.1rem] lg:top-[2.3rem] left-5 right-5 h-0.5 bg-white/10 z-40 rounded-full overflow-hidden">
                <motion.div
                  key={`${userType}-${activeStep}-${isAutoplay}`}
                  className="h-full bg-brand-indigo origin-left"
                  initial={{ scaleX: 0 }}
                  animate={isAutoplay ? { scaleX: 1 } : { scaleX: 1 }}
                  transition={isAutoplay ? { duration: 4.5, ease: "linear" } : { duration: 0 }}
                />
              </div>

              {/* DYNAMIC APPS CONTAINER */}
              <div className="flex-grow bg-slate-50 dark:bg-slate-900 overflow-hidden relative rounded-xl lg:rounded-2xl flex flex-col justify-between p-0 shadow-inner">
                <AnimatePresence mode="wait">
                  {(() => {
                    const ownerScreens: Record<number, React.ComponentType<any>> = {
                      1: OwnerRegisterDemo,
                      2: OwnerVerifyDemo,
                      3: OwnerBadgeDemo,
                      4: OwnerLiveDemo,
                    };
                    const tenantScreens: Record<number, React.ComponentType<any>> = {
                      1: TenantAccountDemo,
                      2: TenantDiscoverDemo,
                      3: TenantDetailsDemo,
                      4: TenantConnectDemo,
                      5: TenantMoveInDemo,
                    };

                    const screenMap = userType === "owner" ? ownerScreens : tenantScreens;
                    const stepId = steps[activeStep]?.id;
                    const ActiveScreen = screenMap[stepId];

                    if (!ActiveScreen) {
                      return <DefaultPreview key="fallback-screen" />;
                    }

                    const screenKey = `${userType}-${stepId}`;
                    return <ActiveScreen key={screenKey} />;
                  })()}
                </AnimatePresence>
              </div>

              {/* Home indicator bar */}
              <div className="w-24 h-1 bg-slate-850 rounded-full mx-auto my-1.5 shrink-0" />

            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}

/* =========================================================================
   OWNER SUB-DEMO COMPONENTS (State Timelines)
   ========================================================================= */

function OwnerRegisterDemo() {
  const [typedName, setTypedName] = useState("");
  const [typedLocation, setTypedLocation] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);

  useEffect(() => {
    // Simulated typing timeline
    let t1 = setTimeout(() => {
      let text = "Anila Co-Living PG";
      let i = 0;
      let interval = setInterval(() => {
        setTypedName(text.substring(0, i));
        i++;
        if (i > text.length) clearInterval(interval);
      }, 70);
    }, 300);

    let t2 = setTimeout(() => {
      let text = "Koramangala, Bangalore";
      let i = 0;
      let interval = setInterval(() => {
        setTypedLocation(text.substring(0, i));
        i++;
        if (i > text.length) clearInterval(interval);
      }, 50);
    }, 1800);

    // Photo upload simulation
    let t3 = setTimeout(() => {
      let interval = setInterval(() => {
        setUploadPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 60);
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full p-3.5 space-y-3 flex flex-col bg-[#f8fafc] text-slate-800"
    >
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <span className="text-[9px] font-black text-brand-purple">Owner Onboarding 1/4</span>
        <span className="text-[7.5px] bg-slate-200 px-2 py-0.5 rounded-full font-bold">Draft</span>
      </div>

      <div className="space-y-2.5 flex-grow">
        <div className="space-y-0.5">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wide font-mono">Property Name</label>
          <div className="bg-white border border-slate-100 rounded-lg p-2 text-[10px] font-black text-slate-700 min-h-[28px] flex items-center">
            {typedName}
          </div>
        </div>

        <div className="space-y-0.5">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wide font-mono">Location</label>
          <div className="bg-white border border-slate-100 rounded-lg p-2 text-[10px] font-black text-slate-750 flex items-center gap-1.5 min-h-[28px]">
            <MapPin className="w-3.5 h-3.5 text-brand-purple shrink-0" />
            <span>{typedLocation}</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex justify-between">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wide font-mono">Rent Amount</label>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
              className="text-[9px] font-black text-brand-indigo"
            >
              $750/mo
            </motion.span>
          </div>
          <div className="relative h-1 bg-slate-200 rounded-full mt-1.5">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "60%" }}
              transition={{ delay: 2.2, duration: 0.6 }}
              className="absolute top-0 left-0 h-full bg-brand-indigo rounded-full" 
            />
            <motion.div 
              initial={{ left: "0%" }}
              animate={{ left: "60%" }}
              transition={{ delay: 2.2, duration: 0.6 }}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-brand-indigo shadow-md" 
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wide font-mono">Photos (3/4)</label>
          <div className="grid grid-cols-4 gap-1.5">
            <div className="h-9 bg-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="h-9 bg-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            
            {/* Upload percent simulator */}
            <div className="h-9 bg-brand-purple/5 border border-dashed border-brand-purple/35 rounded-lg flex flex-col items-center justify-center text-[5.5px] font-bold text-brand-purple">
              {uploadPercent < 100 ? (
                <>
                  <span className="w-2.5 h-2.5 border border-brand-purple border-t-transparent rounded-full animate-spin mb-0.5" />
                  <span>{uploadPercent}%</span>
                </>
              ) : (
                <Check className="w-4 h-4 text-emerald-500" />
              )}
            </div>

            <div className="h-9 bg-slate-100 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
              +
            </div>
          </div>
        </div>
      </div>

      <motion.button 
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-full py-2.5 bg-gradient-to-tr from-brand-indigo to-brand-purple text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1"
      >
        Submit for Audit <ArrowRight className="w-3 h-3" />
      </motion.button>
    </motion.div>
  );
}

function OwnerVerifyDemo() {
  const [checkedCount, setCheckedCount] = useState(0);
  const [verifyPercent, setVerifyPercent] = useState(0);

  useEffect(() => {
    // Increment percent check sequentially
    let intPercent = setInterval(() => {
      setVerifyPercent((prev) => {
        if (prev >= 100) {
          clearInterval(intPercent);
          return 100;
        }
        return prev + 4;
      });
    }, 120);

    // Turn checklist items green
    let t1 = setTimeout(() => setCheckedCount(1), 500);
    let t2 = setTimeout(() => setCheckedCount(2), 1200);
    let t3 = setTimeout(() => setCheckedCount(3), 2000);
    let t4 = setTimeout(() => setCheckedCount(4), 2800);

    return () => {
      clearInterval(intPercent);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const checklists = [
    "Ownership Deed Checked",
    "Tax Receipts Audit",
    "Physical Property Visit",
    "Broker-Free Safety Assurance"
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full p-3.5 space-y-3 flex flex-col bg-slate-900 text-white"
    >
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-brand-indigo" />
          <span className="text-[9px] font-black uppercase text-brand-indigo font-mono">Auditor Portal</span>
        </div>
        <span className={`text-[7px] border px-2 py-0.5 rounded-full font-black uppercase transition-all ${
          verifyPercent < 40
            ? "bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse"
            : verifyPercent < 100
              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        }`}>
          {verifyPercent < 40 ? "Pending" : verifyPercent < 100 ? "Reviewing" : "Approved"}
        </span>
      </div>

      <div className="bg-slate-950 border border-white/5 p-2.5 rounded-xl flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[7.5px] text-slate-500 font-bold uppercase font-mono">Deed verification</p>
          <h6 className="text-[10px] font-black text-slate-300">Registry ID: #481-BALAJI</h6>
        </div>
        <div className="w-8 h-8 rounded-full border-2 border-brand-purple flex items-center justify-center text-[7.5px] font-black">
          {verifyPercent}%
        </div>
      </div>

      <div className="space-y-2 flex-grow">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-wide font-mono">Inspection Checklist</p>
        <div className="space-y-1.5">
          {checklists.map((item, idx) => {
            const isDone = checkedCount > idx;
            return (
              <div
                key={item}
                className="bg-slate-950/60 border border-white/5 p-2 rounded-lg flex items-center justify-between text-[9px] font-bold text-slate-350 transition-colors duration-300"
              >
                <span>{item}</span>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isDone 
                    ? "bg-emerald-500 border-emerald-500 text-white" 
                    : "bg-transparent border-slate-700 text-transparent"
                }`}>
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-2 bg-slate-950 border border-white/5 rounded-lg font-mono text-[7px] text-slate-500">
        <span>$ rentto-verify --owner=Vasavi --run</span>
      </div>
    </motion.div>
  );
}

function OwnerBadgeDemo() {
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    let t1 = setTimeout(() => setShowTags(true), 1200);
    return () => clearTimeout(t1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full p-3.5 space-y-3 flex flex-col bg-white text-slate-800"
    >
      <div className="text-center py-4 space-y-2 border-b border-slate-100 shrink-0">
        <motion.div
          initial={{ scale: 0.2, rotate: -45, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 10 }}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#6C4DFF] to-brand-purple flex items-center justify-center text-white mx-auto shadow-xl shadow-[#6c4dff]/20"
        >
          <ShieldCheck className="w-8 h-8 fill-current text-white animate-pulse" />
        </motion.div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-black text-slate-850">Earn Verified Badge</h4>
          <p className="text-[7.5px] text-slate-450 font-bold uppercase tracking-wider font-mono">Direct Trust Seal Activated</p>
        </div>
      </div>

      <div className="space-y-2 flex-grow">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wide font-mono">Trust Enabled Features</p>
        
        <div className="space-y-1.5">
          {[
            { title: "Fraud Protection", desc: "Escrow secure booking enabled" },
            { title: "Verified Listing Badge", desc: "Attract 3x more tenants instantly" }
          ].map((item, idx) => (
            <AnimatePresence key={item.title}>
              {showTags && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 shrink-0 flex items-center justify-center">
                    ✓
                  </div>
                  <div className="text-left">
                    <h6 className="text-[9.5px] font-black text-slate-800 leading-none">{item.title}</h6>
                    <p className="text-[7.5px] text-slate-450 font-semibold mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function OwnerLiveDemo() {
  const [counter, setCounter] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);

  useEffect(() => {
    // Views increment
    let intCounter = setInterval(() => {
      setCounter((prev) => {
        if (prev >= 2481) {
          clearInterval(intCounter);
          return 2481;
        }
        return prev + 62;
      });
    }, 30);

    // Inquiry popup simulation
    let t1 = setTimeout(() => setInquiryCount(1), 1000);
    let t2 = setTimeout(() => setInquiryCount(2), 2200);

    return () => {
      clearInterval(intCounter);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full p-3.5 space-y-3 flex flex-col bg-[#f8fafc] text-slate-800"
    >
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <span className="text-[9px] font-black uppercase text-slate-450 font-mono">Active Listing</span>
        <motion.span 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 2, -2, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-[8px] bg-emerald-100 border border-emerald-200 text-emerald-600 px-2.5 py-0.5 rounded-full font-black uppercase"
        >
          Live
        </motion.span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-slate-100 p-2.5 rounded-2xl shadow-md space-y-2"
      >
        <div className="h-16 bg-gradient-to-tr from-brand-indigo/20 via-brand-purple/20 to-brand-pink/20 rounded-xl relative p-1.5 flex justify-between items-start text-white">
          <span className="text-[6.5px] font-black bg-[#6C4DFF] px-2 py-0.5 rounded-md">✓ Verified</span>
        </div>
        <div>
          <h5 className="text-[10px] font-black text-slate-850">Anila delux pg</h5>
          <p className="text-[8px] text-slate-450 font-bold mt-0.5">Koramangala • $750/month</p>
        </div>
        <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-[8px] font-black text-slate-450">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{counter.toLocaleString()}</span> views
          </span>
          <span className="text-emerald-500 font-bold">● Active Booking</span>
        </div>
      </motion.div>

      <div className="space-y-1.5 flex-grow overflow-y-auto no-scrollbar">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wide font-mono">Recent Inquiries ({inquiryCount})</p>
        <div className="space-y-1.5">
          {inquiryCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-100 p-2 rounded-xl flex gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-brand-purple/10 text-brand-purple font-black text-[9px] flex items-center justify-center shrink-0">
                S
              </div>
              <div className="flex-grow text-left">
                <span className="text-[8.5px] font-black text-slate-800">Sarah J.</span>
                <p className="text-[8.5px] text-slate-500 leading-tight mt-0.5 italic">&quot;Is AC included?&quot;</p>
              </div>
            </motion.div>
          )}

          {inquiryCount > 1 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-100 p-2 rounded-xl flex gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-brand-pink/10 text-brand-pink font-black text-[9px] flex items-center justify-center shrink-0">
                R
              </div>
              <div className="flex-grow text-left">
                <span className="text-[8.5px] font-black text-slate-800">Rajesh V.</span>
                <p className="text-[8.5px] text-slate-500 leading-tight mt-0.5 italic">&quot;Can I visit tomorrow?&quot;</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================================
   TENANT SUB-DEMO COMPONENTS (State Timelines)
   ========================================================================= */

function TenantAccountDemo() {
  const [phoneText, setPhoneText] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [typedOtp, setTypedOtp] = useState<(string | number)[]>(["", "", "", ""]);

  useEffect(() => {
    // Type Phone number
    let t1 = setTimeout(() => {
      let num = "+91 98765 43210";
      let i = 0;
      let interval = setInterval(() => {
        setPhoneText(num.substring(0, i));
        i++;
        if (i > num.length) {
          clearInterval(interval);
          setOtpSent(true);
        }
      }, 70);
    }, 300);

    // Type OTP digit by digit
    let t2 = setTimeout(() => {
      let otp = [4, 9, 2, 7];
      let i = 0;
      let interval = setInterval(() => {
        setTypedOtp((prev) => {
          let clone = [...prev];
          clone[i] = otp[i];
          return clone;
        });
        i++;
        if (i >= otp.length) clearInterval(interval);
      }, 300);
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full p-4 space-y-4 flex flex-col justify-center bg-white text-slate-800"
    >
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-indigo/15 text-brand-indigo flex items-center justify-center mx-auto shadow-md">
          <User className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-black text-slate-850">Create Account</h4>
        <p className="text-[10px] text-slate-450 font-bold max-w-[180px] mx-auto leading-normal">
          Enter email or mobile number to get started.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2 min-h-[36px]">
            <Phone className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-black text-slate-700">{phoneText}</span>
          </div>
        </div>
        
        <AnimatePresence>
          {otpSent && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-1"
            >
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-wide font-mono">Enter OTP code</label>
              <div className="flex gap-2 justify-between">
                {typedOtp.map((char, index) => (
                  <div key={`otp-${index}`} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-black text-slate-750 bg-slate-50">
                    {char}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button 
        animate={otpSent ? { scale: [1, 1.02, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-full py-2.5 bg-gradient-to-tr from-brand-indigo to-brand-purple text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl shadow-md"
      >
        Verify & Continue
      </motion.button>
    </motion.div>
  );
}

function TenantDiscoverDemo() {
  const [typedQuery, setTypedQuery] = useState("");
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Type Search Query
    let t1 = setTimeout(() => {
      let query = "Balaji PG";
      let i = 0;
      let interval = setInterval(() => {
        setTypedQuery(query.substring(0, i));
        i++;
        if (i > query.length) {
          clearInterval(interval);
          setStepIndex(1); // load results
        }
      }, 80);
    }, 300);

    return () => clearTimeout(t1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full p-3 flex flex-col bg-[#f8fafc] text-slate-800"
    >
      <div className="bg-white border border-slate-150 rounded-xl p-2.5 flex items-center gap-2 shadow-xs shrink-0 min-h-[38px]">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-black text-slate-700">{typedQuery || "Search houses or PGs..."}</span>
      </div>

      <div className="flex gap-1.5 py-3 shrink-0">
        {["All PGs", "Apartments", "Commercial"].map((f, i) => (
          <span key={f} className={`text-[8px] font-black px-2.5 py-1 rounded-full border ${
            i === 0 
              ? "bg-brand-purple border-brand-purple text-white" 
              : "bg-white border-slate-150 text-slate-455"
          }`}>
            {f}
          </span>
        ))}
      </div>

      <div className="space-y-2 flex-grow overflow-y-auto no-scrollbar pb-2">
        {stepIndex > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 p-2 rounded-xl flex gap-2.5 relative"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-brand-indigo/30 to-brand-purple/30 rounded-lg shrink-0 flex items-center justify-center relative p-1">
              <span className="text-[5px] bg-[#6C4DFF] text-white font-extrabold px-1 rounded absolute top-0.5 left-0.5">✓ Verify</span>
            </div>
            <div className="text-left flex-grow flex flex-col justify-between py-0.5">
              <div>
                <h6 className="text-[9.5px] font-black text-slate-800 leading-tight">Balaji Empire PG</h6>
                <p className="text-[7.5px] text-slate-400 font-bold mt-0.5">Hostel / PG</p>
              </div>
              <span className="text-[9px] font-black text-brand-purple">$180/mo</span>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-[10px] font-bold">
            Type keyword to discover...
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TenantDetailsDemo() {
  const [photoIndex, setPhotoIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gallery slider swipe simulation
  useEffect(() => {
    const intGallery = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % 2);
    }, 1800);

    return () => clearInterval(intGallery);
  }, []);

  // Vertical scrolling simulation inside the details page
  useEffect(() => {
    let t1 = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: 80,
          behavior: "smooth"
        });
      }
    }, 2200);

    return () => clearTimeout(t1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      ref={scrollRef}
      className="absolute inset-0 p-3 flex flex-col bg-white text-slate-800 overflow-y-auto no-scrollbar justify-between"
    >
      <div className="space-y-3 flex-grow">
        
        {/* Gallery Slider Swipe Mock */}
        <div className="h-28 bg-gradient-to-tr from-brand-indigo/25 to-brand-purple/25 rounded-2xl relative overflow-hidden flex items-center justify-center">
          <motion.div
            key={`gallery-photo-${photoIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-black relative"
          >
            <div className={`absolute inset-0 bg-gradient-to-tr ${
              photoIndex === 0 ? "from-brand-indigo/20 to-brand-purple/20" : "from-brand-purple/20 to-brand-pink/20"
            }`} />
            <span>Room Shot {photoIndex + 1}/2</span>
          </motion.div>
          
          <span className="text-[6.5px] font-black bg-[#6C4DFF] text-white px-2 py-0.5 rounded-md shadow absolute top-2 left-2 z-10">
            ✓ Verified
          </span>
        </div>

        <div className="space-y-1 text-left">
          <div className="flex justify-between items-start">
            <h5 className="text-[11px] font-black text-slate-850 leading-tight animate-pulse">Balaji Empire PG</h5>
            <span className="text-[10px] font-black text-brand-indigo leading-none">$180/mo</span>
          </div>
          <p className="text-[8px] text-slate-400 font-bold flex items-center gap-0.5">
            <MapPin className="w-3 h-3 text-slate-400" /> Koramangala, Hyderabad
          </p>
        </div>

        <div className="border-t border-b border-slate-50 py-2.5 flex justify-between text-center bg-slate-50/50 rounded-xl px-1">
          {[
            { label: "Free WiFi", val: "100 Mbps" },
            { label: "AC Room", val: "Available" },
            { label: "Hostel Rating", val: "4.9 ★" }
          ].map((item) => (
            <div key={item.label} className="flex-1">
              <p className="text-[7.5px] text-slate-450 font-bold uppercase leading-none">{item.label}</p>
              <p className="text-[9px] font-black text-slate-800 mt-0.5 leading-none">{item.val}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 p-2 rounded-xl text-left text-[8px] text-slate-500 font-bold leading-relaxed border border-slate-100">
          This fully verified hostel features single and double sharing slots with modern kitchen facilities and biometric access security lines.
        </div>
      </div>

      <button className="w-full py-2.5 bg-gradient-to-tr from-brand-indigo to-brand-purple text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-md mt-2 shrink-0">
        Book Inspection
      </button>
    </motion.div>
  );
}

function TenantConnectDemo() {
  const [chatLog, setChatLog] = useState<number>(0);
  const [visitSent, setVisitSent] = useState(false);

  useEffect(() => {
    // Show chat responses progressively
    let t1 = setTimeout(() => setChatLog(1), 500);
    let t2 = setTimeout(() => setChatLog(2), 1600);

    // Call/Schedule Visit request popup
    let t3 = setTimeout(() => setVisitSent(true), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full p-3.5 space-y-3.5 flex flex-col bg-[#f8fafc] text-slate-800"
    >
      <div className="bg-white border border-slate-100 p-2.5 rounded-2xl shadow-sm flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-brand-purple/10 text-brand-purple font-black text-xs flex items-center justify-center">
          V
        </div>
        <div className="text-left flex-grow">
          <h5 className="text-[9.5px] font-black text-slate-850">Vasavi Reddy</h5>
          <p className="text-[7px] text-slate-450 font-bold uppercase font-mono">Landlord Verified ✅</p>
        </div>
      </div>

      <div className="flex-grow bg-white border border-slate-100 rounded-2xl p-2 flex flex-col justify-between overflow-hidden shadow-inner relative">
        <div className="space-y-2 flex-grow overflow-y-auto no-scrollbar">
          {chatLog > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#f1f5f9] text-[9px] p-2 rounded-xl rounded-tl-none max-w-[85%] text-left"
            >
              Hi! Is the single room in Balaji PG available from tomorrow?
            </motion.div>
          )}
          {chatLog > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-indigo text-white text-[9px] p-2 rounded-xl rounded-tr-none max-w-[85%] ml-auto text-left font-bold"
            >
              Yes! You can pay deposit to secure.
            </motion.div>
          )}
        </div>

        {/* Visit alert dialog pops up */}
        <AnimatePresence>
          {visitSent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-2 bottom-12 bg-slate-900 text-white p-2.5 rounded-xl border border-white/10 shadow-2xl space-y-1.5 text-center"
            >
              <div className="flex items-center gap-1 justify-center text-[9px] font-black text-brand-indigo">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
                <span>Visit Scheduled!</span>
              </div>
              <p className="text-[7.5px] text-slate-400">Date: June 10th at 10:00 AM</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-2 border-t border-slate-50 flex gap-1.5 shrink-0">
          <button className="flex-1 py-1.5 border border-slate-200 rounded-lg text-[8.5px] font-black flex items-center justify-center gap-1">
            <PhoneCall className="w-3 h-3 text-slate-455" /> Call
          </button>
          <button className="flex-1 py-1.5 bg-brand-indigo text-white rounded-lg text-[8.5px] font-black flex items-center justify-center gap-1">
            Chat Active
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TenantMoveInDemo() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let t1 = setTimeout(() => setShowWelcome(true), 1200);
    return () => clearTimeout(t1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full p-4 space-y-4 flex flex-col justify-center text-center bg-white text-slate-800 relative overflow-hidden"
    >
      <motion.div 
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 10, delay: 0.2 }}
        className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
      >
        <CheckCircle2 className="w-8 h-8 text-white" />
      </motion.div>

      <div className="space-y-1">
        <h4 className="text-xs font-black text-slate-850">Booking Confirmed!</h4>
        <p className="text-[9px] text-slate-500 font-bold max-w-[200px] mx-auto leading-normal">
          Agreement Signed & Deposit Escrow Secured.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1 text-left text-[8.5px]">
        <div className="flex justify-between font-bold text-slate-450">
          <span>Transaction ID:</span>
          <span className="font-mono text-slate-700">#TXN-8092-ENT</span>
        </div>
        <div className="flex justify-between font-bold text-slate-450 border-t border-slate-100/50 pt-1">
          <span>Room Assigned:</span>
          <span className="font-black text-slate-800">Balaji PG • Room 101</span>
        </div>
      </div>

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 rounded-xl bg-gradient-to-tr from-brand-indigo/10 to-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[9px] font-black"
          >
            ✨ Welcome Home! Welcome package sent.
          </motion.div>
        )}
      </AnimatePresence>

      <button className="w-full py-2 bg-gradient-to-tr from-brand-indigo to-brand-purple text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-md">
        View Agreement
      </button>
    </motion.div>
  );
}

function DefaultPreview() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full p-6 flex flex-col items-center justify-center text-center bg-slate-900 text-white space-y-4"
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple shadow-lg shadow-brand-purple/5">
        <SlidersHorizontal className="w-7 h-7 animate-pulse" />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-black text-slate-250 font-mono">Preview Coming Soon</h4>
        <p className="text-[9px] text-slate-500 font-bold max-w-[180px] mx-auto leading-normal">
          We are compiling the live demo walkthrough for this step.
        </p>
      </div>
      <div className="w-16 h-1 bg-white/10 rounded-full animate-pulse" />
    </motion.div>
  );
}