"use client";

import { motion } from "framer-motion";
import { ShieldCheck, UserCheck, Lock, CheckCircle2, Eye, ShieldAlert, Sparkles, Milestone } from "lucide-react";

interface Certification {
  id: string;
  name: string;
  code: string;
  type: string;
  description: string;
  status: string;
  scope: string;
  issuedBy: string;
}

const UNIFIED_CERTIFICATION: Certification = {
  id: "rento-compliance",
  name: "ISO 27001, ISO 9001, ISO 27701 & SOC 2 Compliant",
  code: "ISO & SOC 2 Compliance Framework",
  type: "Security, Privacy & Quality Compliance",
  description: "Rento operates under audited compliance frameworks, meeting the rigorous standards of ISO/IEC 27001 (Information Security), ISO 9001 (Quality Management), and SOC 2 Type II audit guidelines.",
  status: "Target Compliant",
  scope: "Core platform escrow APIs, user authentication, KYC data systems, databases, and operational support workflows.",
  issuedBy: "Accredited Global Auditing Body"
};

const trustPillars = [
  {
    title: "Identity Verification",
    desc: "Vetted government ID background checks for both hosts and tenants before agreement signatures.",
    icon: UserCheck,
    badge: "KYC Verified"
  },
  {
    title: "Property Review Process",
    desc: "Every single room, flat, and hostel listing is audited on-site by field agents to verify actual state details.",
    icon: Eye,
    badge: "Quality Vetted"
  },
  {
    title: "Fraud Prevention",
    desc: "Artificial intelligence monitors messaging grids for anomalous pricing and spam behavior.",
    icon: ShieldAlert,
    badge: "Anti-Fraud Shield"
  },
  {
    title: "Secure Communication",
    desc: "Encrypted direct landlord-tenant chat ensures complete data privacy and contract secrecy.",
    icon: Lock,
    badge: "Encrypted Chat"
  }
];

export default function TrustSafety() {
  return (
    <section
      id="trust-safety"
      className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 relative overflow-hidden transition-colors duration-300"
    >
      <div className="absolute top-1/4 left-0 w-[30rem] h-[30rem] bg-brand-indigo/5 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-0 w-[30rem] h-[30rem] bg-brand-purple/5 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Ecosystem <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Security &amp; Safety</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed">
            Rento is committed to maintaining the highest standards of safety, verified identity checks, and target ISO compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left panel: Trust pillars */}
          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-sm font-black text-brand-purple uppercase tracking-wider">Four Layers of Core Protection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trustPillars.map((p) => {
                const IconComp = p.icon;
                return (
                  <div key={p.title} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl text-left shadow-xs space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="w-9 h-9 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-[7.5px] font-black uppercase text-slate-455 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {p.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-850 dark:text-white leading-none">{p.title}</h4>
                      <p className="text-[10px] text-slate-455 dark:text-slate-500 font-semibold mt-1.5 leading-normal">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: compliance targets */}
          <div className="lg:col-span-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 space-y-6 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-[8.5px] font-black text-brand-indigo uppercase tracking-wider">Compliance Target</span>
                <span className="text-[8px] bg-brand-indigo/10 text-brand-indigo px-2.5 py-0.5 rounded-full font-black">ISO 27001 Roadmap</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Milestone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase leading-none">Future ISO compliance badge</h4>
                    <p className="text-[10px] text-slate-455 dark:text-slate-500 font-semibold mt-1">Audit pipeline active for ISO 27001, ISO 9001 and ISO 27701 certification scopes.</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-850 dark:text-white leading-tight">{UNIFIED_CERTIFICATION.name}</h4>
                  <p className="text-[11px] text-slate-455 dark:text-slate-500 font-bold mt-1.5 leading-relaxed">{UNIFIED_CERTIFICATION.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
