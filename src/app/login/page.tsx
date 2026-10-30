'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Layers,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Zap,
  BarChart3,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Shield,
  X,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { GoogleButton } from '@/components/GoogleButton';

export default function LoginPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Validation & error state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // 1. Session Memory: Check for active session on load. If exists, redirect to /account
  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        if (!isSupabaseConfigured()) {
          if (isMounted) setIsCheckingSession(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session check warning:', error.message);
        }

        if (session && session.user) {
          if (isMounted) {
            router.replace('/account');
            return;
          }
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    checkExistingSession();

    // Check for error/error_description in URL hash or query params
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const err =
          urlParams.get('error_description') ||
          urlParams.get('error') ||
          hashParams.get('error_description') ||
          hashParams.get('error');

        if (err) {
          setServerError(decodeURIComponent(err.replace(/\+/g, ' ')));
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch {
        // Ignore URL parsing errors
      }
    }

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Validation helpers
  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address (e.g. name@company.com)');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Password is required');
      return false;
    }
    if (val.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  // 2. Email & Password Authentication Form Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Add your Supabase URL and anon key to .env.local and restart the dev server');
      }

      const cleanEmail = email.trim().toLowerCase();

      // Call supabase.auth.signInWithPassword()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setFailedAttempts((prev) => prev + 1);
        let friendlyMsg = error.message;

        if (error.message.toLowerCase().includes('invalid login credentials')) {
          friendlyMsg = 'Incorrect email or password. Please verify your credentials and try again.';
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          friendlyMsg = 'Your email has not been confirmed yet. Please check your inbox for the verification email.';
        } else if (error.message.toLowerCase().includes('too many requests')) {
          friendlyMsg = 'Too many failed login attempts. Please wait a few moments before trying again.';
        }

        throw new Error(friendlyMsg);
      }

      if (data.session) {
        // Successful login: redirect immediately to /account
        router.replace('/account');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. One-Click Demo Login for Hackathon Evaluators
  const handleOneClickDemoLogin = async () => {
    const demoEmail = 'demo@webmesh.app';
    const demoPassword = 'demoPassword123!';

    setEmail(demoEmail);
    setPassword(demoPassword);
    setEmailError(null);
    setPasswordError(null);
    setServerError(null);
    setServerSuccess(null);
    setIsDemoSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Add your Supabase URL and anon key to .env.local and restart the dev server');
      }

      // Call supabase.auth.signInWithPassword()
      let { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      // If user does not exist yet in Supabase (e.g. fresh project), auto-create and log in
      if (
        error &&
        (error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('user not found'))
      ) {
        const signUpRes = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
        });

        if (signUpRes.data.session) {
          router.replace('/account');
          return;
        }

        // Retry sign in after auto sign-up
        const retryRes = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        let friendlyMsg = error.message;
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          friendlyMsg = 'Incorrect demo credentials or account could not be authenticated in Supabase.';
        }
        throw new Error(friendlyMsg);
      }

      if (data.session) {
        // Redirect to /account dashboard
        router.replace('/account');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo sign in failed. Please try again.';
      setServerError(msg);
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  // Google OAuth Handler
  const handleGoogleSignIn = async () => {
    setServerError(null);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Add your Supabase URL and anon key to .env.local and restart the dev server');
      }

      const redirectUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/account` : 'http://localhost:3000/account';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in initiation failed';
      setServerError(msg);
    }
  };

  // Initial loading state (checking session to prevent screen flash)
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 selection:bg-indigo-100">
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 text-white font-black animate-pulse">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="font-extrabold text-[18px] text-[#0F1535] tracking-tight">
                BrandMesh
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                Enterprise
              </span>
            </div>
            <p className="text-[13px] text-[#4A5173] font-medium flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Verifying active session...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
        delayChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#F8FAFC] selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* LEFT PANEL: Enterprise Brand Presentation (Hidden below lg) */}
      <div className="hidden lg:flex flex-col justify-between min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0B1030] via-[#161244] to-[#1B1450] text-white p-10 xl:p-14 2xl:p-16">
        {/* Soft Animated Gradient Mesh (Transform-only, low-opacity) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0" aria-hidden="true">
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    transform: [
                      'translate(0px, 0px) scale(1)',
                      'translate(50px, -40px) scale(1.15)',
                      'translate(-30px, 40px) scale(0.95)',
                      'translate(0px, 0px) scale(1)',
                    ],
                  }
            }
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-[15%] -left-[10%] w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-indigo-500/25 via-violet-500/20 to-pink-500/15 blur-[100px]"
          />
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    transform: [
                      'translate(0px, 0px) scale(1)',
                      'translate(-60px, 50px) scale(1.1)',
                      'translate(40px, -30px) scale(0.9)',
                      'translate(0px, 0px) scale(1)',
                    ],
                  }
            }
            transition={{
              duration: 26,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -bottom-[20%] -right-[15%] w-[640px] h-[640px] rounded-full bg-gradient-to-bl from-teal-500/18 via-indigo-600/20 to-purple-600/20 blur-[120px]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        </div>

        {/* Top: Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-black">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-[20px] tracking-tight text-white">
                BrandMesh
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-white/10 text-indigo-300 rounded-md border border-white/15 backdrop-blur-xs">
                Enterprise
              </span>
            </div>
            <p className="text-[12px] text-slate-300 font-medium">
              AI Brand Governance Co-Pilot
            </p>
          </div>
        </div>

        {/* Middle: Value Prop & Benefit Lines */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Enterprise Identity & Access</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.2]">
              Secure Governance for Enterprise Content Teams.
            </h2>
            <p className="text-[15px] text-slate-300 leading-relaxed font-normal">
              Sign in with password or Google SSO to access audit rules, real-time copy auditing, and approval hubs.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cryptographic Session Protection</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Supabase Auth provides state-of-the-art JWT session tokens with automatic refresh and secure storage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-300 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Instant Account Dashboard</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Seamlessly navigate between your profile dashboard, brand guidelines, and copy auditing studio.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/30 text-pink-300 flex items-center justify-center shrink-0 mt-0.5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Auditable Security & RBAC</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Every sign-in event is authenticated and compliant with enterprise SOC2 Type II standards.
                </p>
              </div>
            </div>
          </div>

          {/* Floating Trust Card */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl flex items-center gap-4 max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex flex-col items-center justify-center shrink-0 font-extrabold shadow-md shadow-emerald-500/30">
              <span className="text-sm leading-none">92%</span>
              <span className="text-[9px] uppercase tracking-wider font-bold opacity-90">Trust</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enterprise Verified</span>
              </div>
              <p className="text-[12px] text-slate-200 font-medium truncate mt-0.5">
                Protected by Supabase Auth
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-300">
                  <TrendingUp className="w-3 h-3" />
                  Zero Retention
                </span>
                <span>•</span>
                <span>Air-Gapped Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span>SOC2 Type II Certified</span>
          <span>•</span>
          <span>WCAG 2.2 AAA Compliant</span>
          <span>•</span>
          <span>Frontify Standard</span>
        </div>
      </div>

      {/* RIGHT PANEL: Centered Secure Login Form */}
      <div className="w-full min-h-screen flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-14 xl:p-16 relative">
        {/* Ambient subtle background glow */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-md mx-auto p-6 sm:p-8 md:p-10 bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 relative overflow-hidden z-10"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

          {/* Mobile Brand Header */}
          <motion.div variants={itemVariants} className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[16px] tracking-tight text-[#0F1535]">
                  BrandMesh
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                  Enterprise
                </span>
              </div>
              <p className="text-[12px] text-[#4A5173] font-medium">
                AI Brand Governance Co-Pilot
              </p>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#0F1535] tracking-tight leading-snug">
                Sign in to Account
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200">
                <Shield className="w-3 h-3" />
                Supabase
              </span>
            </div>
            <p className="text-[14px] text-[#4A5173] font-normal mt-1.5 leading-relaxed">
              Enter your email and password to access your secure dashboard.
            </p>
          </motion.div>

          {/* Accessible Error / Success Banners */}
          <div aria-live="polite" aria-atomic="true">
            {serverError && (
              <motion.div
                variants={itemVariants}
                role="alert"
                className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-900 text-[13px] flex items-start gap-2.5 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">
                  <p className="font-semibold text-rose-950">Authentication Notice</p>
                  <p className="text-rose-800 text-[12.5px] mt-0.5">{serverError}</p>
                  {failedAttempts >= 3 && (
                    <p className="text-rose-900 font-semibold text-[11.5px] mt-1.5">
                      Tip: Don&apos;t have an account yet?{' '}
                      <Link href="/signup" className="underline hover:text-rose-950 font-bold">
                        Create Account here →
                      </Link>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setServerError(null)}
                  aria-label="Dismiss error"
                  className="text-rose-500 hover:text-rose-700 p-0.5 rounded-md hover:bg-rose-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {serverSuccess && (
              <motion.div
                variants={itemVariants}
                role="status"
                className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[13px] flex items-start gap-2.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">
                  <p className="font-semibold text-emerald-950">Success</p>
                  <p className="text-emerald-800 text-[12.5px] mt-0.5">{serverSuccess}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Secure Email & Password Form */}
          <form onSubmit={handleAuthSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label
                htmlFor="login-email-input"
                className="block text-[13px] font-semibold text-[#0F1535]"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email-input"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  className={`w-full h-12 pl-10 pr-4 rounded-2xl bg-white border text-sm text-[#0F1535] placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 ${
                    emailError
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-[12px] font-medium text-rose-600 mt-1 pl-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password-input"
                  className="block text-[13px] font-semibold text-[#0F1535]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setServerError(
                      'Password reset: Contact your enterprise administrator or check your Supabase Auth user management.'
                    );
                  }}
                  className="text-[12px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  className={`w-full h-12 pl-10 pr-11 rounded-2xl bg-white border text-sm text-[#0F1535] placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 ${
                    passwordError
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[12px] font-medium text-rose-600 mt-1 pl-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <button
                type="submit"
                id="login-submit-button"
                disabled={isSubmitting || isDemoSubmitting}
                aria-busy={isSubmitting}
                className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-indigo-600/25 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-65 disabled:pointer-events-none cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>

            {/* Hackathon Evaluators Demo Callout Box */}
            <motion.div
              variants={itemVariants}
              className="p-3.5 sm:p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-slate-800 space-y-2.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Hackathon Evaluators:
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-200/60 text-blue-800">
                  Demo Access
                </span>
              </div>
              <div className="space-y-1 text-[13px] bg-white/80 p-2.5 rounded-xl border border-blue-200/80 font-mono text-slate-700">
                <div>
                  <span className="font-sans font-semibold text-slate-900">Email:</span> demo@webmesh.app
                </div>
                <div>
                  <span className="font-sans font-semibold text-slate-900">Password:</span> demoPassword123!
                </div>
              </div>
              <button
                type="button"
                id="one-click-demo-login-btn"
                disabled={isSubmitting || isDemoSubmitting}
                onClick={handleOneClickDemoLogin}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                {isDemoSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in as Demo Evaluator...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>One-Click Demo Login</span>
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Link to Sign Up Page */}
          <motion.div variants={itemVariants} className="mt-4 text-center">
            <p className="text-[13px] text-[#4A5173]">
              Don&apos;t have an account yet?
              <Link
                href="/signup"
                id="login-to-signup-link"
                className="ml-1.5 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Create Account
              </Link>
            </p>
          </motion.div>

          {/* Divider with Note */}
          <motion.div variants={itemVariants} className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute px-3 bg-white text-[11px] font-semibold tracking-wider uppercase text-[#5F6788]">
              Or continue with Google SSO
            </span>
          </motion.div>

          {/* Google SSO Button */}
          <motion.div variants={itemVariants} className="mb-5">
            <GoogleButton onClick={handleGoogleSignIn} />
          </motion.div>

          {/* Security Footnote */}
          <motion.div variants={itemVariants} className="pt-2 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#5F6788]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured by Supabase Auth (AES-256 JWT)</span>
            </div>
            <div className="text-[12px] text-[#5F6788] flex items-center justify-center gap-2">
              <Link href="/" className="hover:text-indigo-600 underline">
                Return to Workspace
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
