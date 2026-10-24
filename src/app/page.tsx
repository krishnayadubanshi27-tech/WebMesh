'use client';

import React, { useState, useEffect } from 'react';
import { TabType, BannedTerm, KanbanCard } from '@/types/brandmesh';
import {
  INITIAL_BANNED_TERMS,
  INITIAL_VERIFIED_FACTS,
  INITIAL_COLOR_SWATCHES,
  INITIAL_A11Y_RULES,
  INITIAL_KANBAN_CARDS,
  TOP_VIOLATED_RULES,
  DEPARTMENT_METRICS,
} from '@/data/mockData';
import { useAuditStore } from '@/store';
import { Navbar } from '@/components/Navbar';
import { ConfidentialBanner } from '@/components/ConfidentialBanner';
import { BrandBrainTab } from '@/components/BrandBrainTab';
import { StudioTab } from '@/components/StudioTab';
import { ApprovalHubTab } from '@/components/ApprovalHubTab';
import { InsightsTab } from '@/components/InsightsTab';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('studio'); // default to Studio for immediate impact
  const { isCloudMode } = useAuditStore();
  const [bannedTerms, setBannedTerms] = useState<BannedTerm[]>(INITIAL_BANNED_TERMS);
  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>(INITIAL_KANBAN_CARDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Vault Mode to root HTML document for smooth variable transitions
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (!isCloudMode) {
        document.documentElement.classList.add('vault-mode');
      } else {
        document.documentElement.classList.remove('vault-mode');
      }
    }
  }, [isCloudMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Route newly audited copy from Studio to Approval Hub
  const handleRouteToApprovals = (newCard: KanbanCard) => {
    setKanbanCards((prev) => [newCard, ...prev]);
    setActiveTab('approvals');
    showToast(`Successfully routed "${newCard.title}" to ${newCard.status === 'fast-track' ? 'Fast-Track Approved' : 'Manager Review Queue'}!`);
  };

  // Guideline Doctor recommendation acceptance
  const handleAcceptDoctorRecommendation = () => {
    // Relaxes the absolute ban on guarantee to allow conditional SLA terms
    setBannedTerms((prev) =>
      prev.map((term) =>
        term.term === 'guarantee'
          ? {
              ...term,
              severity: 'warning',
              reason: 'Simplified by Guideline Doctor: Conditional commitments permitted when hyperlinked to Enterprise SLA Schedule.',
              approvedAlternatives: [
                'commit with SLA backing',
                'deliver verified reliability',
                'guarantee (with SLA link)',
              ],
            }
          : term
      )
    );
    showToast('Guideline Doctor recommendation applied: Rule #LG-02 relaxed to permit qualified SLA commitments.');
  };

  const pendingApprovalsCount = kanbanCards.filter((c) => c.status === 'review').length;

  return (
    <div className="min-h-screen flex flex-col relative transition-colors duration-500 overflow-x-hidden">
      {/* Atmosphere: Slow-drifting blurred gradient blobs (Phase 1) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/8 to-pink-500/5 blur-[120px] ambient-blob-1" />
        <div className="absolute top-[35%] -right-[15%] w-[680px] h-[680px] rounded-full bg-gradient-to-bl from-violet-500/10 via-teal-500/8 to-indigo-500/5 blur-[140px] ambient-blob-2" />
        {!isCloudMode && (
          <div className="absolute inset-0 vault-grid-bg opacity-30" />
        )}
      </div>

      {/* Sticky Enterprise Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Expandable Confidential Ollama Zero-Retention Security Banner */}
      <ConfidentialBanner isActive={!isCloudMode} />

      {/* Main Container: Full screen immersive enterprise workspace */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'brain' && (
            <motion.div
              key="brain"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <BrandBrainTab
                bannedTerms={bannedTerms}
                setBannedTerms={setBannedTerms}
                verifiedFacts={INITIAL_VERIFIED_FACTS}
                colorSwatches={INITIAL_COLOR_SWATCHES}
                a11yRules={INITIAL_A11Y_RULES}
              />
            </motion.div>
          )}

          {activeTab === 'studio' && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <StudioTab
                bannedTerms={bannedTerms}
                onRouteToApprovals={handleRouteToApprovals}
              />
            </motion.div>
          )}

          {activeTab === 'approvals' && (
            <motion.div
              key="approvals"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <ApprovalHubTab cards={kanbanCards} setCards={setKanbanCards} />
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <InsightsTab
                topViolations={TOP_VIOLATED_RULES}
                departmentMetrics={DEPARTMENT_METRICS}
                onAcceptDoctorRecommendation={handleAcceptDoctorRecommendation}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Enterprise Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 text-[13px] font-semibold flex items-center gap-3 max-w-md backdrop-blur-md"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto border-t border-[color:var(--line)] bg-white/70 backdrop-blur-md surface-light py-6 transition-colors">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[color:var(--fg-muted)]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[color:var(--fg)]">BrandMesh</span>
            <span>• Frontify & Acrolinx Enterprise Compliance Standard</span>
          </div>
          <div className="flex items-center gap-4 text-[color:var(--fg-subtle)]">
            <span>SOC2 Type II Certified</span>
            <span>•</span>
            <span>WCAG 2.2 AAA Compliant</span>
            <span>•</span>
            <span>Local Ollama Air-Gapped Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
