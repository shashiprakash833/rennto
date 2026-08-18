"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Shield, CheckCircle, Scale, ScrollText } from "lucide-react";
import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";
import SignInModal from "@/components/SignInModal";
import Toast from "@/components/Toast";
import { UserContext } from "@/app/page";
import { AnimatePresence } from "framer-motion";

const SECTIONS = [
  { id: "introduction", title: "1. Introduction", icon: FileText },
  { id: "eligibility", title: "2. Eligibility & Accounts", icon: CheckCircle },
  { id: "no-brokerage", title: "3. No Brokerage Policy", icon: Shield },
  { id: "payments", title: "4. Payments & Fees", icon: Scale },
  { id: "obligations", title: "5. User Obligations", icon: ScrollText },
  { id: "liability", title: "6. Liability & Disputes", icon: Shield },
];

export default function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<UserContext | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Sync class theme settings on root element
  useEffect(() => {
    // Detect system or default to dark/light
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSignInSuccess = (email: string, selectedRole: "tenant" | "owner") => {
    setUser({ email, role: selectedRole });
    setToast({
      message: `Signed in successfully as ${email}!`,
      type: "success",
    });
  };

  const handleSignOut = () => {
    setUser(null);
    setToast({
      message: "You have signed out successfully.",
      type: "success",
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = el.offsetTop - 120;
      window.scrollTo({
        top: offset,
        behavior: "smooth",
      });
      setActiveSection(id);
    }
  };

  return (
    <main className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
      <Navbar
        user={user}
        setIsSignInModalOpen={setIsSignInModalOpen}
        onSignOut={handleSignOut}
        theme={theme}
        setTheme={handleThemeChange}
      />

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Banner Card */}
        <div className="relative overflow-hidden bg-slate-950 rounded-xl p-4 sm:p-5 mb-6 border border-slate-900 shadow-lg shadow-brand-indigo/5">
          {/* Subtle glow blobs behind dark backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/15 via-brand-purple/8 to-transparent pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-indigo/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-brand-indigo/20 text-brand-indigo border border-brand-indigo/30 uppercase tracking-wider mb-2.5">
              Legal Documents
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1.5">
              Terms & Conditions
            </h1>
            <p className="text-slate-300 text-xs font-medium leading-relaxed max-w-2xl">
              Please read these terms and conditions carefully before using the Rennto platform. These terms govern your access to and use of our brokerage-free rental platform.
            </p>
            <div className="mt-3 flex items-center gap-3 text-[9px] font-bold text-slate-500">
              <span>Effective Date: June 10, 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <span>Version 1.2</span>
            </div>
          </div>
        </div>

        {/* Mobile Section Outline Selector (Horizontal scroll bar visible on mobile only) */}
        <div className="lg:hidden mb-6 overflow-x-auto max-w-full -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="inline-flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-sm min-w-max gap-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-left text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? "bg-brand-indigo/10 dark:bg-brand-indigo/20 text-brand-indigo border-b-2 border-brand-indigo"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{section.title.split(".")[1].trim()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sticky Left Sidebar Navigation */}
          <aside className="lg:col-span-4 sticky top-28 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800/80 shadow-md shadow-slate-100 dark:shadow-none hidden lg:block">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-2">
              Document Outline
            </h3>
            <div className="space-y-0.5">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[11px] font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-brand-indigo/10 dark:bg-brand-indigo/20 text-brand-indigo border-l-4 border-brand-indigo"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{section.title}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Content Area */}
          <article className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-md shadow-slate-100 dark:shadow-none">
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
              
              {/* Introduction */}
              <section id="introduction" className="scroll-mt-32 space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                <div className="flex items-center gap-2 text-brand-indigo">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">1. Introduction</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    Welcome to <strong>Rennto</strong> ("Platform", "we", "us", or "our"). These Terms & Conditions govern your access to and use of our website, mobile application, and services.
                  </p>
                  <p>
                    Rennto operates as a high-trust, <strong>brokerage-free rental marketplace</strong>. We connect property owners ("Owners") and tenants ("Tenants") directly. We are not a real estate agency, broker, or insurer.
                  </p>
                  <p>
                    By registering, browsing, or using the Platform, you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, you must not access or use the Platform.
                  </p>
                </div>
              </section>

              {/* Eligibility & Accounts */}
              <section id="eligibility" className="scroll-mt-32 space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                <div className="flex items-center gap-2 text-brand-indigo">
                  <CheckCircle className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">2. Eligibility & Account Security</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    To use Rennto, you must be at least 18 years old and capable of entering into legally binding contracts under applicable law.
                  </p>
                  <p>
                    During registration, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your credentials and are fully liable for all activities that occur under your account.
                  </p>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                    <span className="font-extrabold text-amber-500 uppercase tracking-wider block mb-1">Important Account Notice</span>
                    We perform automated checks and admin verifications. If any information provided is found to be false, inaccurate, or misleading, we reserve the right to suspend or terminate your account immediately.
                  </div>
                </div>
              </section>

              {/* No Brokerage Policy */}
              <section id="no-brokerage" className="scroll-mt-32 space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                <div className="flex items-center gap-2 text-brand-indigo">
                  <Shield className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">3. Brokerage-Free & Trust Guarantee</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    Rennto is strictly <strong>brokerage-free</strong>. We do not charge or collect brokerage commissions from owners or tenants. Any attempt by a third party to demand a brokerage fee or commission through our Platform should be reported immediately to support@rennto.com.
                  </p>
                  <p>
                    To maintain high trust, we require:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Verification of ownership documents for landlords listing properties.</li>
                    <li>Identity verification (Aadhaar, Passport, or government ID) for tenants.</li>
                    <li>Digital tenancy agreements signed securely on the platform.</li>
                  </ul>
                </div>
              </section>

              {/* Payments & Fees */}
              <section id="payments" className="scroll-mt-32 space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                <div className="flex items-center gap-2 text-brand-indigo">
                  <Scale className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">4. Payments, Security Deposits & Service Fees</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    Rent and security deposits can be paid and collected through the Rennto <strong>Smart Collect Toolkit</strong>.
                  </p>
                  <p>
                    While we do not charge brokerage, we may charge nominal transaction fees or service fees for optional value-added services, such as:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Digital rental agreement drafting and e-signing.</li>
                    <li>Premium tenant background checks.</li>
                    <li>Payment processing gate charge for credit cards.</li>
                  </ul>
                  <p>
                    All fees will be clearly displayed before you initiate the transaction. Fees are non-refundable once the service has been rendered.
                  </p>
                </div>
              </section>

              {/* User Obligations */}
              <section id="obligations" className="scroll-mt-32 space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                <div className="flex items-center gap-2 text-brand-indigo">
                  <ScrollText className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">5. User Obligations</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    <strong>For Owners:</strong> You represent that you are the lawful owner or authorized sub-lessor of the listed property, and that listing the property does not violate any local laws, housing society rules, or existing leases.
                  </p>
                  <p>
                    <strong>For Tenants:</strong> You agree to maintain the property in a clean and safe condition, pay rent on time, and comply with all terms agreed upon in the signed rental agreement.
                  </p>
                  <p>
                    Users must not bypass the Platform's safety systems or coordinate payments outside the Platform to evade security and verification steps.
                  </p>
                </div>
              </section>

              {/* Liability & Disputes */}
              <section id="liability" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-2 text-brand-indigo">
                  <Shield className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">6. Limitation of Liability & Dispute Resolution</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    Rennto acts solely as an intermediary matching service. We are not responsible for the condition of the properties, the behavior of owners or tenants, or the fulfillment of signed agreements.
                  </p>
                  <p>
                    To the maximum extent permitted by law, Rennto shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Platform.
                  </p>
                  <p>
                    Any disputes between Owners and Tenants must be resolved in accordance with the signed rental agreement or applicable local housing laws.
                  </p>
                  <p className="pt-4 text-xs font-semibold text-slate-500">
                    If you have any questions or reports regarding these Terms, please contact support@rennto.com.
                  </p>
                </div>
              </section>

            </div>
          </article>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Auth Modals */}
      <AnimatePresence>
        {isSignInModalOpen && (
          <SignInModal
            isOpen={isSignInModalOpen}
            onClose={() => setIsSignInModalOpen(false)}
            onSignInSuccess={handleSignInSuccess}
          />
        )}
      </AnimatePresence>

      {/* Global Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
