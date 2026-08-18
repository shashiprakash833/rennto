"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, DollarSign, Building, Sparkles, Star, Heart, CheckCircle2, Navigation, Compass, LayoutGrid, Info
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

const INITIAL_PROPERTIES: Property[] = [
  {
    id: 1,
    title: "Luxury Student Hostel / PG",
    location: "Gachibowli, Hyderabad",
    city: "Hyderabad",
    price: 120,
    rating: 4.8,
    distance: "0.8 km",
    type: "Hostel",
    verified: true,
    gradient: "from-brand-indigo to-brand-purple",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
    mapX: 45,
    mapY: 65,
  },
  {
    id: 2,
    title: "Premium 2BHK Apartment",
    location: "Koramangala, Bangalore",
    city: "Bangalore",
    price: 650,
    rating: 4.9,
    distance: "1.5 km",
    type: "Apartment",
    verified: true,
    gradient: "from-brand-indigo via-brand-purple to-brand-pink",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    mapX: 55,
    mapY: 45,
  },
  {
    id: 3,
    title: "Commercial Office Space",
    location: "OMR, Chennai",
    city: "Chennai",
    price: 1800,
    rating: 4.7,
    distance: "2.1 km",
    type: "Commercial Space",
    verified: true,
    gradient: "from-brand-indigo to-brand-purple",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    mapX: 70,
    mapY: 55,
  },
  {
    id: 4,
    title: "Co-Living Space & Suites",
    location: "Viman Nagar, Pune",
    city: "Pune",
    price: 250,
    rating: 4.6,
    distance: "0.5 km",
    type: "Hostel",
    verified: true,
    gradient: "from-brand-purple to-brand-pink",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    mapX: 30,
    mapY: 35,
  },
  {
    id: 5,
    title: "Furnished Family Home",
    location: "Andheri West, Mumbai",
    city: "Mumbai",
    price: 950,
    rating: 4.9,
    distance: "1.1 km",
    type: "Apartment",
    verified: true,
    gradient: "from-brand-indigo via-brand-purple to-brand-pink",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    mapX: 25,
    mapY: 50,
  },
  {
    id: 6,
    title: "Premium Retail Shop",
    location: "Indiranagar, Bangalore",
    city: "Bangalore",
    price: 1500,
    rating: 4.7,
    distance: "1.2 km",
    type: "Commercial Space",
    verified: true,
    gradient: "from-brand-indigo to-brand-purple",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    mapX: 58,
    mapY: 40,
  }
];

interface PropertyDiscoveryProps {
  setToast: (toast: { message: string; type: "success" | "error" } | null) => void;
}

export default function PropertyDiscovery({ setToast }: PropertyDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<"all" | "Hyderabad" | "Bangalore" | "Chennai" | "Mumbai" | "Pune">("all");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "Hostel" | "Apartment" | "Commercial Space">("all");
  const [budgetLimit, setBudgetLimit] = useState<number>(2000);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<number | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter listen city events
  useEffect(() => {
    const handleFilterCity = (e: Event) => {
      const customEvent = e as CustomEvent<{ city: string }>;
      if (customEvent.detail && customEvent.detail.city) {
        setSelectedCity(customEvent.detail.city as "all" | "Hyderabad" | "Bangalore" | "Chennai" | "Mumbai" | "Pune");
      }
    };
    window.addEventListener("rento-filter-city", handleFilterCity);
    return () => {
      window.removeEventListener("rento-filter-city", handleFilterCity);
    };
  }, []);

  // Filter listings based on criteria
  const filteredProperties = useMemo(() => {
    return INITIAL_PROPERTIES.filter((property) => {
      const matchesCity = selectedCity === "all" || property.city === selectedCity;
      const matchesCategory = selectedCategory === "all" || property.type === selectedCategory;
      const matchesSearch =
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCity && matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCity, selectedCategory]);

  const toggleFavorite = (id: number, title: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
      setToast({
        message: `Removed "${title}" from favorites.`,
        type: "success"
      });
    } else {
      setFavorites([...favorites, id]);
      setToast({
        message: `Added "${title}" to favorites!`,
        type: "success"
      });
    }
  };



  return (
    <section id="search-properties" className="py-20 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center lg:text-left mb-10 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Find Your Next <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Home, Hostel or Commercial Space</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm max-w-2xl">
            Explore verified rental spaces trusted by owners and approved by Rento.
          </p>
        </div>

        {/* PREMIUM SEARCH CONSOLE CONTAINER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-xl dark:shadow-slate-950/40 mb-8 space-y-6">
          <div className="grid md:grid-cols-12 gap-4 items-center">
            
            {/* Location Query Input */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Where</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search locality or landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-indigo focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Category Dropdown Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Property Type</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const val = e.target.value as "all" | "Hostel" | "Apartment" | "Commercial Space";
                    setSelectedCategory(val);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-indigo focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Hostel">Hostel / PG</option>
                  <option value="Apartment">Apartment / Flat</option>
                  <option value="Commercial Space">Commercial Space</option>
                </select>
              </div>
            </div>

            {/* Reset Filter Button */}
            <div className="md:col-span-3 pt-5">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCity("all");
                  setSelectedCategory("all");
                  setBudgetLimit(2000);
                }}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 font-extrabold text-xs rounded-xl transition-all active:scale-98"
              >
                Reset Filters
              </button>
            </div>

          </div>

          {/* SUGGESTION CITY PILLS */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2">Quick Cities:</span>
            {(["all", "Hyderabad", "Bangalore", "Chennai", "Mumbai", "Pune"] as const).map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  selectedCity === city
                    ? "bg-brand-indigo border-brand-indigo text-white shadow-md shadow-brand-indigo/15"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-750 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {city === "all" ? "All Locations" : city}
              </button>
            ))}
          </div>
        </div>

        {/* PROPERTIES LISTINGS WORKSPACE */}
        <div className="space-y-6">
          
          {/* Filter count summary */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 dark:text-slate-500">
            <span>Showing {filteredProperties.length} matches found</span>
            <span className="flex items-center gap-1"><LayoutGrid className="w-3.5 h-3.5" /> Grid View</span>
          </div>

          {isLoading ? (
            // Loading Shimmer Skeletons
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col animate-pulse">
                    <div className="h-40 bg-slate-100 dark:bg-slate-800" />
                    <div className="p-5 flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                          <div className="h-3 w-8 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                        <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
                      </div>
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                        <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center mx-auto text-slate-450">
                  <Info className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white">No properties match your filter</h4>
                <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm mx-auto font-medium">
                  Try adjusting your budget range slider, clearing the text search box, or selecting &quot;All Locations&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredProperties.map((property) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setHoveredPropertyId(property.id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                      className={`bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-slate-950/40 transition-all duration-300 flex flex-col group relative ${
                        hoveredPropertyId === property.id ? "border-brand-indigo dark:border-brand-indigo -translate-y-1" : "border-slate-150 dark:border-slate-800"
                      }`}
                    >
                      {/* Image Mock Box with Zoom on Hover */}
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

                        {/* Card Badge and Button Overlay (Non-zooming) */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                          {/* Verified badge & Favorite action */}
                          <div className="flex justify-between items-start w-full pointer-events-auto z-10">
                            {property.verified ? (
                              <span className="px-2.5 py-1 bg-brand-indigo text-white text-[9px] font-bold rounded-md flex items-center gap-1 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur text-white text-[9px] font-bold rounded-md">
                                Host Listing
                              </span>
                            )}

                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              whileHover={{ scale: 1.1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(property.id, property.title);
                              }}
                              className={`p-2 rounded-full backdrop-blur transition-all pointer-events-auto active:scale-90 ${
                                favorites.includes(property.id)
                                  ? "bg-brand-pink text-white shadow-md shadow-brand-pink/20"
                                  : "bg-white/80 dark:bg-slate-950/80 hover:bg-white text-slate-650 dark:text-slate-400 hover:text-brand-pink"
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${favorites.includes(property.id) ? "fill-current" : ""}`} />
                            </motion.button>
                          </div>

                          {/* Category tag */}
                          <span className="self-start px-2 py-0.5 bg-black/45 backdrop-blur-sm border border-white/10 text-[8px] font-black text-white uppercase tracking-wider rounded z-10">
                            {property.type}
                          </span>
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wide">
                              {property.city} • {property.distance}
                            </span>
                            <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{property.rating}</span>
                            </div>
                          </div>

                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-brand-indigo transition-colors">
                            {property.title}
                          </h4>
                          <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                            {property.location}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-black uppercase tracking-wider">Zero Brokerage</span>
                          </div>

                          <button
                            onClick={() => setSelectedProperty(property)}
                            className="px-4 py-2 bg-brand-indigo/10 dark:bg-brand-indigo/20 hover:bg-brand-indigo text-brand-indigo hover:text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

          </div>

      </div>

      {/* Property Details Modal Overlay */}
      <AnimatePresence>
        {selectedProperty && (
          <PropertyDetailsModal
            property={selectedProperty as any}
            allProperties={INITIAL_PROPERTIES as any}
            onClose={() => setSelectedProperty(null)}
            onSelectProperty={setSelectedProperty as any}
            setToast={setToast}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
