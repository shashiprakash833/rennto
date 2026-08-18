"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, ShieldCheck, Star, MapPin, Sparkles, Building, ArrowRight, Heart, HeartOff, Zap
} from "lucide-react";
import PropertyDetailsModal from "../components/PropertyDetailsModal";

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
  image: string;
  mapX: number;
  mapY: number;
}

const VERIFIED_PROPERTIES: Property[] = [
  {
    id: 101,
    title: "Luxury Modern 3BHK Penthouse",
    location: "Koramangala 4th Block, Bangalore",
    city: "Bangalore",
    price: 850,
    rating: 4.95,
    distance: "1.0 km from Hub",
    type: "Apartment",
    verified: true,
    gradient: "from-brand-indigo via-brand-purple to-brand-pink",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    mapX: 55,
    mapY: 45,
  },
  {
    id: 102,
    title: "Executive Premium Boys PG & Suites",
    location: "Gachibowli Tech District, Hyderabad",
    city: "Hyderabad",
    price: 140,
    rating: 4.8,
    distance: "0.4 km from Hub",
    type: "Hostel",
    verified: true,
    gradient: "from-brand-indigo to-brand-purple",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
    mapX: 45,
    mapY: 65,
  },
  {
    id: 103,
    title: "Tech Hub Corporate Headquarters",
    location: "OMR Expressway, Chennai",
    city: "Chennai",
    price: 2100,
    rating: 4.9,
    distance: "1.8 km from Hub",
    type: "Commercial Space",
    verified: true,
    gradient: "from-brand-indigo to-brand-purple",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    mapX: 70,
    mapY: 55,
  },
  {
    id: 104,
    title: "Co-Living Premium Studio Suites",
    location: "Viman Nagar Business Hub, Pune",
    city: "Pune",
    price: 320,
    rating: 4.75,
    distance: "0.6 km from Hub",
    type: "Hostel",
    verified: true,
    gradient: "from-brand-indigo to-brand-purple",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    mapX: 30,
    mapY: 35,
  },
  {
    id: 105,
    title: "Modern Cozy Studio Apartment",
    location: "Andheri West Skyline, Mumbai",
    city: "Mumbai",
    price: 450,
    rating: 4.9,
    distance: "0.9 km from Hub",
    type: "Apartment",
    verified: true,
    gradient: "from-brand-purple to-brand-pink",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    mapX: 25,
    mapY: 50,
  },
  {
    id: 106,
    title: "Elegant Family Villa / House",
    location: "Indiranagar Ring Road, Bangalore",
    city: "Bangalore",
    price: 1250,
    rating: 4.98,
    distance: "1.1 km from Hub",
    type: "Apartment",
    verified: true,
    gradient: "from-brand-purple to-brand-pink",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    mapX: 58,
    mapY: 40,
  }
];

export default function VerifiedRentals() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "Hostel" | "Apartment" | "Commercial Space">("all");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filter listings
  const filteredProperties = useMemo(() => {
    return VERIFIED_PROPERTIES.filter(p => selectedCategory === "all" || p.type === selectedCategory);
  }, [selectedCategory]);

  const toggleFavorite = (id: number, title: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
      triggerToast(`Removed "${title}" from favorites.`);
    } else {
      setFavorites([...favorites, id]);
      triggerToast(`Added "${title}" to favorites!`);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage({ message: msg, type: "success" });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <section id="verified-rentals" className="py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-brand-indigo/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Featured <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Verified Rentals</span>
          </h2>
          
          <p className="text-lg text-slate-650 dark:text-slate-400 font-medium">
            Browse our hand-picked selection of premium, admin-verified properties. No brokers, no scams, just great spaces.
          </p>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex justify-start md:justify-center mb-12 overflow-x-auto max-w-full -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="inline-flex bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm min-w-max">
            {(["all", "Hostel", "Apartment", "Commercial Space"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  selectedCategory === cat
                    ? "bg-white dark:bg-slate-850 text-brand-indigo shadow-sm border border-slate-200/50 dark:border-slate-800"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
                }`}
              >
                {cat === "all" ? "All Rentals" : cat === "Hostel" ? "Hostels / PGs" : cat === "Apartment" ? "Apartments" : "Commercial Spaces"}
              </button>
            ))}
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProperties.map((property, idx) => {
              const isFav = favorites.includes(property.id);
              return (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  className="group relative rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-850 overflow-hidden hover:shadow-xl dark:hover:shadow-slate-950/65 transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-purple/30 dark:hover:border-brand-purple/20"
                >
                  
                  {/* Glowing Animated Outer Border Effect */}
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none -z-10" />
                  <div className="absolute inset-[1px] bg-white dark:bg-slate-900 rounded-[15px] pointer-events-none -z-10" />

                  {/* Image/Gradient Canvas */}
                  <div className="h-40 overflow-hidden relative">
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="w-full h-full relative"
                    >
                      <img 
                        src={property.image} 
                        alt={property.title} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-900/10 to-slate-950/40" />
                    </motion.div>

                    {/* Non-zooming Badge & Button Overlay */}
                    <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                      {/* Top Action Tags */}
                      <div className="flex justify-between items-start w-full pointer-events-auto z-10">
                        <span className="px-2.5 py-1 bg-brand-indigo text-white text-[9px] font-black tracking-wider uppercase rounded-md flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 fill-white text-brand-indigo" />
                          Verified
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(property.id, property.title);
                          }}
                          className={`p-1.5 rounded-lg backdrop-blur transition-all shadow-sm ${
                            isFav
                              ? "bg-brand-pink text-white"
                              : "bg-white/80 dark:bg-slate-950/80 text-slate-650 dark:text-slate-300 hover:text-brand-pink"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                        </button>
                      </div>

                      {/* Floating Category Indicator */}
                      <span className="self-start px-2 py-0.5 bg-black/45 backdrop-blur-sm border border-white/10 text-[8px] font-extrabold text-white uppercase tracking-widest rounded-md z-10">
                        {property.type}
                      </span>
                    </div>
                  </div>

                  {/* Details Block */}
                  <div className="p-4 space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                          {property.city} • {property.distance}
                        </span>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-[10px] text-amber-600 dark:text-amber-400 font-bold border border-amber-100/50 dark:border-amber-900/30">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{property.rating}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-brand-indigo transition-colors line-clamp-1">
                          {property.title}
                        </h3>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold line-clamp-1">
                        {property.location}
                      </p>
                    </div>

                    {/* Bottom Row Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-black uppercase tracking-wider">Zero Brokerage</span>

                      <button
                        onClick={() => setSelectedProperty(property)}
                        className="px-3.5 py-2 bg-brand-indigo hover:bg-brand-purple text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm shadow-brand-indigo/5 hover:shadow hover:shadow-brand-purple/15 transition-all flex items-center gap-1"
                      >
                        View Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Global Embedded Trust Footer */}
        <div className="mt-16 bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800 rounded-[2rem] p-8 text-center max-w-4xl mx-auto shadow-sm">
          <div className="grid md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800">
            <div className="pb-6 md:pb-0 space-y-1">
              <span className="text-2xl font-black text-brand-indigo">100%</span>
              <p className="text-sm font-bold text-slate-850 dark:text-slate-200">Admin Quality Audited</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Every photo is verified on-site</p>
            </div>
            <div className="py-6 md:py-0 md:px-4 space-y-1">
              <span className="text-2xl font-black text-brand-purple">0%</span>
              <p className="text-sm font-bold text-slate-850 dark:text-slate-200">Broker Commissions</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Direct owner tenant communication</p>
            </div>
            <div className="pt-6 md:pt-0 space-y-1">
              <span className="text-2xl font-black text-brand-indigo">24/7</span>
              <p className="text-sm font-bold text-slate-850 dark:text-slate-200">Ecosystem Protection</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Instant report & fraud blocking</p>
            </div>
          </div>
        </div>

      </div>

      {/* Property Details Modal Overlay */}
      <AnimatePresence>
        {selectedProperty && (
          <PropertyDetailsModal
            property={selectedProperty as any}
            allProperties={VERIFIED_PROPERTIES as any}
            onClose={() => setSelectedProperty(null)}
            onSelectProperty={setSelectedProperty as any}
            setToast={(t) => t && triggerToast(t.message)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-brand-pink fill-current animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wide">{toastMessage.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
