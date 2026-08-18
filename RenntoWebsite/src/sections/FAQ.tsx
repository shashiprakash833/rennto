"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: "faq-1",
    question: "How does property verification work?",
    answer: "Every listing uploaded by an owner undergoes strict inspection. Our verification team conducts on-site audits, captures true-to-life photographs, and checks land registration deeds. Once satisfied, we mark the property with a green 'Verified' badge."
  },
  {
    id: "faq-2",
    question: "Is Rento free for tenants?",
    answer: "Yes! Rento is completely free for tenants to search, discover, and directly contact verified owners. There are zero broker commissions or hidden fees."
  },
  {
    id: "faq-3",
    question: "How do owners list properties?",
    answer: "Owners can register their property details, upload photos, and upload deed documents directly from their owner dashboard. Our verification team then schedules a brief physical inspection before taking the listing live."
  },
  {
    id: "faq-4",
    question: "How can I contact an owner?",
    answer: "Once you find a verified property, you can instantly message the owner or request an inspection schedule directly through the secure in-app chat module."
  },
  {
    id: "faq-5",
    question: "How does Rento ensure trust?",
    answer: "Rento builds trust by verifying official KYC identity credentials of both owners and tenants, auditing properties on-site, and holding security deposits safely in escrow bank channels."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <section id="faq" className="py-24 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-900 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Frequently <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Asked Questions</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
            Clear, detailed information about trust, verification, and renting on Rento.
          </p>
        </div>

        {/* Accordions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-2"
        >
          <div className="w-full space-y-2">
            {faqs.map((faq) => {
              const isOpen = openIndex === faq.id;
              return (
                <div key={faq.id} className="border-b border-slate-105 dark:border-slate-800 py-2">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full text-left font-extrabold text-slate-900 dark:text-white hover:text-brand-purple hover:no-underline text-base sm:text-lg flex items-center justify-between gap-4 py-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-brand-indigo shrink-0" />
                      <span>{faq.question}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-455 transition-transform duration-300 ${isOpen ? "rotate-185" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-semibold pl-8 pb-4">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </section>
  );
}