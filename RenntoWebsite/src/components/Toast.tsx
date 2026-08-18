"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md transition-colors duration-300 ${
          type === "success"
            ? "bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-100 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300"
            : "bg-red-50/90 dark:bg-red-950/90 border-red-100 dark:border-red-900/60 text-red-800 dark:text-red-300"
        }`}
      >
        <div className="flex-shrink-0">
          {type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-605 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-605 dark:text-red-400" />
          )}
        </div>
        
        <p className="text-sm font-bold tracking-tight">{message}</p>

        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-205 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  );
}
