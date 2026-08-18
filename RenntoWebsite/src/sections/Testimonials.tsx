"use client";

import { motion } from "framer-motion";
import { Star, Quote, CheckCircle2 } from "lucide-react";

interface TestimonialProps {
  id: string;
  name: string;
  role: string;
  type: string;
  quote: string;
  stars: number;
  avatar: string;
}

const testimonials: TestimonialProps[] = [
  {
    id: "review-1",
    name: "Fouzia Tasneem",
    role: "Student @ UC Berkeley",
    type: "Verified Tenant",
    quote: "Rento made finding verified hostels near my campus extremely easy. The photos were exactly as advertised and direct owner chat meant zero brokerage hassle.",
    stars: 5,
    avatar: "FT",
  },
  {
    id: "review-2",
    name: "Vani Udatha",
    role: "Real Estate Investor",
    type: "Property Owner",
    quote: "The verification badges give applicants instant confidence. My apartment listings reached full occupancy within 10 days, and inquiries are direct and clear.",
    stars: 5,
    avatar: "VU",
  },
  {
    id: "review-3",
    name: "Jayashankar Kanigiri",
    role: "Property Manager, DevStudio",
    type: "Property Manager",
    quote: "Managing listings has never been this seamless. Extremely transparent verification process, direct owner-tenant chats, and secure contracts.",
    stars: 5,
    avatar: "JK",
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 transition-colors duration-300 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Trusted by <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Owners &amp; Tenants</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
            Read how Rento brings security, efficiency, and clarity to daily property transitions.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((rev, idx) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-lg dark:hover:shadow-slate-950/50 transition-shadow relative"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-0.5">
                    {[...Array(rev.stars)].map((_, i) => (
                      <Star key={`star-${rev.id}-${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-slate-100 dark:text-slate-800" />
                </div>

                <p className="text-slate-655 dark:text-slate-350 text-sm leading-relaxed font-semibold">
                  “{rev.quote}”
                </p>
              </div>

              {/* Reviewer Meta */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center font-black text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-850">
                  {rev.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1">
                    {rev.name}
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/40" />
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wider mt-0.5">
                    {rev.role} • <span className="text-blue-600 dark:text-blue-400 font-extrabold">{rev.type}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}