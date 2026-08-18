"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Eye, Share2, ShieldCheck, Cookie, UserX } from "lucide-react";
import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";
import SignInModal from "@/components/SignInModal";
import Toast from "@/components/Toast";
import { UserContext } from "@/app/page";
import { AnimatePresence } from "framer-motion";

const SECTIONS = [
  { id: "collection", title: "1. Information We Collect", icon: Database },
  { id: "usage", title: "2. How We Use Data", icon: Eye },
  { id: "sharing", title: "3. How We Share Data", icon: Share2 },
  { id: "security", title: "4. Security Practices", icon: ShieldCheck },
  { id: "cookies", title: "5. Cookies & Tracking", icon: Cookie },
  { id: "rights", title: "6. Your Rights & Choice", icon: UserX },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("collection");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<UserContext | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Sync class theme settings on root element
  useEffect(() => {
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
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/15 via-brand-pink/8 to-transparent pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-purple/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-brand-purple/20 text-brand-purple border border-brand-purple/30 uppercase tracking-wider mb-2.5">
              Privacy Policy
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1.5">
              Privacy Policy
            </h1>
            <p className="text-slate-300 text-xs font-medium leading-relaxed max-w-2xl">
              At Rennto, we prioritize the protection and confidentiality of your personal data. Read how we collect, use, store, and safeguard your details.
            </p>
            <div className="mt-3 flex items-center gap-3 text-[9px] font-bold text-slate-500">
              <span>Effective Date: June 10, 2026</span>
              <span className="w-1 h-1 rounded-full bg-slate-800" />
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
                      ? "bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border-b-2 border-brand-purple"
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
                        ? "bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border-l-4 border-brand-purple"
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
              
              {/* Collection */}
              <section id="collection" className="scroll-mt-32 space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                <div className="flex items-center gap-2 text-brand-purple">
                  <Database className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">1. Information We Collect</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    In order to operate our brokerage-free high-trust marketplace, we collect various types of information from our users:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Account Data:</strong> We collect your name, email address, phone number, and password hash when you sign up.
                    </li>
                    <li>
                      <strong>Verification Data:</strong> For safety verification, we collect official government IDs, background details, employment/college references, and property ownership deeds (for owners).
                    </li>
                    <li>
                      <strong>Property Listings:</strong> Details about properties listed by owners, including photos, descriptions, rental values, and amenities.
                    </li>
                    <li>
                      <strong>Payment and Billing:</strong> For secure rent collection via our Smart Collect Toolkit, we process transactions securely through PCI-DSS compliant partner gateways.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Usage */}
              <section id="usage" className="scroll-mt-32 space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                <div className="flex items-center gap-2 text-brand-purple">
                  <Eye className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">2. How We Use Data</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    Rennto processes personal information for the following business purposes:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Connecting Users:</strong> Facilitating communication and transactions between owners and tenants.</li>
                    <li><strong>Safety Audits:</strong> Conducting rigorous admin verification to ensure security on our platform.</li>
                    <li><strong>Digital Agreements:</strong> Preparing and processing rental agreements securely.</li>
                    <li><strong>Rent Tracking:</strong> Tracking collections and displaying payment dashboards.</li>
                    <li><strong>Customer Support:</strong> Providing prompt responses to user queries or disputes.</li>
                  </ul>
                </div>
              </section>

              {/* Sharing */}
              <section id="sharing" className="scroll-mt-32 space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                <div className="flex items-center gap-2 text-brand-purple">
                  <Share2 className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">3. How We Share Data</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    We value your privacy and do not sell your personal data. We only share information in the following limited circumstances:
                  </p>
                  <p>
                    <strong>Between Tenant and Owner:</strong> Once a Tenant initiates a rental request or an Owner accepts a tenant, key contact details and verification status are shared to finalize the rental agreement.
                  </p>
                  <p>
                    <strong>Service Providers:</strong> We share information with trusted third-party providers (payment gateways, identity verification providers, server hosts) who assist in running the Platform.
                  </p>
                  <p>
                    <strong>Legal Requirements:</strong> We may disclose information if required to comply with law enforcement requests, regulatory compliance audits, or judicial processes.
                  </p>
                </div>
              </section>

              {/* Security */}
              <section id="security" className="scroll-mt-32 space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                <div className="flex items-center gap-2 text-brand-purple">
                  <ShieldCheck className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">4. Security Practices</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    Rennto implements standard technical, physical, and administrative security controls to protect your data. All communication is encrypted via TLS (HTTPS). Sensitive documentation (e.g. Identity documents) is stored securely with restricted access controls.
                  </p>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-500 font-medium">
                    Please remember that no method of transmission over the internet or storage system is 100% secure. While we take every effort to secure your data, we cannot guarantee absolute security.
                  </div>
                </div>
              </section>

              {/* Cookies */}
              <section id="cookies" className="scroll-mt-32 space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                <div className="flex items-center gap-2 text-brand-purple">
                  <Cookie className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">5. Cookies & Tracking Technologies</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    We use cookies and similar tracking tools (such as local storage) to improve your experience on our platform:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Essential Cookies:</strong> Used to maintain user sessions and authentication status.</li>
                    <li><strong>Performance Cookies:</strong> Used to understand site speed, errors, and analyze overall traffic.</li>
                    <li><strong>Preferences:</strong> To remember configurations such as theme choice (dark/light mode).</li>
                  </ul>
                  <p>
                    You can manage cookie settings in your browser at any time, though some platform features may cease to function correctly if all cookies are disabled.
                  </p>
                </div>
              </section>

              {/* Rights */}
              <section id="rights" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-2 text-brand-purple">
                  <UserX className="w-5 h-5" />
                  <h2 className="text-xl sm:text-2xl font-extrabold m-0">6. Your Rights & Choice</h2>
                </div>
                <div className="text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-3">
                  <p>
                    Depending on your jurisdiction, you have certain rights regarding your personal information, including:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The right to access or export the personal information we hold about you.</li>
                    <li>The right to update, correct, or amend out-of-date information.</li>
                    <li>The right to request permanent deletion of your account and related data.</li>
                  </ul>
                  <p>
                    To exercise any of these rights, please submit a request to support@rennto.com. We will respond to your request within 30 days of verification.
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
