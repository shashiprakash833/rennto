"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Plus, Search, ShieldCheck, CheckCircle2, DollarSign, MapPin, 
  TrendingUp, Users, Bell, Trash2, Check, X, ChevronRight, Image as ImageIcon, 
  FileText, Upload, Star, SlidersHorizontal, Sparkles, ShieldAlert, Award, MessageSquare
} from "lucide-react";

type ActiveScreen = "owner-home" | "owner-register" | "tenant-home" | "admin-verify";

export default function AppShowcase() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("owner-register");
  
  // Interactive States for each screen
  // 1. Owner Home states
  const [revenue, setRevenue] = useState(12450);
  const [inquiries, setInquiries] = useState([
    { id: 1, name: "Sarah Jenkins", property: "Koramangala 2BHK", message: "Can I move in by next Monday?", date: "Today", status: "pending" },
    { id: 2, name: "Vikram Malhotra", property: "Gachibowli Hostel", message: "Is parking space included?", date: "Yesterday", status: "pending" }
  ]);
  const [activeListings, setActiveListings] = useState(8);

  const handleApproveInquiry = (id: number) => {
    setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: "approved" } : inq));
    setRevenue(r => r + 850);
    setActiveListings(l => l - 1);
  };

  const handleDeclineInquiry = (id: number) => {
    setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: "declined" } : inq));
  };

  // 2. Owner Onboarding states
  const [registerStep, setRegisterStep] = useState(2); // Start at step 2 (Upload Media) to be interesting
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(["/prop1.jpg", "/prop2.jpg"]);
  const [checkedDocs, setCheckedDocs] = useState({ deed: true, tax: false, id: true });
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  const handleAddPhoto = () => {
    if (uploadedPhotos.length < 4) {
      setUploadedPhotos(prev => [...prev, `/mock-prop-${prev.length + 1}.jpg`]);
    }
  };

  const handleRegisterSubmit = () => {
    setRegistrationSubmitted(true);
    setTimeout(() => {
      setRegisterStep(3); // Onboarding complete step
    }, 1500);
  };

  // 3. Tenant Home states
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantCategory, setTenantCategory] = useState<"all" | "Hostel" | "Apartment">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const tenantProperties = [
    { id: 1, title: "Grand PG & Suites", type: "Hostel", price: 120, rating: 4.8, location: "Hyderabad", verified: true },
    { id: 2, title: "Luxe Koramangala Flat", type: "Apartment", price: 680, rating: 4.95, location: "Bangalore", verified: true },
    { id: 3, title: "Co-Living Pod Suite", type: "Hostel", price: 180, rating: 4.6, location: "Pune", verified: false }
  ];

  const filteredTenantProps = tenantProperties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(tenantSearch.toLowerCase()) || p.location.toLowerCase().includes(tenantSearch.toLowerCase());
    const matchesCat = tenantCategory === "all" || p.type === tenantCategory;
    const matchesVerify = !verifiedOnly || p.verified;
    return matchesSearch && matchesCat && matchesVerify;
  });

  // 4. Admin Portal states
  const [adminQueue, setAdminQueue] = useState([
    { id: 1, title: "Modern Studio Suite", owner: "Rajesh K.", docStatus: "deed_verified", status: "pending" },
    { id: 2, title: "Elite Co-Working Desk", owner: "Priya M.", docStatus: "pending_site_audit", status: "pending" }
  ]);
  const [showStamp, setShowStamp] = useState(false);

  const handleAdminApprove = (id: number) => {
    setShowStamp(true);
    setTimeout(() => {
      setAdminQueue(prev => prev.map(item => item.id === id ? { ...item, status: "approved" } : item));
      setShowStamp(false);
    }, 2000);
  };

  const handleAdminReject = (id: number) => {
    setAdminQueue(prev => prev.map(item => item.id === id ? { ...item, status: "rejected" } : item));
  };

  // Auto-switch preview tab if user is idle (optional presentation cycle)
  useEffect(() => {
    const screens: ActiveScreen[] = ["owner-register", "admin-verify", "tenant-home", "owner-home"];
    const interval = setInterval(() => {
      // Auto cycle only if not clicked in last 15s (simplified logic: just toggle)
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const tabOptions = [
    { id: "owner-register", label: "Owner Onboarding", subtitle: "Verify & list property", icon: Plus },
    { id: "admin-verify", label: "Admin Verification", subtitle: "Quality checklist & audit", icon: ShieldCheck },
    { id: "tenant-home", label: "Tenant Discovery", subtitle: "Browse & filter rentals", icon: Search },
    { id: "owner-home", label: "Owner Home", subtitle: "Real-time dashboard", icon: LayoutDashboard }
  ];

  return (
    <section id="app-showcase" className="py-28 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-900 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background visual indicators */}
      <div className="absolute top-0 left-0 w-[45rem] h-[45rem] bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[45rem] h-[45rem] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            See <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Rento in Action</span>
          </h2>
          <p className="text-lg text-slate-655 dark:text-slate-400 font-medium">
            Explore property details, owners dashboards, and verification pipelines in real-time.
          </p>
        </div>

        {/* Dynamic Split Layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT SIDE: Interactive Multi-Tab Controller */}
          <div className="lg:col-span-5 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Select App Feature Panel</h3>
            
            <div className="space-y-4">
              {tabOptions.map((opt) => {
                const isActive = activeScreen === opt.id;
                const Icon = opt.icon;
                
                return (
                  <button
                    key={opt.id}
                    onClick={() => setActiveScreen(opt.id as ActiveScreen)}
                    className={`w-full text-left p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden flex items-center gap-5 group active:scale-98 ${
                      isActive 
                        ? "bg-white dark:bg-slate-900 border-brand-indigo/25 shadow-xl shadow-brand-indigo/5" 
                        : "bg-transparent border-transparent hover:bg-white/40 dark:hover:bg-slate-900/40 hover:border-slate-200 dark:hover:border-slate-850"
                    }`}
                  >
                    {/* Glowing highlight indicator */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeAppIndicator" 
                        className="absolute inset-0 bg-gradient-to-r from-brand-indigo/10 to-transparent pointer-events-none" 
                      />
                    )}

                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 relative z-10 ${
                      isActive 
                        ? "bg-brand-indigo text-white shadow-md shadow-brand-indigo/20" 
                        : "bg-slate-100 dark:bg-slate-850 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="relative z-10 flex-grow">
                      <h4 className={`text-lg font-black transition-colors ${
                        isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-250"
                      }`}>
                        {opt.label}
                      </h4>
                      <p className={`text-sm font-semibold transition-colors mt-0.5 ${
                        isActive ? "text-slate-650 dark:text-slate-450" : "text-slate-400 dark:text-slate-500"
                      }`}>
                        {opt.subtitle}
                      </p>
                    </div>

                    <ChevronRight className={`w-5 h-5 text-slate-300 transition-all ${
                      isActive ? "text-brand-indigo translate-x-1" : "group-hover:translate-x-1"
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE: PREMIUM FLOATING PHONE MOCKUP */}
          <div className="lg:col-span-7 flex justify-center perspective-1000 relative">
            
            {/* Soft Ambient glow behind the phone that coordinates with the active screen */}
            <div className={`absolute w-72 h-[34rem] rounded-[3rem] blur-3xl opacity-15 pointer-events-none -z-10 transition-all duration-700 ${
              activeScreen === "owner-home" ? "bg-brand-indigo" :
              activeScreen === "owner-register" ? "bg-brand-purple" :
              activeScreen === "tenant-home" ? "bg-brand-purple" : "bg-brand-pink"
            }`} />

            {/* Fenced Device Frame */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, rotateY: 15 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              whileHover={{ rotateY: -2, rotateX: 2, rotateZ: 0.5, scale: 1.01 }}
              className="w-full max-w-[360px] h-[720px] bg-slate-950 rounded-[3.25rem] p-3.5 border-4 border-slate-900 shadow-2xl relative select-none flex flex-col justify-between"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Floating Decorative Card 1 (Left) */}
              <motion.div 
                animate={{ y: [0, -15, 0] }} 
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute -left-12 sm:-left-20 top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 z-50 flex items-center gap-3 backdrop-blur-md"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Status</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Verified Safe</p>
                </div>
              </motion.div>

              {/* Floating Decorative Card 2 (Right) */}
              <motion.div 
                animate={{ y: [0, 15, 0] }} 
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute -right-8 sm:-right-16 bottom-32 bg-slate-900 dark:bg-black border border-slate-800 dark:border-slate-800 p-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-brand-indigo flex items-center justify-center text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Zero Fees</p>
                  <p className="text-sm font-black text-white">No Brokers</p>
                </div>
              </motion.div>
              
              {/* Glossy overlay sheen */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/5 to-white/0 rounded-[3.25rem] pointer-events-none z-40" />

              {/* Speaker Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center p-0.5">
                <div className="w-12 h-1.5 bg-slate-800 rounded-full" />
                <div className="w-2.5 h-2.5 bg-slate-900 border border-slate-800 rounded-full ml-3" />
              </div>

              {/* Dynamic Status Bar */}
              <div className="flex justify-between items-center px-6 pt-3 pb-2 text-[10px] font-black text-slate-400 dark:text-slate-400 z-30 bg-slate-950 rounded-t-[2.75rem]">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  {/* Signal bars */}
                  <div className="flex gap-0.5 items-end">
                    <div className="w-0.5 h-1.5 bg-slate-400 rounded-sm" />
                    <div className="w-0.5 h-2 bg-slate-400 rounded-sm" />
                    <div className="w-0.5 h-2.5 bg-slate-400 rounded-sm" />
                    <div className="w-0.5 h-3 bg-slate-400 rounded-sm" />
                  </div>
                  {/* Wifi icon mock */}
                  <div className="w-3.5 h-2.5 border-2 border-slate-400 rounded-full flex items-center justify-center border-b-transparent border-l-transparent" />
                  {/* Battery mockup */}
                  <div className="w-5 h-2.5 border border-slate-400 rounded-md p-0.5 flex items-center">
                    <div className="h-full w-full bg-slate-400 rounded-sm" />
                  </div>
                </div>
              </div>

              {/* ACTIVE SCREEN CONTENT CANVAS */}
              <div className="flex-grow bg-slate-50 dark:bg-slate-900 overflow-hidden relative rounded-3xl flex flex-col justify-between">
                
                <AnimatePresence mode="wait">
                  
                  {/* 1. OWNER HOME SCREEN */}
                  {activeScreen === "owner-home" && (
                    <motion.div
                      key="scr-owner-home"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 p-4 space-y-4 flex flex-col overflow-y-auto no-scrollbar"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-indigo/10 flex items-center justify-center font-bold text-xs text-brand-indigo">
                            RK
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Property Owner</p>
                            <h5 className="text-xs font-black text-slate-850 dark:text-slate-100">Rajesh Kumar</h5>
                          </div>
                        </div>
                        <div className="relative">
                          <Bell className="w-4 h-4 text-slate-400" />
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-pink rounded-full" />
                        </div>
                      </div>

                      {/* STATS ANALYTICS CARD */}
                      <div className="bg-gradient-to-tr from-brand-indigo to-brand-purple rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex justify-between items-center text-[10px] opacity-75 font-bold uppercase tracking-wider">
                          <span>Total Revenue</span>
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black mt-1">
                          ${revenue.toLocaleString()}
                        </div>
                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/10 text-[9px] font-bold">
                          <div>
                            <span className="opacity-75">Active Listings</span>
                            <p className="text-xs font-black mt-0.5">{activeListings}</p>
                          </div>
                          <div className="text-right">
                            <span className="opacity-75">Occupancy Rate</span>
                            <p className="text-xs font-black mt-0.5">92%</p>
                          </div>
                        </div>
                      </div>

                      {/* INQUIRIES SECTION */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>Tenant Inquiries</span>
                          <span className="text-[9px] text-brand-indigo font-black">{inquiries.filter(i => i.status === "pending").length} Pending</span>
                        </div>

                        <div className="space-y-2.5">
                          {inquiries.map((inq) => (
                            <div 
                              key={inq.id}
                              className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl p-3 shadow-sm space-y-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">{inq.name}</span>
                                <span className="text-[8px] bg-slate-100 dark:bg-slate-850 text-slate-400 font-bold px-2 py-0.5 rounded-full">{inq.date}</span>
                              </div>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                                For: <span className="text-slate-800 dark:text-slate-200 font-black">{inq.property}</span>
                              </p>
                              <p className="text-[10px] text-slate-655 dark:text-slate-355 italic font-semibold leading-relaxed">
                                &quot;{inq.message}&quot;
                              </p>

                              {/* Interactive accept / decline panel */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-900/60 flex justify-end gap-2 text-[9px] font-black uppercase tracking-wider">
                                {inq.status === "pending" ? (
                                  <>
                                    <button 
                                      onClick={() => handleDeclineInquiry(inq.id)}
                                      className="px-2.5 py-1 text-slate-500 hover:text-slate-800 border border-slate-200 dark:border-slate-800 rounded-md"
                                    >
                                      Decline
                                    </button>
                                    <button 
                                      onClick={() => handleApproveInquiry(inq.id)}
                                      className="px-3 py-1 bg-brand-indigo hover:bg-brand-purple text-white rounded-md flex items-center gap-1 shadow-sm"
                                    >
                                      <Check className="w-3 h-3" /> Approve
                                    </button>
                                  </>
                                ) : inq.status === "approved" ? (
                                  <span className="text-emerald-500 dark:text-emerald-400 font-black flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white dark:text-slate-900" />
                                    Approved • Rent Booked
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-bold flex items-center gap-1">
                                    <X className="w-3.5 h-3.5 text-slate-400" />
                                    Declined
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* 2. OWNER REGISTRATION / ONBOARDING */}
                  {activeScreen === "owner-register" && (
                    <motion.div
                      key="scr-owner-register"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 p-4 space-y-4 flex flex-col overflow-y-auto no-scrollbar"
                    >
                      {/* Onboarding multi-step bar */}
                      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <h5 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1">
                          <Plus className="w-4 h-4 text-brand-indigo" /> Add Property
                        </h5>
                        <div className="flex gap-1.5 items-center">
                          {[1, 2, 3].map((stepNum) => (
                            <div key={stepNum} className="flex-1 h-1.5 rounded-full relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                              <motion.div 
                                className="absolute inset-0 bg-brand-indigo"
                                initial={{ width: "0%" }}
                                animate={{ 
                                  width: registerStep > stepNum ? "100%" : registerStep === stepNum ? "60%" : "0%"
                                }}
                                transition={{ duration: 0.4 }}
                              />
                            </div>
                          ))}
                          <span className="text-[8px] font-black text-slate-400 shrink-0 uppercase tracking-widest">
                            {registerStep === 2 ? "Upload Media" : registerStep === 3 ? "Complete" : "Details"}
                          </span>
                        </div>
                      </div>

                      {registerStep === 2 && (
                        <div className="space-y-4 flex-grow flex flex-col justify-between">
                          <div className="space-y-3.5">
                            
                            {/* Property Details Display (Filled in step 1) */}
                            <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850 text-[10px] space-y-1">
                              <p className="text-slate-450 font-bold uppercase tracking-wider">Property Draft</p>
                              <p className="font-black text-slate-805 dark:text-slate-155">Modern Co-living Space • Koramangala</p>
                              <p className="text-brand-indigo font-bold">$750/mo</p>
                            </div>

                            {/* PHOTO UPLOADER BOX */}
                            <div className="space-y-2">
                              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Photos ({uploadedPhotos.length}/4)</label>
                              <div className="grid grid-cols-4 gap-2">
                                {uploadedPhotos.map((photo, i) => (
                                  <div key={i} className="h-14 bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-850 rounded-xl overflow-hidden relative flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-slate-455 dark:text-slate-655" />
                                    <div className="absolute top-0.5 right-0.5 bg-brand-indigo text-white rounded-full p-0.5">
                                      <Check className="w-2 h-2" />
                                    </div>
                                  </div>
                                ))}
                                {uploadedPhotos.length < 4 && (
                                  <button 
                                    onClick={handleAddPhoto}
                                    className="h-14 bg-brand-indigo/5 dark:bg-slate-950 border-2 border-dashed border-brand-indigo/20 dark:border-slate-800 hover:border-brand-indigo rounded-xl flex flex-col items-center justify-center text-brand-indigo"
                                  >
                                    <Upload className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* LEGAL DOCUMENT CHECKBOXES */}
                            <div className="space-y-2">
                              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Legal documents</label>
                              <div className="space-y-1.5">
                                <button 
                                  onClick={() => setCheckedDocs(prev => ({ ...prev, deed: !prev.deed }))}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 p-2.5 rounded-xl flex items-center justify-between text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">Ownership Deed.pdf</span>
                                  </div>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${checkedDocs.deed ? "bg-brand-indigo border-brand-indigo text-white" : "border-slate-300"}`}>
                                    {checkedDocs.deed && <Check className="w-3 h-3" />}
                                  </div>
                                </button>

                                <button 
                                  onClick={() => setCheckedDocs(prev => ({ ...prev, tax: !prev.tax }))}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 p-2.5 rounded-xl flex items-center justify-between text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">Property Tax Receipt.pdf</span>
                                  </div>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${checkedDocs.tax ? "bg-brand-indigo border-brand-indigo text-white" : "border-slate-300"}`}>
                                    {checkedDocs.tax && <Check className="w-3 h-3" />}
                                  </div>
                                </button>
                              </div>
                            </div>

                          </div>

                          {/* Submit button */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-855">
                            <button
                              onClick={handleRegisterSubmit}
                              disabled={registrationSubmitted}
                              className="w-full py-3 bg-brand-indigo text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-brand-indigo/10 active:scale-98 transition-all"
                            >
                              {registrationSubmitted ? (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 animate-spin" /> Verifying Draft...
                                </>
                              ) : (
                                <>
                                  Submit for Audit <ChevronRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {registerStep === 3 && (
                        <div className="flex-grow flex flex-col items-center justify-center text-center space-y-5 py-8">
                          <motion.div 
                            initial={{ scale: 0.5, rotate: -20 }}
                            animate={{ scale: [1, 1.1, 1], rotate: 0 }}
                            transition={{ duration: 0.5 }}
                            className="w-20 h-20 bg-gradient-to-tr from-brand-indigo to-brand-purple rounded-full flex items-center justify-center text-white shadow-xl shadow-brand-indigo/20"
                          >
                            <ShieldCheck className="w-10 h-10" />
                          </motion.div>
                          
                          <div className="space-y-2">
                            <h4 className="text-base font-black text-slate-900 dark:text-white">Submission Successful!</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold max-w-[220px] mx-auto leading-relaxed">
                              Your documents have been submitted to Rento Audits. Admin verification will complete in under 2 hours.
                            </p>
                          </div>

                          <button 
                            onClick={() => {
                              setRegistrationSubmitted(false);
                              setRegisterStep(2);
                            }}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 rounded-xl"
                          >
                            Reset Showcase
                          </button>
                        </div>
                      )}

                    </motion.div>
                  )}

                  {/* 3. TENANT FEED / DISCOVERY */}
                  {activeScreen === "tenant-home" && (
                    <motion.div
                      key="scr-tenant-home"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 p-4 space-y-4 flex flex-col overflow-y-auto no-scrollbar"
                    >
                      {/* Search Bar at Top */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          placeholder="Search near tech parks..."
                          value={tenantSearch}
                          onChange={(e) => setTenantSearch(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-3 pl-9 pr-8 text-[11px] font-semibold focus:outline-none"
                        />
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-4" />
                      </div>

                      {/* Tabs Quick Filters */}
                      <div className="flex gap-2">
                        {(["all", "Hostel", "Apartment"] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setTenantCategory(cat)}
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${
                              tenantCategory === cat
                                ? "bg-brand-purple border-brand-purple text-white"
                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {cat === "all" ? "All" : cat === "Hostel" ? "PGs" : "Flats"}
                          </button>
                        ))}

                        <button 
                          onClick={() => setVerifiedOnly(!verifiedOnly)}
                          className={`ml-auto px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 transition-all ${
                            verifiedOnly
                              ? "bg-brand-indigo border-brand-indigo text-white"
                              : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-400"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </button>
                      </div>

                      {/* PROPERTIES CARDS FEED */}
                      <div className="space-y-3 flex-grow">
                        {filteredTenantProps.map((p) => (
                          <div 
                            key={p.id}
                            className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl p-3 shadow-sm flex gap-3 relative overflow-hidden"
                          >
                            {/* Color Block instead of Image */}
                            <div className={`w-20 h-20 rounded-lg shrink-0 bg-gradient-to-br ${
                              p.id === 1 ? "from-brand-indigo to-brand-purple" : p.id === 2 ? "from-brand-indigo via-brand-purple to-brand-pink" : "from-brand-purple to-brand-pink"
                            } relative p-1.5 flex flex-col justify-between text-white`}>
                              {p.verified && (
                                <span className="bg-brand-indigo rounded p-0.5 self-start text-[6px] font-bold">
                                  ✓ Verified
                                </span>
                              )}
                              <span className="text-[7px] font-extrabold uppercase bg-black/30 backdrop-blur rounded px-1 self-start">
                                {p.type}
                              </span>
                            </div>

                            {/* details */}
                            <div className="flex-grow flex flex-col justify-between py-0.5">
                              <div>
                                <h6 className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">{p.title}</h6>
                                <p className="text-[8px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">{p.location} Area</p>
                              </div>
                              <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-900/60 pt-1 mt-1">
                                {/* price omitted for premium focus */}
                                <div className="flex items-center gap-0.5 text-[8px] text-amber-500 font-bold">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  <span>{p.rating}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </motion.div>
                  )}

                  {/* 4. ADMIN AUDIT / APPROVAL SCREEN */}
                  {activeScreen === "admin-verify" && (
                    <motion.div
                      key="scr-admin-verify"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 p-4 space-y-4 flex flex-col overflow-y-auto no-scrollbar"
                    >
                      {/* Admin Header */}
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-brand-purple" />
                          <div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Internal Audits Portal</p>
                            <h5 className="text-xs font-black text-slate-855 dark:text-white">Verification Queue</h5>
                          </div>
                        </div>
                        <span className="text-[8px] bg-brand-pink/15 text-brand-pink border border-brand-pink/20 font-bold px-2 py-0.5 rounded">
                          {adminQueue.filter(i => i.status === "pending").length} Pending
                        </span>
                      </div>

                      {/* PENDING ITEMS LIST */}
                      <div className="space-y-3 relative flex-grow">
                        {adminQueue.map((item) => (
                          <div 
                            key={item.id}
                            className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl p-3 shadow-sm space-y-3 relative overflow-hidden"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h6 className="text-[11px] font-black text-slate-900 dark:text-white">{item.title}</h6>
                                <p className="text-[8px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">Submitted by: <span className="font-bold text-slate-700 dark:text-slate-300">{item.owner}</span></p>
                              </div>
                              <span className="text-[8px] font-black bg-brand-indigo/10 text-brand-indigo px-2 py-0.5 rounded">
                                PG Listing
                              </span>
                            </div>

                            {/* Checklist status indicators */}
                            <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 space-y-1.5 text-[9px] font-bold">
                              <div className="flex items-center gap-2 text-slate-650 dark:text-slate-400">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-indigo shrink-0" />
                                <span>Ownership Certificate Audited</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-650 dark:text-slate-400">
                                {item.docStatus === "deed_verified" ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-indigo shrink-0" />
                                ) : (
                                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                                )}
                                <span>Site Audit Quality Check</span>
                              </div>
                            </div>

                            {/* Action Row */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-900/60 flex justify-end gap-2 text-[9px] font-black uppercase tracking-wider">
                              {item.status === "pending" ? (
                                <>
                                  <button 
                                    onClick={() => handleAdminReject(item.id)}
                                    className="px-2.5 py-1 text-brand-pink hover:bg-brand-pink/10 border border-slate-200 dark:border-slate-800 rounded-md"
                                  >
                                    Reject
                                  </button>
                                  <button 
                                    onClick={() => handleAdminApprove(item.id)}
                                    className="px-3 py-1 bg-brand-purple hover:bg-brand-indigo text-white rounded-md flex items-center gap-1 shadow-sm"
                                  >
                                    Approve & Badge
                                  </button>
                                </>
                              ) : item.status === "approved" ? (
                                <span className="text-emerald-500 dark:text-emerald-400 font-black flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white dark:text-slate-900" />
                                  Seal Approved & Published
                                </span>
                              ) : (
                                <span className="text-red-500 font-bold flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" />
                                  Rejected Draft
                                </span>
                              )}
                            </div>

                            {/* Rotating glowing verification stamp overlays */}
                            {showStamp && item.id === 1 && (
                              <motion.div 
                                initial={{ scale: 2, opacity: 0, rotate: -45 }}
                                animate={{ scale: 1, opacity: 1, rotate: -15 }}
                                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                                className="absolute inset-0 bg-brand-indigo/15 backdrop-blur-xs flex items-center justify-center pointer-events-none"
                              >
                                <div className="border-4 border-dashed border-brand-indigo text-brand-indigo px-4 py-2 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg flex items-center gap-1">
                                  <Award className="w-4 h-4 animate-spin" /> Approved
                                </div>
                              </motion.div>
                            )}

                          </div>
                        ))}
                      </div>

                    </motion.div>
                  )}

                </AnimatePresence>

              </div>

              {/* Home Indicator line at bottom */}
              <div className="w-28 h-1 bg-slate-850 rounded-full mx-auto my-1.5" />

            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
