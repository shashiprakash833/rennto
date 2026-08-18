"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Building, ArrowRight, Loader2, KeyRound, Mail, Lock, Shield } from "lucide-react";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess: (email: string, role: "tenant" | "owner") => void;
}

export default function SignInModal({ isOpen, onClose, onSignInSuccess }: SignInModalProps) {
  const [step, setStep] = useState<"choose-role" | "form">("choose-role");
  const [selectedRole, setSelectedRole] = useState<"tenant" | "owner" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset modal state when it opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("choose-role");
      setSelectedRole(null);
      setEmail("");
      setPassword("");
      setPropertyId("");
      setRememberMe(false);
      setIsLoading(false);
      setIsGoogleLoading(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleSelect = (role: "tenant" | "owner") => {
    setSelectedRole(role);
    setStep("form");
  };

  const handleGoogleSignIn = () => {
    setError(null);
    setIsGoogleLoading(true);

    // Simulate mock Google OAuth redirection and validation
    setTimeout(() => {
      setIsGoogleLoading(false);
      if (selectedRole) {
        onSignInSuccess(`google.user@${selectedRole === "tenant" ? "renter" : "landlord"}.com`, selectedRole);
        onClose();
      }
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple frontend validations
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (selectedRole === "tenant" && password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setIsLoading(true);

    // Simulate mock credentials validation
    setTimeout(() => {
      setIsLoading(false);
      if (selectedRole) {
        onSignInSuccess(email, selectedRole);
        onClose();
      }
    }, 1500);
  };

  // Colored Google Brand SVG Logo
  const GoogleLogo = () => (
    <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative bg-white/95 dark:bg-slate-900/95 border border-slate-150 dark:border-slate-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl p-6 sm:p-8 backdrop-blur-md z-10"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          disabled={isLoading || isGoogleLoading}
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {step === "choose-role" ? (
            <motion.div
              key="choose-role"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 pt-4 text-center"
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="w-12 h-12 bg-brand-indigo/10 text-brand-indigo rounded-2xl flex items-center justify-center mx-auto border border-brand-indigo/20">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Sign In to Rennto</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
                  Select your portal to continue
                </p>
              </div>

              {/* Role Selectors */}
              <div className="grid gap-4 pt-2">
                <button
                  onClick={() => handleRoleSelect("tenant")}
                  className="flex items-center gap-4 p-4 border border-slate-205 dark:border-slate-800 hover:border-brand-purple dark:hover:border-brand-purple bg-white dark:bg-slate-950 hover:bg-brand-purple/5 dark:hover:bg-brand-purple/10 rounded-2xl text-left transition-all group shadow-sm active:scale-98 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 dark:bg-brand-purple/20 border border-brand-purple/20 text-brand-purple flex items-center justify-center group-hover:bg-brand-purple group-hover:text-white transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-slate-900 dark:text-white text-sm">Continue as Tenant</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Find apartments, lock contracts, search co-living</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-purple group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => handleRoleSelect("owner")}
                  className="flex items-center gap-4 p-4 border border-slate-205 dark:border-slate-800 hover:border-brand-indigo dark:hover:border-brand-indigo bg-white dark:bg-slate-950 hover:bg-brand-indigo/5 dark:hover:bg-brand-indigo/10 rounded-2xl text-left transition-all group shadow-sm active:scale-98 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 dark:bg-brand-indigo/20 border border-brand-indigo/20 text-brand-indigo flex items-center justify-center group-hover:bg-brand-indigo group-hover:text-white transition-colors">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-slate-900 dark:text-white text-sm">Continue as Owner</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">List properties, track collection yields, audit logs</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-indigo group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="signin-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5 pt-4"
            >
              {/* Back Nav */}
              <button
                onClick={() => setStep("choose-role")}
                className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                disabled={isLoading || isGoogleLoading}
              >
                ← Back to portals
              </button>

              {/* Form Title */}
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {selectedRole === "tenant" ? "Tenant Login" : "Owner Login"}
                </h3>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                  Authenticate securely using Google or credentials
                </p>
              </div>

              {/* Prominent Google Sign-In Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full py-3.5 px-4 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-sm rounded-xl shadow-sm hover:shadow active:scale-98 transition-all flex items-center justify-center disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin mr-2.5 text-brand-indigo" />
                      Authorizing with Google...
                    </>
                  ) : (
                    <>
                      <GoogleLogo />
                      Continue with Google
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-slate-150 dark:bg-slate-800" />
                <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-900 transition-colors duration-300">
                  or continue with email
                </span>
                <div className="flex-grow h-px bg-slate-150 dark:bg-slate-800" />
              </div>

              {/* Form inputs */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl text-xs font-bold text-red-750 dark:text-red-400">
                    ⚠ {error}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@domain.com"
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold text-slate-900 dark:text-white ${
                        selectedRole === "tenant" ? "focus:border-brand-purple" : "focus:border-brand-indigo"
                      }`}
                      disabled={isLoading || isGoogleLoading}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    {selectedRole === "tenant" && (
                      <span className="text-xs font-semibold text-brand-purple hover:underline cursor-pointer">
                        Forgot password?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold text-slate-900 dark:text-white ${
                        selectedRole === "tenant" ? "focus:border-brand-purple" : "focus:border-brand-indigo"
                      }`}
                      disabled={isLoading || isGoogleLoading}
                      required
                    />
                  </div>
                </div>

                {/* Optional Property ID Field for Owner */}
                {selectedRole === "owner" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      Property ID <span className="text-[10px] text-slate-400 dark:text-slate-550 font-semibold lowercase">(optional)</span>
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="text"
                        value={propertyId}
                        onChange={(e) => setPropertyId(e.target.value)}
                        placeholder="e.g. PROP-9821"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-indigo focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold text-slate-900 dark:text-white"
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Remember Me */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={`rounded border-slate-300 dark:border-slate-700 cursor-pointer ${
                      selectedRole === "tenant" ? "text-brand-purple focus:ring-brand-purple" : "text-brand-indigo focus:ring-brand-indigo"
                    }`}
                    disabled={isLoading || isGoogleLoading}
                  />
                  <label htmlFor="remember-me" className="text-xs font-bold text-slate-550 dark:text-slate-400 select-none cursor-pointer">
                    Remember my preferences on this device
                  </label>
                </div>

                {/* Action Submit */}
                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className={`w-full py-3.5 px-6 font-extrabold rounded-xl text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer ${
                    isLoading
                      ? "bg-slate-700 cursor-not-allowed"
                      : selectedRole === "tenant"
                        ? "bg-brand-purple hover:bg-brand-purple/90 hover:shadow-brand-purple/10 active:scale-98"
                        : "bg-brand-indigo hover:bg-brand-indigo/90 hover:shadow-brand-indigo/10 active:scale-98"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Validating Session...
                    </>
                  ) : (
                    "Authorize & Log In"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
