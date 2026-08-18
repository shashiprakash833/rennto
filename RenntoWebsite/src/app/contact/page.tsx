"use client";

import { useState, useEffect } from "react";
import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";
import SignInModal from "@/components/SignInModal";
import Toast from "@/components/Toast";
import { UserContext } from "@/app/page";
import { Mail, Phone, MapPin, Send, MessageSquare, Info, ShieldAlert, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactPage() {
  const [user, setUser] = useState<UserContext | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!name || !email || !message) {
  //     setToast({
  //       message: "Please fill out all required fields.",
  //       type: "error",
  //     });
  //     return;
  //   }

  //   setIsSubmitting(true);

  //   // Simulate API request
  //   setTimeout(() => {
  //     setIsSubmitting(false);
  //     setIsSubmitted(true);
  //     setToast({
  //       message: "Your message has been sent successfully!",
  //       type: "success",
  //     });
  //     setName("");
  //     setEmail("");
  //     setMessage("");
  //   }, 1500);
  // };



  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!name || !email || !message) {
    setToast({
      message: "Please fill out all required fields.",
      type: "error",
    });
    return;
  }

  try {
    setIsSubmitting(true);

    const SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbxa1IzoNxcRSuWV2APSTV8pdxspEsWzoXhLboFIDaQoJGXys2zQ1SCLsHqCqp78AR9H/exec";

    const url =
      `${SCRIPT_URL}?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&topic=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;

    await fetch(url, {
      method: "POST",
      mode: "no-cors",
    });

    setIsSubmitted(true);

    setToast({
      message: "Your message has been sent successfully!",
      type: "success",
    });

    setName("");
    setEmail("");
    setSubject("general");
    setMessage("");
  } catch (error) {
    console.error(error);

    setToast({
      message: "Failed to send message.",
      type: "error",
    });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <main className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
      {/* Site Navbar */}
      <Navbar
        user={user}
        setIsSignInModalOpen={setIsSignInModalOpen}
        onSignOut={handleSignOut}
        theme={theme}
        setTheme={handleThemeChange}
      />

      {/* Main Layout Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        
        {/* Banner header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Contact Our <span className="bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink bg-clip-text text-transparent">Support Team</span>
          </h1>
          <p className="text-slate-505 dark:text-slate-400 text-xs sm:text-sm font-semibold leading-relaxed">
            Have questions about landlord verification, smart rent collections, tenant safety, or listing a property? Drop us a message, and our trust agents will respond within 2 hours.
          </p>
        </div>

        {/* Contact Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Contact Channels & Cards */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Live Indicator Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-md shadow-slate-100 dark:shadow-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/25 flex items-center justify-center text-emerald-500">
                  <MessageSquare className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-850 dark:text-white">Live Operations</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Average wait: 2 mins</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Online</span>
              </div>
            </div>

            {/* Support Details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-md shadow-slate-100 dark:shadow-none space-y-6">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Official Channels</h3>
              
              <div className="space-y-5">
                {/* Email Channel */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 dark:bg-brand-indigo/20 flex items-center justify-center text-brand-indigo shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550">General Support</h4>
                    <a href="mailto:support@rennto.com" className="text-sm font-extrabold text-slate-900 dark:text-white hover:text-brand-indigo transition-colors block mt-0.5">
                      support@rennto.com
                    </a>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Send us detailed queries anytime.</p>
                  </div>
                </div>

                {/* Phone Channel */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 dark:bg-brand-purple/20 flex items-center justify-center text-brand-purple shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-555">Toll-Free Support</h4>
                    <a href="tel:+18005550199" className="text-sm font-extrabold text-slate-900 dark:text-white hover:text-brand-purple transition-colors block mt-0.5">
                      +1 (800) 555-0199
                    </a>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Available Mon-Fri, 9:00 AM – 6:00 PM IST.</p>
                  </div>
                </div>

                {/* Office Location */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-pink/10 dark:bg-brand-pink/20 flex items-center justify-center text-brand-pink shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-555">Main Office</h4>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-0.5">
                      Hyderabad, Telangana, India
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Inorbit Mall Road, Madhapur, 500081.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Note Card */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-[11px] sm:text-xs text-slate-350 font-semibold space-y-2">
              <div className="flex items-center gap-2 text-brand-indigo font-bold">
                <Info className="w-4 h-4" />
                <span>Brokerage-Free Safety Guarantee</span>
              </div>
              <p className="text-slate-400 leading-relaxed font-medium">
                Rennto never charges brokerage fees. If you receive suspicious demands for brokerage or payments claiming to represent Rennto, report immediately to our abuse channel at <a href="mailto:abuse@rennto.com" className="text-brand-pink hover:underline">abuse@rennto.com</a>.
              </p>
            </div>

          </div>

          {/* Right Column: Dynamic Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-8 shadow-md shadow-slate-100 dark:shadow-none">
              
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form
                    key="contact-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Send a Message</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Fields marked with <span className="text-red-500">*</span> are mandatory.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Name input */}
                      <div className="space-y-2">
                        <label htmlFor="form-name" className="text-xs font-bold text-slate-600 dark:text-slate-450 block">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="form-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-indigo rounded-2xl text-sm font-semibold focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Email input */}
                      <div className="space-y-2">
                        <label htmlFor="form-email" className="text-xs font-bold text-slate-600 dark:text-slate-450 block">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="form-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-indigo rounded-2xl text-sm font-semibold focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Subject Select */}
                    <div className="space-y-2">
                      <label htmlFor="form-subject" className="text-xs font-bold text-slate-600 dark:text-slate-450 block">
                        Topic of Inquiry
                      </label>
                      <select
                        id="form-subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-indigo rounded-2xl text-sm font-semibold focus:outline-none transition-colors appearance-none cursor-pointer"
                      >
                        <option value="general">General Inquiries / Info</option>
                        <option value="tenant">Tenant Verification Support</option>
                        <option value="owner">Owner Property Listings</option>
                        <option value="payment">Smart Collect Payments / Fees</option>
                        <option value="bug">Report a Bug / Technical issue</option>
                      </select>
                    </div>

                    {/* Message input */}
                    <div className="space-y-2">
                      <label htmlFor="form-message" className="text-xs font-bold text-slate-600 dark:text-slate-450 block">
                        Message Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="form-message"
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-indigo rounded-2xl text-sm font-semibold focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-pink hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-brand-indigo/15 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending message...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>

                  </motion.form>
                ) : (
                  <motion.div
                    key="success-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-12 flex flex-col items-center justify-center space-y-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                      <Check className="w-10 h-10 stroke-[3]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">Message Sent Successfully!</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold max-w-sm mx-auto">
                        Thank you for reaching out. A ticket has been created, and our team will get back to you shortly.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-755 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

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
