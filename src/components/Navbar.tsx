'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuditStore } from '@/store';
import { User } from '@supabase/supabase-js';
import { TabType } from '@/types/brandmesh';
import {
  BrainCircuit,
  FileCheck2,
  Columns3,
  BarChart3,
  ChevronDown,
  Bell,
  Layers,
  Cloud,
  Shield,
  Sparkles,
  LogOut,
  ShieldCheck,
  Loader2,
  UserCircle,
} from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  confidentialMode?: boolean;
  setConfidentialMode?: (mode: boolean | ((prev: boolean) => boolean)) => void;
  pendingApprovalsCount?: number;
  user?: User | null;
  onSignOut?: () => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  setConfidentialMode,
  pendingApprovalsCount = 2,
  user = null,
  onSignOut,
}) => {
  const { isCloudMode, toggleCloudMode } = useAuditStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Extract user metadata with graceful fallbacks
  const metadata = user?.user_metadata || {};
  const avatarUrl: string | undefined = metadata.avatar_url || metadata.picture;
  const fullName: string =
    metadata.full_name || metadata.name || user?.email?.split('@')[0] || 'Brand Director';
  const email: string = user?.email || 'director@enterprise.com';
  const initials: string = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BM';

  const handleToggle = () => {
    toggleCloudMode();
    if (setConfidentialMode) {
      setConfidentialMode(isCloudMode);
    }
  };

  const navTabs: { id: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'brain', label: 'Brand Brain', icon: BrainCircuit },
    { id: 'studio', label: 'Co-Pilot Studio', icon: FileCheck2 },
    { id: 'approvals', label: 'Approval Hub', icon: Columns3, badge: pendingApprovalsCount },
    { id: 'insights', label: 'Insights & Doctor', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full h-16 frontify-glass surface-light transition-colors">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14 h-full flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-lg tracking-tighter">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[15px] tracking-tight text-[var(--text-ink)]">
                  BrandMesh
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-600 rounded-md border border-indigo-500/20">
                  Enterprise
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-soft-ink)] font-medium hidden sm:block leading-none mt-0.5">
                AI Brand Governance Co-Pilot
              </p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-[var(--border-color)] hidden md:block" />

          {/* Center Tabs Navigation (64px, one-line, sliding layoutId pill) */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-colors cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? 'text-indigo-600 font-bold'
                      : 'text-[var(--text-soft-ink)] hover:text-[var(--text-ink)] hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-[var(--text-muted)]'}`} />
                  <span>{tab.label}</span>

                  {tab.badge !== undefined && tab.badge > 0 && (
                    <motion.span
                      key={tab.badge}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full leading-none shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {tab.badge}
                    </motion.span>
                  )}

                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white rounded-xl -z-10 shadow-xs border border-indigo-200/80"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions, Compact Privacy Mode & Profile */}
        <div className="flex items-center gap-3">
          {/* Compact Switch with Tooltip */}
          <div className="relative">
            <button
              type="button"
              id="cloud-mode-compact-switch"
              onClick={handleToggle}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                !isCloudMode
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 ring-1 ring-emerald-500/20'
                  : 'bg-white border-[var(--border-color)] text-[var(--text-ink)] hover:border-indigo-300'
              }`}
              aria-label="Toggle Cloud vs Confidential Local Mode"
            >
              {isCloudMode ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[12px] font-semibold hidden sm:inline">Cloud (Gemini)</span>
                  <div className="w-7 h-4 bg-indigo-600 rounded-full relative p-0.5 transition-colors">
                    <motion.div
                      layout
                      className="w-3 h-3 bg-white rounded-full shadow-xs"
                      style={{ float: 'right' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[12px] font-semibold text-emerald-600 hidden sm:inline">Vault Air-Gapped</span>
                  <div className="w-7 h-4 bg-emerald-600 rounded-full relative p-0.5 transition-colors">
                    <motion.div
                      layout
                      className="w-3 h-3 bg-white rounded-full shadow-xs"
                      style={{ float: 'left' }}
                    />
                  </div>
                </>
              )}
            </button>

            {/* Compact Tooltip */}
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  className="absolute top-full mt-2 right-0 z-50 w-56 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed shadow-xl border border-slate-700 pointer-events-none"
                >
                  <p className="font-bold flex items-center gap-1.5 text-indigo-300 mb-0.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    {isCloudMode ? 'Cloud Auditing Active' : 'Confidential Vault Active'}
                  </p>
                  <p className="text-slate-300">
                    {isCloudMode
                      ? 'Gemini 3.8 Flash high-throughput multimodal intelligence.'
                      : 'Zero data retention on-premise Ollama execution.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notification Button */}
          <button
            className="relative p-2 rounded-xl text-[var(--text-soft-ink)] hover:text-[var(--text-ink)] hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* User Profile Avatar with Presence Dot & Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="navbar-user-profile-menu-btn"
              onClick={() => setShowProfileDropdown((prev) => !prev)}
              aria-expanded={showProfileDropdown}
              aria-haspopup="true"
              aria-label="User profile menu"
              className="flex items-center gap-2.5 pl-2 border-l border-[var(--border-color)] hover:opacity-90 transition-opacity cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
            >
              <div className="relative shrink-0">
                {avatarUrl && !imageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-8 h-8 rounded-full object-cover border border-[var(--border-color)] shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center border border-indigo-300 shadow-xs">
                    {initials}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden lg:block text-left">
                <div className="font-bold text-[13px] text-[var(--text-ink)] leading-tight max-w-[130px] truncate">
                  {fullName}
                </div>
                <div className="text-[11px] text-[var(--text-soft-ink)] font-medium">
                  {user ? 'Enterprise SSO' : 'Global Brand Director'}
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--text-muted)] hidden lg:block transition-transform duration-200 ${
                  showProfileDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Accessible Profile Dropdown */}
            <AnimatePresence>
              {showProfileDropdown && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3 z-50 text-left"
                  >
                    <div className="flex items-center gap-3 p-2 border-b border-slate-100 pb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                        {avatarUrl && !imageError ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt={fullName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[13px] text-slate-900 truncate">
                          {fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{email}</div>
                      </div>
                    </div>

                    <div className="py-2.5 px-2 text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Google Authenticated
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        SSO Active
                      </span>
                    <div className="pt-1 pb-1 border-t border-slate-100">
                      <Link
                        href="/account"
                        onClick={() => setShowProfileDropdown(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 text-[13px] font-semibold transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-indigo-600" />
                        <span>Account Dashboard</span>
                      </Link>
                    </div>

                    {onSignOut && (
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          id="navbar-dropdown-signout-btn"
                          disabled={isSigningOut}
                          onClick={async () => {
                            setIsSigningOut(true);
                            try {
                              setShowProfileDropdown(false);
                              await onSignOut();
                            } finally {
                              setIsSigningOut(false);
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {isSigningOut ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                              <span>Signing out...</span>
                            </>
                          ) : (
                            <>
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Nav Tabs Bar (one line on mobile) */}
      <div className="md:hidden flex items-center justify-around px-2 py-1.5 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-2 rounded-lg flex flex-col items-center gap-0.5 text-[11px] font-semibold ${
                isActive ? 'text-indigo-600 font-bold' : 'text-[var(--text-soft-ink)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
