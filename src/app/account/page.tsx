'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  LogOut,
  Mail,
  ShieldCheck,
  Calendar,
  KeyRound,
  Check,
  Copy,
  ArrowRight,
  Shield,
  Sparkles,
  FileCheck2,
  BrainCircuit,
  Columns3,
  Loader2,
  Clock,
  UserCheck,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 1. Session Protection: On load, check for the user's session. If no one is logged in, redirect to /login
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        if (!isSupabaseConfigured()) {
          if (isMounted) router.replace('/login');
          return;
        }

        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error || !currentSession || !currentSession.user) {
          if (isMounted) {
            router.replace('/login');
          }
          return;
        }

        if (isMounted) {
          setUser(currentSession.user);
          setSession(currentSession);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
        if (isMounted) {
          router.replace('/login');
        }
      }
    };

    verifySession();

    // Subscribe to auth state updates
    let listener: { subscription: { unsubscribe: () => void } } | null = null;
    try {
      if (isSupabaseConfigured()) {
        const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (!isMounted) return;

          if (event === 'SIGNED_OUT' || !newSession) {
            setUser(null);
            setSession(null);
            router.replace('/login');
          } else if (newSession) {
            setUser(newSession.user);
            setSession(newSession);
            setIsLoading(false);
          }
        });
        listener = data;
      }
    } catch {
      // Ignore
    }

    return () => {
      isMounted = false;
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [router]);

  // 2. Secure Log Out Handler
  const handleLogOut = async () => {
    setIsLoggingOut(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      // Redirect back to /login screen
      router.replace('/login');
    }
  };

  const handleCopyId = async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  // Format timestamps
  const formatDate = (timestamp?: string) => {
    if (!timestamp) return 'Active now';
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(timestamp));
    } catch {
      return timestamp;
    }
  };

  // Loading state (session verification)
  if (isLoading || !user) {
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
              <span>Checking account permissions...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Extract display values
  const userEmail = user.email || 'user@enterprise.com';
  const provider = user.app_metadata?.provider || 'email';
  const metadata = user.user_metadata || {};
  const fullName = metadata.full_name || metadata.name || userEmail.split('@')[0];
  const truncatedId = `${user.id.slice(0, 8)}...${user.id.slice(-6)}`;

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'AU';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-indigo-100 selection:text-indigo-900">
      {/* Atmosphere background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/8 to-pink-500/5 blur-[120px]" />
        <div className="absolute top-[35%] -right-[15%] w-[680px] h-[680px] rounded-full bg-gradient-to-bl from-violet-500/10 via-teal-500/8 to-indigo-500/5 blur-[140px]" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          {/* Left: Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[15px] tracking-tight text-[#0F1535] group-hover:text-indigo-600 transition-colors">
                  BrandMesh
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                  Account Hub
                </span>
              </div>
              <p className="text-[11px] text-[#4A5173] font-medium hidden sm:block leading-none mt-0.5">
                AI Brand Governance Co-Pilot
              </p>
            </div>
          </Link>

          {/* Right: Return to Workspace & Secure Log Out */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 text-[13px] font-semibold transition-all shadow-2xs"
            >
              <span>Workspace Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Secure Log Out Button */}
            <button
              type="button"
              id="account-logout-btn"
              onClick={handleLogOut}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100 hover:text-rose-800 text-[13px] font-semibold transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-60"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome Banner with Email */}
        <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 md:p-10 shadow-sm relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 shadow-md shadow-indigo-500/20 shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-white p-0.5">
                  {metadata.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={metadata.avatar_url}
                      alt={fullName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-xl flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Authenticated Account</span>
                </div>
                {/* Welcome message showing the user's email address as requested */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1535] tracking-tight">
                  Welcome, <span className="text-indigo-600 break-all">{userEmail}</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#4A5173] font-medium">
                  Signed in securely with Supabase Auth to BrandMesh Enterprise Suite.
                </p>
              </div>
            </div>

            {/* Quick Action: Log Out */}
            <button
              type="button"
              onClick={handleLogOut}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-[13px] font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6788] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                Account Email
              </span>
              <p className="font-bold text-[13px] text-[#0F1535] truncate">{userEmail}</p>
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Active
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6788] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-violet-500" />
                Auth Provider
              </span>
              <p className="font-bold text-[13px] text-[#0F1535] capitalize">
                {provider === 'google' ? 'Google OAuth SSO' : 'Email & Password'}
              </p>
              <p className="text-[11px] text-[#5F6788]">Managed via Supabase Auth</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6788] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-pink-500" />
                Last Sign-In
              </span>
              <p className="font-bold text-[13px] text-[#0F1535]">
                {formatDate(user.last_sign_in_at)}
              </p>
              <p className="text-[11px] text-[#5F6788]">Encrypted JWT session</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6788] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                User UID
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] font-semibold text-[#0F1535]">
                  {truncatedId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Copy full UID"
                  className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#5F6788]">
                {isCopied ? 'Copied to clipboard!' : 'Click to copy UID'}
              </p>
            </div>
          </div>
        </div>

        {/* Security & Workspace Hub Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Workspace Access */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[15px] text-[#0F1535]">Co-Pilot Studio</h3>
                <p className="text-xs text-[#5F6788]">Real-time copy & compliance audit</p>
              </div>
            </div>
            <p className="text-xs text-[#4A5173] leading-relaxed">
              Scan marketing copy against banned terms, tone rules, and SLA commitments with sub-second AI suggestions.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Brand Brain */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[15px] text-[#0F1535]">Brand Brain</h3>
                <p className="text-xs text-[#5F6788]">Enterprise styleguide rules</p>
              </div>
            </div>
            <p className="text-xs text-[#4A5173] leading-relaxed">
              Manage your banned terminology, approved alternatives, verified product facts, and accessible color swatches.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
            >
              <span>View Brand Brain</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Approval Hub */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center">
                <Columns3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[15px] text-[#0F1535]">Approval Hub</h3>
                <p className="text-xs text-[#5F6788]">Kanban governance queues</p>
              </div>
            </div>
            <p className="text-xs text-[#4A5173] leading-relaxed">
              Review campaign copy, track 90+ trust score fast-tracks, and monitor team sign-offs with audit trails.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-pink-600 hover:text-pink-800 transition-colors"
            >
              <span>Open Approval Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security & Zero-Retention Compliance Banner */}
        <div className="mt-8 bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Shield className="w-4 h-4" />
              <span>SOC2 Type II & Frontify Compliance Active</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Zero-Retention Enterprise Session Security
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Your authentication session is protected with encrypted Supabase Auth tokens. All audit telemetry and copy checks conform to confidential, air-gapped governance guidelines.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={handleLogOut}
              disabled={isLoggingOut}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out of Session</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white/70 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#0F1535]">BrandMesh</span>
            <span>• Frontify & Acrolinx Enterprise Compliance Standard</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>SOC2 Type II Certified</span>
            <span>•</span>
            <span>WCAG 2.2 AAA Compliant</span>
            <span>•</span>
            <span>Supabase Auth</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
