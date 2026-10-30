'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Copy,
  LogOut,
  ShieldCheck,
  Calendar,
  KeyRound,
  Loader2,
  Sparkles,
  UserCircle,
} from 'lucide-react';

interface ProfileCardProps {
  user: User;
  onSignOut: () => Promise<void>;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  onSignOut,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Extract user metadata with graceful fallbacks
  const metadata = user.user_metadata || {};
  const avatarUrl: string | undefined = metadata.avatar_url || metadata.picture;
  const fullName: string =
    metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Brand Auditor';
  const email: string = user.email || 'user@enterprise.com';
  const firstName: string = fullName.split(' ')[0] || 'Auditor';

  // Compute initials for fallback avatar
  const initials: string = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BM';

  // Compute time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format last sign in timestamp
  const formatLastSignIn = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Active session';
    }
  };

  // Truncate user id for display
  const truncatedId = user.id ? `${user.id.slice(0, 8)}...${user.id.slice(-6)}` : 'usr_session';

  const handleCopyId = async () => {
    if (!user.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleSignOutClick = async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div
      className={`w-full bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Top accent gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authenticated Workspace</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F1535] tracking-tight mt-0.5">
            {getGreeting()}, {firstName}
          </h2>
          <p className="text-xs text-[#5F6788] mt-0.5">
            Signed in to BrandMesh Enterprise AI Governance Suite
          </p>
        </div>

        {/* Actions Button Group */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/account"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 text-[13px] font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
          >
            <UserCircle className="w-4 h-4 text-indigo-500" />
            <span>Account Details</span>
          </Link>

          {/* Prominent Sign Out Button */}
          <button
            type="button"
            id="profile-card-signout-btn"
            onClick={handleSignOutClick}
            disabled={isSigningOut}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 text-[13px] font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Large Avatar with Gradient Ring & Initial Fallback */}
          <div className="relative shrink-0">
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 shadow-md shadow-indigo-500/20">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-white p-0.5">
                {avatarUrl && !imageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-lg sm:text-xl flex items-center justify-center tracking-tight shadow-inner">
                    {initials}
                  </div>
                )}
              </div>
            </div>
            {/* Active Presence Indicator */}
            <span
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs"
              title="Session Active"
            />
          </div>

          {/* Name & Credentials */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-lg text-[#0F1535] leading-tight truncate">
                {fullName}
              </h3>
              {/* Google Provider Chip */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </span>
            </div>

            {/* Email with Verified Chip */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5173]">
              <span className="font-medium truncate max-w-xs">{email}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified</span>
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry metadata: Last Sign-in & User ID with morphing copy button */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          {/* Last Sign-in Chip */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-[12px] text-[#4A5173]">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <div className="leading-none">
              <span className="text-[10px] uppercase font-bold text-[#5F6788] block">Last Login</span>
              <span className="font-semibold text-slate-800">{formatLastSignIn(user.last_sign_in_at)}</span>
            </div>
          </div>

          {/* Truncated User ID with Morphing Copy Button */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-[12px] text-[#4A5173]">
            <KeyRound className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <div className="leading-none">
              <span className="text-[10px] uppercase font-bold text-[#5F6788] block">User ID</span>
              <span className="font-mono text-[11px] font-semibold text-slate-800">{truncatedId}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              aria-label={isCopied ? 'User ID Copied' : 'Copy User ID'}
              className="ml-1 p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
              title="Copy full UID"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCopied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
