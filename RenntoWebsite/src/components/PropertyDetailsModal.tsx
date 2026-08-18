"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, DollarSign, Star, Heart, CheckCircle2, Wifi, Car, AirVent, Shield,
  Tv, Calendar, Phone, MessageSquare, ChevronLeft, ChevronRight, Share2, Compass, Sparkles, Building, Layers
} from "lucide-react";

interface Property {
  id: number;
  title: string;
  location: string;
  city: "Hyderabad" | "Bangalore" | "Chennai" | "Mumbai" | "Pune";
  price: number;
  rating: number;
  distance: string;
  type: "Hostel" | "Apartment" | "Commercial Space";
  verified: boolean;
  gradient: string;
  image?: string;
  mapX: number;
  mapY: number;
}

interface PropertyDetailsModalProps {
  property: Property;
  allProperties: Property[];
  onClose: () => void;
  onSelectProperty: (property: Property) => void;
  setToast: (toast: { message: string; type: "success" | "error" } | null) => void;
}

export default function PropertyDetailsModal({
  property,
  allProperties,
  onClose,
  onSelectProperty,
  setToast,
}: PropertyDetailsModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Filter similar properties (exclude current, prefer same category or city)
  const similarProperties = allProperties
    .filter((p) => p.id !== property.id)
    .slice(0, 2);

  const images = [
    { label: "Main Entrance", gradient: property.gradient, src: property.image },
    { label: "Living & Workspace", gradient: "from-slate-800 to-slate-700", src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80" },
    { label: "Premium Interior", gradient: "from-blue-900 to-indigo-950", src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80" },
  ];

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleContactAction = (type: "call" | "message") => {
    setToast({
      message:
        type === "call"
          ? "Mock call initiated! Connecting secure line to Landlord..."
          : "Opening mock chat console with verified listing host.",
      type: "success",
    });
  };

  const handleScheduleVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate || !visitTime) {
      setToast({
        message: "Please fill out preferred visit date and time.",
        type: "error",
      });
      return;
    }

    setIsScheduling(true);
    setTimeout(() => {
      setIsScheduling(false);
      setToast({
        message: `Visit scheduled successfully for ${visitDate} at ${visitTime}! Host will confirm shortly.`,
        type: "success",
      });
      setVisitDate("");
      setVisitTime("");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
      
      {/* Background Overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative bg-white w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[2.5rem] overflow-y-auto shadow-2xl z-10 flex flex-col"
      >
        
        {/* Sticky Header Row */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-20">
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
          >
            ← Back to listings
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                setToast({
                  message: !isBookmarked ? "Saved listing to your catalog." : "Removed listing from catalog.",
                  type: "success"
                });
              }}
              className={`p-2.5 rounded-full border transition-all ${
                isBookmarked 
                  ? "bg-red-50 border-red-100 text-red-500" 
                  : "bg-slate-50 border-slate-150 text-slate-550 hover:text-slate-800"
              }`}
            >
              <Heart className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={() => setToast({ message: "Share link copied to clipboard!", type: "success" })}
              className="p-2.5 rounded-full bg-slate-50 border border-slate-150 text-slate-550 hover:text-slate-800 transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable details wrapper */}
        <div className="p-6 sm:p-8 space-y-8 flex-1 overflow-y-auto">
          
          {/* Main Info Split: Image Carousel (Left) + Briefing (Right) */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Dynamic Carousel Slider */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative h-64 sm:h-96 rounded-[2rem] overflow-hidden bg-slate-950 group">
                               {/* Active Slide Image Mock */}
                <div className="absolute inset-0 bg-slate-950">
                  {images[activeImageIndex].src ? (
                    <>
                      <img 
                        src={images[activeImageIndex].src} 
                        alt={images[activeImageIndex].label} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-900/10 to-slate-950/40" />
                      <div className="absolute bottom-12 left-6 text-left text-white z-10 space-y-1">
                        <p className="font-extrabold text-sm tracking-wider uppercase drop-shadow">{images[activeImageIndex].label}</p>
                        <span className="text-[9px] bg-brand-purple/90 border border-brand-purple/20 px-2 py-0.5 rounded-full uppercase font-bold text-white tracking-widest">
                          Rento Verified Photo
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-tr ${images[activeImageIndex].gradient} flex items-center justify-center p-6 text-center text-white/40`}>
                      <div className="space-y-3">
                        <Building className="w-12 h-12 mx-auto animate-pulse" />
                        <p className="font-extrabold text-sm tracking-wider uppercase">{images[activeImageIndex].label}</p>
                        <span className="text-[10px] bg-black/25 px-3 py-1 rounded-full uppercase font-bold text-white">
                          Rento Studio Preview
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Left/Right click triggers */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/25 hover:bg-white/80 text-white hover:text-slate-950 backdrop-blur transition-all active:scale-90 z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/25 hover:bg-white/80 text-white hover:text-slate-950 backdrop-blur transition-all active:scale-90 z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Badge Overlay */}
                <span className="absolute bottom-4 right-4 bg-black/45 backdrop-blur text-white text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider z-20">
                  {activeImageIndex + 1} / {images.length} Photos
                </span>
              </div>

              {/* Thumbnails row */}
              <div className="flex gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-1 h-14 rounded-xl border-2 transition-all relative overflow-hidden flex items-center justify-center text-[8px] font-bold text-white/50 uppercase tracking-widest ${
                      activeImageIndex === idx ? "border-brand-indigo shadow-md" : "border-transparent opacity-65 hover:opacity-100"
                    }`}
                  >
                    {img.src ? (
                      <img src={img.src} alt={img.label} className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-tr ${img.gradient} absolute inset-0`} />
                    )}
                    <span className="relative z-10 bg-black/40 px-1 py-0.5 rounded backdrop-blur-xs text-[7px] text-white">
                      {img.label.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Brief specs */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {property.verified && (
                    <span className="px-2.5 py-1 bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20 text-[10px] font-bold rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Listing
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-brand-purple/10 text-brand-purple border border-brand-purple/20 text-[10px] font-bold rounded-lg">
                    {property.type}
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" /> {property.rating} Ratings
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {property.title}
                </h1>
                
                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-brand-indigo shrink-0" />
                  <span>{property.location} • {property.distance} away</span>
                </div>
              </div>

              {/* Price Callout */}
              <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Lease Commitment</span>
                  <span className="text-sm font-black text-slate-900">Direct from Host</span>
                </div>
                
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Broker Commission</span>
                  <span className="text-sm font-black text-emerald-600">0% (Zero Fee)</span>
                </div>
              </div>

              {/* Basic spec parameters */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="border border-slate-150 p-3.5 rounded-2xl bg-white space-y-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase block">Layout</span>
                  <span className="text-xs font-bold text-slate-800">{property.type === "Apartment" ? "2 BHK Flat" : property.type === "Hostel" ? "Shared Room" : "Office Bay"}</span>
                </div>
                <div className="border border-slate-150 p-3.5 rounded-2xl bg-white space-y-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase block">Built Area</span>
                  <span className="text-xs font-bold text-slate-800">1,250 sqft</span>
                </div>
                <div className="border border-slate-150 p-3.5 rounded-2xl bg-white space-y-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase block">Status</span>
                  <span className="text-xs font-bold text-emerald-600">Ready to Move</span>
                </div>
              </div>

            </div>

          </div>

          {/* Description & Detailed Amenities Section */}
          <div className="grid lg:grid-cols-12 gap-8 items-start pt-6 border-t border-slate-100">
            
            {/* Description, Amenities, Nearby (Left) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Description text */}
              <div className="space-y-3.5">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Overview & Description</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Located in the heart of {property.location.split(",")[0]}, this premium listing offers modern aesthetics, high-speed fiber internet accessibility, security safeguards, and prompt support. The layout is optimized to make maximal use of space and natural lighting.
                </p>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Rento guarantees 100% verification records for this property. The host handles repairs, and rent payment transactions are processed securely online with zero administrative brokerage additions.
                </p>
              </div>

              {/* Amenities Grid */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Furnishing & Amenities</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "High-Speed WiFi", icon: Wifi, color: "text-brand-indigo bg-brand-indigo/10" },
                    { label: "Covered Parking", icon: Car, color: "text-emerald-500 bg-emerald-50" },
                    { label: "Climate Control AC", icon: AirVent, color: "text-cyan-500 bg-cyan-50" },
                    { label: "CCTV Guard System", icon: Shield, color: "text-brand-purple bg-brand-purple/10" },
                    { label: "HD Smart TV Panel", icon: Tv, color: "text-purple-500 bg-purple-50" },
                    { label: "Double Bed / Wardrobes", icon: Building, color: "text-rose-500 bg-rose-50" }
                  ].map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3.5 border border-slate-150 rounded-2xl hover:border-slate-350 transition-all">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${amenity.color}`}>
                        <amenity.icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-750">{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby Access Checklist */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Access & Connectivity</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { facility: "Transit Station (Metro & Bus)", distance: "200m away" },
                    { facility: "Educational Centers (Colleges & Labs)", distance: "800m away" },
                    { facility: "Business Parks / Office Suites", distance: "1.2 km away" },
                    { facility: "Supermarket & General Store", distance: "150m away" }
                  ].map((loc, idx) => (
                    <div key={idx} className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{loc.facility}</span>
                      <span className="text-slate-400 shrink-0 font-bold">{loc.distance}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sticky Owner contact card (Right) */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
              
              {/* Host contact details */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-indigo/10 rounded-full blur-xl -z-10" />

                {/* Host Details info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-indigo flex items-center justify-center text-white font-extrabold text-lg">
                    {property.title.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Property Owner</span>
                    <h4 className="font-black text-white text-base">Arthur Dent</h4>
                    <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5">
                      ★ 4.9 • Verified Landlord
                    </span>
                  </div>
                </div>

                {/* Quick callback / chat triggers */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleContactAction("call")}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all text-white flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Phone className="w-4 h-4 text-brand-indigo" /> Call Host
                  </button>
                  <button
                    onClick={() => handleContactAction("message")}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all text-white flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4 text-brand-purple" /> Chat Now
                  </button>
                </div>

                {/* Schedule Visit Mock Form */}
                <form onSubmit={handleScheduleVisit} className="space-y-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Schedule Virtual / Physical Visit</p>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-black uppercase">Date</label>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-indigo font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-black uppercase">Time</label>
                      <input
                        type="time"
                        value={visitTime}
                        onChange={(e) => setVisitTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-indigo font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="w-full py-3.5 bg-brand-indigo hover:bg-brand-purple text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-brand-indigo/15 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    {isScheduling ? "Booking Appointment..." : "Request Inspection Visit"}
                  </button>
                </form>
              </div>

              {/* Vector Map Preview container block */}
              <div className="border border-slate-150 p-4 rounded-3xl space-y-3 bg-white">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Localized map position</p>
                <div className="h-40 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center">
                  
                  {/* Street map representation */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-35" />
                  <svg className="absolute inset-0 w-full h-full stroke-slate-800 stroke-1" fill="none">
                    <path d="M -10 40 L 400 120" />
                    <path d="M 80 -10 L 150 200" />
                  </svg>
                  
                  <div className="relative">
                    <span className="absolute inline-flex h-10 w-10 rounded-full bg-brand-indigo/20 animate-ping -left-3 -top-3" />
                    <div className="w-4 h-4 rounded-full bg-brand-indigo border-2 border-white flex items-center justify-center shadow-lg relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  </div>

                  <span className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[8px] text-slate-450 font-bold uppercase">
                    Approximate Location
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Similar Properties Listings Carousel */}
          <div className="lg:col-span-12 pt-8 border-t border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Similar listings nearby</h3>
              <span className="text-xs font-bold text-brand-indigo cursor-pointer hover:underline">See all verified rentals</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {similarProperties.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProperty(p);
                    setActiveImageIndex(0);
                    setVisitDate("");
                    setVisitTime("");
                  }}
                  className="bg-white border border-slate-150 hover:border-slate-350 p-4 rounded-3xl flex gap-4 cursor-pointer hover:shadow-lg transition-all group"
                >
                  <div className="w-28 h-24 rounded-2xl overflow-hidden shrink-0 relative bg-slate-900">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-tr ${p.gradient}`} />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase">
                        <span>{p.city}</span>
                        <span className="text-amber-500 flex items-center gap-0.5">★ {p.rating}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-brand-indigo transition-colors">
                        {p.title}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-emerald-600 font-extrabold uppercase">Zero Brokerage</span>
                      <span className="text-[10px] text-brand-indigo font-bold">View Listing →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
