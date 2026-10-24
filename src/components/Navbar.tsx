'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuditStore } from '@/store';
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
} from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  confidentialMode?: boolean;
  setConfidentialMode?: (mode: boolean | ((prev: boolean) => boolean)) => void;
  pendingApprovalsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  setConfidentialMode,
  pendingApprovalsCount = 2,
}) => {
  const { isCloudMode, toggleCloudMode } = useAuditStore();
  const [showTooltip, setShowTooltip] = useState(false);

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
    <header className="sticky top-0 z-50 w-full h-16 frontify-glass transition-colors">
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

          {/* User Profile Avatar with Presence Dot */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-[var(--border-color)]">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
                alt="Elena Vance"
                className="w-8 h-8 rounded-full object-cover border border-[var(--border-color)] shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="font-bold text-[13px] text-[var(--text-ink)] leading-tight">Elena Vance</div>
              <div className="text-[11px] text-[var(--text-soft-ink)] font-medium">Global Brand Director</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] hidden lg:block" />
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
