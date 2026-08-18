"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { UserContext } from "@/app/page";

interface CTAProps {
  user: UserContext | null;
  setIsSignInModalOpen: (open: boolean) => void;
}

export default function CTA({ user, setIsSignInModalOpen }: CTAProps) {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Background animated gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-gradient-to-tr from-brand-indigo/10 via-brand-purple/15 to-brand-pink/5 rounded-full blur-[160px] -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dynamic Card Box */}
        <div className="relative rounded-[3rem] bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-indigo dark:from-brand-indigo/20 dark:via-brand-purple/15 dark:to-brand-indigo/20 border border-brand-indigo/20 dark:border-brand-purple/20 text-white p-8 sm:p-12 md:p-16 text-center overflow-hidden shadow-2xl">
          
          {/* Subtle grid patterns */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem] -z-10" />

          {/* Icon Header */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 flex items-center justify-center text-white backdrop-blur shadow-sm animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Ready to Find or List Your Next Property?
              </h2>
              <p className="text-sm sm:text-base text-slate-100 dark:text-slate-350 font-semibold max-w-lg mx-auto leading-relaxed">
                Join thousands of verified owners and tenants connecting on India's zero brokerage prop-tech ecosystem.
              </p>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link
                href="#verified-rentals"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-indigo font-black rounded-2xl hover:bg-slate-50 active:scale-95 transition-all text-sm shadow-md cursor-pointer"
              >
                Start Exploring
              </Link>
              <Link
                href="#download-app"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 font-black rounded-2xl transition-all text-white text-sm cursor-pointer"
              >
                List Your Property
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}