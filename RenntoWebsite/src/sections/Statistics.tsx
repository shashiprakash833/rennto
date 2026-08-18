"use client";

import { useState, useEffect } from "react";

interface StatProps {
  value: number;
  suffix: string;
  label: string;
}

function Counter({ value, suffix, label }: StatProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalDuration = 2500; // 2.5 seconds
    const startTime = performance.now();
    let animationFrameId: number;

    const updateCount = (now: number) => {
      const progress = Math.min((now - startTime) / totalDuration, 1);
      setDisplayValue(Math.floor(progress * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  return (
    <div className="text-center p-6 bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 rounded-[2rem] shadow-xs hover:shadow-lg transition-all duration-300">
      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
        <span>{displayValue.toLocaleString()}</span>
        <span className="text-brand-indigo">{suffix}</span>
      </h3>
      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-2">
        {label}
      </p>
    </div>
  );
}

export default function Statistics() {
  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[20rem] bg-brand-indigo/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Counter value={5000} suffix="+" label="Verified Listings" />
          <Counter value={1200} suffix="+" label="Property Owners" />
          <Counter value={10000} suffix="+" label="Tenant Searches" />
        </div>
      </div>
    </section>
  );
}
