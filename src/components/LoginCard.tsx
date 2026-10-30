'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Layers, Shield, AlertCircle, X, ExternalLink, Lock, Mail, Sparkles, Zap, Loader2 } from 'lucide-react';
import { GoogleButton } from './GoogleButton';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface LoginCardProps {
  onSuccess?: () => void;
  className?: string;
}

export const LoginCard: React.FC<LoginCardProps> = ({ className = '', onSuccess }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<'terms' | 'privacy' | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Read error / error_description from URL query or hash on return from OAuth
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      let err = urlParams.get('error') || urlParams.get('error_description');

      // Also check hash fragment (Supabase sometimes redirects with #error=...)
      if (!err && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        err = hashParams.get('error_description') || hashParams.get('error');
      }

      if (err) {
        // Humanize common OAuth errors
        let friendly = decodeURIComponent(err.replace(/\+/g, ' '));
        if (friendly.toLowerCase().includes('user cancelled') || friendly.toLowerCase().includes('access_denied')) {
          friendly = 'Sign in was cancelled. Please try again with your Google account.';
        } else if (friendly.toLowerCase().includes('provider is not enabled')) {
          friendly = 'Google sign-in provider is not enabled in your Supabase project. Enable Google in Supabase Auth > Providers.';
        }
        setErrorMessage(friendly);

        // Clean the URL nicely without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Add your Supabase URL and anon key to .env.local and restart the dev server');
      }

      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

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

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      setIsLoading(false);
      let message = 'Failed to initiate Google sign in. Please try again.';
      if (err instanceof Error) {
        message = err.message;
      }
      setErrorMessage(message);
    }
  };

  const handleOneClickDemoLogin = async () => {
    const demoEmail = 'demo@webmesh.app';
    const demoPassword = 'demoPassword123!';
    setErrorMessage(null);
    setIsDemoSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Add your Supabase URL and anon key to .env.local and restart the dev server');
      }

      let { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

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
          if (onSuccess) onSuccess();
          router.replace('/account');
          return;
        }

        const retryRes = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) throw error;

      if (data.session) {
        if (onSuccess) onSuccess();
        router.replace('/account');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo sign in failed';
      setErrorMessage(msg);
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  // Motion variants with reduced motion support
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.07,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={`w-full max-w-md mx-auto p-6 sm:p-8 md:p-10 bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 relative overflow-hidden ${className}`}
      >
        {/* Subtle decorative top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

        {/* Mobile Header / Brand (shown when split-screen left panel is hidden) */}
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

        {/* Desktop Logo Badge */}
        <motion.div variants={itemVariants} className="hidden lg:flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-[15px] tracking-tight text-[#0F1535]">
            BrandMesh
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
            Enterprise SSO
          </span>
        </motion.div>

        {/* Heading & Subtitle */}
        <motion.div variants={itemVariants} className="mb-7">
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#0F1535] tracking-tight leading-snug">
            Welcome back
          </h1>
          <p className="text-[14px] text-[#4A5173] font-normal mt-1.5 leading-relaxed">
            Sign in with your enterprise Google account to access your brand governance co-pilot.
          </p>
        </motion.div>

        {/* Accessible Inline Error Region */}
        <div aria-live="polite" aria-atomic="true">
          {errorMessage && (
            <motion.div
              variants={itemVariants}
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-900 text-[13px] flex items-start gap-2.5 shadow-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                <p className="font-semibold text-rose-950">Authentication Notice</p>
                <p className="text-rose-800 text-[12.5px] mt-0.5">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error"
                className="text-rose-500 hover:text-rose-700 p-0.5 rounded-md hover:bg-rose-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </div>

        {/* Google SSO Button */}
        <motion.div variants={itemVariants} className="mb-3">
          <GoogleButton
            onClick={handleGoogleSignIn}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </motion.div>

        {/* Email & Password / Sign Up Options */}
        <motion.div variants={itemVariants} className="mb-4 grid grid-cols-2 gap-2.5">
          <Link
            href="/login"
            className="h-11 px-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 text-slate-700 font-semibold text-[12.5px] flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/signup"
            className="h-11 px-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 font-semibold text-[12.5px] flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs"
          >
            <span>Create Account</span>
          </Link>
        </motion.div>

        {/* Hackathon Evaluators Demo Credentials Box */}
        <motion.div
          variants={itemVariants}
          className="mb-5 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-slate-800 space-y-2.5 shadow-xs text-left"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-950 flex items-center gap-1.5 text-xs sm:text-[13px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Hackathon Evaluators:
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-200/60 text-blue-800">
              Demo Access
            </span>
          </div>
          <div className="space-y-0.5 text-[12px] bg-white/80 p-2 rounded-xl border border-blue-200/80 font-mono text-slate-700">
            <div>
              <span className="font-sans font-semibold text-slate-900">Email:</span> demo@webmesh.app
            </div>
            <div>
              <span className="font-sans font-semibold text-slate-900">Password:</span> demoPassword123!
            </div>
          </div>
          <button
            type="button"
            id="login-card-demo-btn"
            disabled={isLoading || isDemoSubmitting}
            onClick={handleOneClickDemoLogin}
            className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] flex items-center justify-center gap-1.5 transition-all shadow-xs hover:shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-60"
          >
            {isDemoSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>One-Click Demo Login</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Divider with Note */}
        <motion.div variants={itemVariants} className="relative flex items-center justify-center my-6">
          <div className="w-full border-t border-slate-200" />
          <span className="absolute px-3 bg-white text-[11px] font-semibold tracking-wider uppercase text-[#5F6788]">
            Zero-Retention Single Sign-On
          </span>
        </motion.div>

        {/* Permission disclosure & small print */}
        <motion.div variants={itemVariants} className="space-y-3.5 text-center">
          <p className="text-[12px] text-[#4A5173] flex items-center justify-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>We only read your name, email and profile photo.</span>
          </p>

          <div className="flex items-center justify-center gap-4 text-[12px] text-[#5F6788]">
            <button
              type="button"
              onClick={() => setShowInfoModal('terms')}
              className="hover:text-indigo-600 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowInfoModal('privacy')}
              className="hover:text-indigo-600 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#5F6788]">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secured by Supabase Auth</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Terms / Privacy Informational Dialog */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#0F1535]">
                {showInfoModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <button
                type="button"
                onClick={() => setShowInfoModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 text-[13px] text-[#4A5173] space-y-3 leading-relaxed max-h-72 overflow-y-auto">
              {showInfoModal === 'terms' ? (
                <>
                  <p>
                    BrandMesh provides an enterprise-grade AI brand governance and compliance auditing platform inspired by Frontify and Acrolinx standards.
                  </p>
                  <p>
                    By signing in with Google OAuth, you authorize BrandMesh to verify your organization identity. Your session is protected by cryptographic JWT tokens managed via Supabase Auth.
                  </p>
                  <p>
                    No marketing trackers, third-party advertising, or unauthorized data dissemination is permitted under our SOC2 Type II compliance framework.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Privacy-First Architecture:</strong> BrandMesh only reads basic profile information (display name, email address, and profile photo avatar) returned by Google OAuth.
                  </p>
                  <p>
                    We never access your Google Drive, Gmail, contacts, or calendar. Your authentication credentials remain securely anchored to your Supabase project.
                  </p>
                  <p>
                    In Confidential Vault Mode, all text analysis runs locally via air-gapped zero-retention Ollama endpoints with zero server data retention.
                  </p>
                </>
              )}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
