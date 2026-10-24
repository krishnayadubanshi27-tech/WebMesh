'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanCard } from '@/types/brandmesh';
import { getScoreGrading, springTransition } from '@/utils';
import {
  Columns3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Check,
  X,
  ArrowRight,
  Search,
  Sparkles,
  GitCompare,
  FileText,
  RotateCcw,
  SendHorizontal,
  Flame,
  FileCheck,
  ShieldCheck,
  GripVertical,
  Database,
  RefreshCw,
} from 'lucide-react';
import { fetchSubmissions, mapSubmissionToKanbanCard } from '@/supabase';


interface ApprovalHubTabProps {
  cards: KanbanCard[];
  setCards: React.Dispatch<React.SetStateAction<KanbanCard[]>>;
}

export const ApprovalHubTab: React.FC<ApprovalHubTabProps> = ({
  cards,
  setCards,
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Segmented Before | After | Diff view state per card (defaults to 'diff')
  const [diffViews, setDiffViews] = useState<Record<string, 'before' | 'after' | 'diff'>>({});

  // Interaction animation states
  const [approvingCardId, setApprovingCardId] = useState<string | null>(null);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [rejectModalCard, setRejectModalCard] = useState<KanbanCard | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState<string>(
    'Non-compliant superlatives & unhedged guarantees'
  );
  const [customRejectNote, setCustomRejectNote] = useState<string>('');

  // Supabase submissions fetch state
  const [isFetchingSupabase, setIsFetchingSupabase] = useState<boolean>(false);
  const [supabaseSyncedCount, setSupabaseSyncedCount] = useState<number>(0);

  // Fetch submissions from Supabase table on mount and when user clicks refresh
  const loadSubmissionsFromSupabase = async () => {
    setIsFetchingSupabase(true);
    try {
      const { data, error } = await fetchSubmissions();
      if (!error && data && data.length > 0) {
        setSupabaseSyncedCount(data.length);
        // SMART ROUTING LOGIC applied via mapSubmissionToKanbanCard:
        // - score >= 90 -> 'fast-track' ('Fast-Track Approved' column)
        // - score < 90 -> 'review' ('Manager Review Queue' column)
        const fetchedCards = data.map((sub, i) => mapSubmissionToKanbanCard(sub, i));

        setCards((prev) => {
          // Merge fetched cards while preventing duplicates
          const fetchedIds = new Set(fetchedCards.map((c) => c.id));
          const untouchedPrev = prev.filter((c) => !fetchedIds.has(c.id));
          return [...fetchedCards, ...untouchedPrev];
        });
      }
    } catch (err: unknown) {
      console.warn('Notice fetching Supabase submissions:', err);
    } finally {
      setIsFetchingSupabase(false);
    }
  };

  useEffect(() => {
    loadSubmissionsFromSupabase();
  }, []);


  // Approve action: triggers check burst, then moves card to fast-track
  const handleApprove = (id: string) => {
    setApprovingCardId(id);
    setTimeout(() => {
      setCards((prev) =>
        prev.map((card) =>
          card.id === id
            ? {
                ...card,
                status: 'fast-track' as const,
                score: Math.max(card.score, 94),
                notes: 'Approved by Global Brand Director (Elena Vance)',
              }
            : card
        )
      );
      setApprovingCardId(null);
    }, 450);
  };

  // Reject trigger: shakes card gently, then opens reason modal/popover
  const triggerReject = (card: KanbanCard) => {
    setShakingCardId(card.id);
    setTimeout(() => {
      setShakingCardId(null);
      setRejectModalCard(card);
    }, 380);
  };

  // Confirm rejection with reason
  const handleConfirmReject = () => {
    if (!rejectModalCard) return;
    const finalNote = customRejectNote.trim()
      ? `${selectedRejectReason}: ${customRejectNote.trim()}`
      : selectedRejectReason;

    setCards((prev) =>
      prev.map((card) =>
        card.id === rejectModalCard.id
          ? {
              ...card,
              status: 'changes' as const,
              notes: `Changes requested: ${finalNote}`,
            }
          : card
      )
    );
    setRejectModalCard(null);
    setCustomRejectNote('');
  };

  // Re-route to review
  const handleMoveToReview = (id: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? {
              ...card,
              status: 'review' as const,
            }
          : card
      )
    );
  };

  const filteredCards = cards.filter((card) => {
    const matchesDept =
      selectedDepartment === 'All' || card.department === selectedDepartment;
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.assetType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const fastTrackCards = filteredCards.filter((c) => c.status === 'fast-track');
  const reviewCards = filteredCards.filter((c) => c.status === 'review');
  const changesCards = filteredCards.filter((c) => c.status === 'changes');

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="surface-light frontify-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-primary uppercase tracking-wider">
            <Columns3 className="w-4 h-4 text-brand-primary" />
            <span>Multi-Stage Governance Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-[color:var(--fg)] tracking-tight mt-0.5">
            Approval <span className="aurora-text">Hub</span>
          </h1>
          <p className="text-xs text-[color:var(--fg-muted)] font-medium">
            Kanban workflow routing: automated fast-track clearances, manager diff reviews, and legal revision loops.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[color:var(--fg-subtle)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[color:var(--line)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary w-48 text-[color:var(--fg)] placeholder:text-[color:var(--fg-muted)] font-medium transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-[color:var(--line)]">
            {['All', 'Demand Gen', 'Sales Enablement', 'Product Marketing', 'Executive Comms'].map(
              (dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    selectedDepartment === dept
                      ? 'bg-white text-[color:var(--fg)] font-bold shadow-xs border border-[color:var(--line)]'
                      : 'text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] font-semibold'
                  }`}
                >
                  {dept === 'All' ? 'All Teams' : dept.split(' ')[0]}
                </button>
              )
            )}
          </div>
          {/* Supabase Live Connection & Sync Button */}
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-950 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase: {isFetchingSupabase ? 'Syncing...' : `${supabaseSyncedCount || fastTrackCards.length + reviewCards.length} Submissions`}</span>
            <button
              type="button"
              onClick={loadSubmissionsFromSupabase}
              disabled={isFetchingSupabase}
              title="Refresh submissions from Supabase"
              className="ml-1 p-1 hover:bg-emerald-500/20 rounded cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingSupabase ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Smart Routing & Draggable Kanban Hint Banner */}
      <div className="surface-light bg-indigo-50/70 border border-indigo-200/60 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-950">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Smart Routing Active:</strong> Submissions with score &ge; 90% map to <em>Fast-Track Approved</em>. Score &lt; 90% maps to <em>Manager Review Queue</em>.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-800">
          <GripVertical className="w-3.5 h-3.5 opacity-60" />
          <span>Cards are draggable horizontally across columns</span>
        </div>
      </div>


      {/* Kanban Board Columns: Horizontal Scroll with Snap on Mobile, 3-Grid on Desktop */}
      <div className="flex md:grid md:grid-cols-3 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 gap-6 items-start scrollbar-none">
        
        {/* COLUMN 1: Fast-Track Approved (Emerald Tint) */}
        {/* COLUMN 1: Fast-Track Approved (Emerald Tint) */}
        <div className="surface-light min-w-[320px] md:min-w-0 snap-center flex flex-col bg-emerald-500/[0.04] p-4.5 rounded-3xl border border-emerald-500/25 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                Fast-Track Approved
              </h2>
            </div>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/25">
              {fastTrackCards.length}
            </span>
          </div>

          <p className="text-[11px] text-[color:var(--fg-muted)] font-medium leading-relaxed">
            Auto-approved assets with Trust Score &ge; 90%. Cleared for immediate multi-channel distribution.
          </p>

          <div className="space-y-3.5 min-h-[320px]">
            <AnimatePresence mode="popLayout">
              {fastTrackCards.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-dashed border-emerald-500/25 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-2 bg-emerald-500/[0.02]"
                >
                  <Sparkles className="w-8 h-8 text-emerald-500/50 animate-pulse" />
                  <p className="text-xs font-black text-[color:var(--fg)]">No Fast-Track Assets</p>
                  <p className="text-[11px] text-[color:var(--fg-muted)] font-medium max-w-[220px]">
                    Submissions scoring &ge; 90% automatically bypass review queues and land here.
                  </p>
                </motion.div>
              ) : (
                fastTrackCards.map((card) => {
                  const grading = getScoreGrading(card.score);
                  return (
                    <motion.div
                      key={card.id}
                      layout
                      layoutId={card.id}
                      drag
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                      dragElastic={0.35}
                      whileDrag={{
                        scale: 1.04,
                        rotate: 1.5,
                        zIndex: 50,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        cursor: 'grabbing',
                      }}
                      onDragEnd={(_e, info) => {
                        // Drag right to route to Manager Review Queue
                        if (info.offset.x > 80) {
                          handleMoveToReview(card.id);
                        }
                      }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4, rotate: 0.5, transition: springTransition }}
                      transition={springTransition}
                      className="surface-light p-4 rounded-2xl bg-white border border-emerald-500/25 shadow-xs hover:shadow-md transition-shadow space-y-3 relative group cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span title="Drag card horizontally to route across columns" className="inline-flex items-center">
                            <GripVertical className="w-3.5 h-3.5 text-[color:var(--fg-subtle)] group-hover:text-[color:var(--fg)] shrink-0 transition-colors" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--fg-muted)] bg-slate-100 px-2 py-0.5 rounded border border-[color:var(--line)]">
                            {card.assetType}
                          </span>
                        </div>


                        <span
                          className="text-xs font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1"
                          style={{
                            backgroundColor: `${grading.hex}15`,
                            color: grading.hex,
                            borderColor: `${grading.hex}35`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: grading.hex }} />
                          {card.score}% Trust
                        </span>
                      </div>

                      <h3 className="text-xs font-black text-[color:var(--fg)] leading-snug">
                        {card.title}
                      </h3>

                      <div className="p-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 text-[11px] text-[color:var(--fg)] font-medium line-clamp-2 italic">
                        &quot;{card.afterText}&quot;
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[color:var(--line)] text-[11px]">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.author.avatar}
                            alt={card.author.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-border-card"
                          />
                          <span className="text-[color:var(--fg)] font-bold">{card.author.name}</span>
                        </div>
                        <span className="text-[10px] text-[color:var(--fg-muted)] font-semibold">{card.timestamp}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Ready to Publish
                        </span>
                        <button
                          onClick={() => handleMoveToReview(card.id)}
                          className="text-[10px] font-bold text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] cursor-pointer hover:underline"
                        >
                          Re-evaluate
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 2: Manager Review Queue (Amber Tint with Before | After | Diff sliding toggle) */}
        <div className="surface-light min-w-[320px] md:min-w-0 snap-center flex flex-col bg-amber-500/[0.04] p-4.5 rounded-3xl border border-amber-500/25 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-950">
                Manager Review Queue
              </h2>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/25">
              {reviewCards.length}
            </span>
          </div>

          <p className="text-[11px] text-[color:var(--fg-muted)] font-medium leading-relaxed">
            Assets with unhedged claims or tone deviation requiring human sign-off before distribution.
          </p>

          <div className="space-y-4 min-h-[320px]">
            <AnimatePresence mode="popLayout">
              {reviewCards.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-dashed border-amber-500/25 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-2 bg-amber-500/[0.02]"
                >
                  <FileCheck className="w-8 h-8 text-amber-500/50" />
                  <p className="text-xs font-black text-[color:var(--fg)]">Queue Completely Clear</p>
                  <p className="text-[11px] text-[color:var(--fg-muted)] font-medium max-w-[220px]">
                    No submissions currently awaiting manager approval. All clear!
                  </p>
                </motion.div>
              ) : (
                reviewCards.map((card) => {
                  const currentView = diffViews[card.id] || 'diff';
                  const isApproving = approvingCardId === card.id;
                  const isShaking = shakingCardId === card.id;
                  const grading = getScoreGrading(card.score);

                  return (
                    <motion.div
                      key={card.id}
                      layout
                      layoutId={card.id}
                      drag
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                      dragElastic={0.35}
                      whileDrag={{
                        scale: 1.04,
                        rotate: -1.5,
                        zIndex: 50,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        cursor: 'grabbing',
                      }}
                      onDragEnd={(_e, info) => {
                        // Drag left to auto-approve, drag right to trigger changes
                        if (info.offset.x < -80) {
                          handleApprove(card.id);
                        } else if (info.offset.x > 80) {
                          triggerReject(card);
                        }
                      }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={
                        isShaking
                          ? { x: [0, -8, 8, -6, 6, -3, 3, 0], opacity: 1 }
                          : { opacity: 1, y: 0, x: 0 }
                      }
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4, rotate: 0.5, transition: springTransition }}
                      transition={springTransition}
                      className="surface-light p-4 rounded-2xl bg-white border border-amber-500/30 shadow-xs hover:shadow-md transition-shadow space-y-3.5 relative overflow-hidden cursor-grab active:cursor-grabbing"
                    >
                      {/* Check burst overlay during approval */}
                      <AnimatePresence>
                        {isApproving && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-emerald-500/95 z-20 flex flex-col items-center justify-center text-white space-y-2 backdrop-blur-xs"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.3, 1] }}
                              transition={{ duration: 0.35 }}
                              className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg"
                            >
                              <Check className="w-7 h-7 stroke-[3]" />
                            </motion.div>
                            <span className="text-xs font-black uppercase tracking-wider">
                              Approved & Fast-Tracked!
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Header meta */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span title="Drag left to Approve, drag right to Request Changes" className="inline-flex items-center">
                            <GripVertical className="w-3.5 h-3.5 text-[color:var(--fg-subtle)] hover:text-[color:var(--fg)] shrink-0 transition-colors" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--fg-muted)] bg-slate-100 px-2 py-0.5 rounded border border-[color:var(--line)]">
                            {card.assetType}
                          </span>


                          <span className="text-[10px] font-bold text-[color:var(--fg-muted)]">
                            • {card.department.split(' ')[0]}
                          </span>
                        </div>

                        {/* Mini score chip & SLA timer */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-black px-2 py-0.5 rounded-full border flex items-center gap-1"
                            style={{
                              backgroundColor: `${grading.hex}15`,
                              color: grading.hex,
                              borderColor: `${grading.hex}35`,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: grading.hex }} />
                            {card.score}%
                          </span>

                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/25">
                            <Clock className="w-3 h-3 text-amber-600" />
                            2h 45m SLA
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xs font-black text-[color:var(--fg)] leading-snug">
                        {card.title}
                      </h3>

                      {/* Before | After | Diff Segmented Control with Sliding Thumb */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-[color:var(--line)] space-y-2.5 text-[11px]">
                        <div className="flex items-center justify-between border-b border-[color:var(--line)] pb-2">
                          <span className="flex items-center gap-1 font-black text-[10px] uppercase tracking-wider text-[color:var(--fg)]">
                            <GitCompare className="w-3 h-3 text-brand-primary" />
                            Inspection View
                          </span>
                          <span className="text-rose-600 font-black text-[10px] bg-rose-500/10 px-2 py-0.2 rounded border border-rose-500/20">
                            {card.criticalViolations} Flags
                          </span>
                        </div>

                        {/* Sliding Thumb Segmented Button */}
                        <div className="relative flex items-center bg-white p-1 rounded-xl border border-[color:var(--line)] text-[11px] font-bold">
                          {(['diff', 'before', 'after'] as const).map((viewKey) => {
                            const isActive = currentView === viewKey;
                            return (
                              <button
                                key={viewKey}
                                onClick={() =>
                                  setDiffViews((prev) => ({ ...prev, [card.id]: viewKey }))
                                }
                                className={`relative flex-1 py-1 text-center capitalize transition-colors z-10 cursor-pointer ${
                                  isActive ? 'text-[color:var(--fg)] font-black' : 'text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] font-bold'
                                }`}
                              >
                                {isActive && (
                                  <motion.div
                                    layoutId={`diff-slider-${card.id}`}
                                    transition={springTransition}
                                    className="absolute inset-0 bg-brand-primary/10 border border-brand-primary/30 rounded-lg shadow-xs"
                                  />
                                )}
                                <span className="relative z-10">
                                  {viewKey === 'diff' ? 'Diff Matrix' : viewKey}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* View Content based on Segmented Selection */}
                        <div className="min-h-[72px] flex flex-col justify-center">
                          {currentView === 'before' && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-rose-800 bg-rose-500/15 px-1.5 py-0.2 rounded border border-rose-500/25">
                                Original Draft Copy:
                              </span>
                              <p className="text-rose-950 font-medium line-through decoration-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-200 leading-relaxed">
                                {card.beforeText}
                              </p>
                            </div>
                          )}

                          {currentView === 'after' && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/25">
                                Proposed Compliant Copy:
                              </span>
                              <p className="text-emerald-950 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200 leading-relaxed">
                                {card.afterText}
                              </p>
                            </div>
                          )}

                          {currentView === 'diff' && (
                            <div className="space-y-2">
                              <p className="text-rose-950 font-medium text-[11px] line-through decoration-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-200">
                                {card.beforeText}
                              </p>
                              <p className="text-emerald-950 font-bold text-[11px] bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                                {card.afterText}
                              </p>
                              {card.diffSummary && (
                                <div className="flex flex-wrap items-center gap-1 pt-1">
                                  {card.diffSummary.removed.map((r, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-bold line-through bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded border border-rose-300"
                                    >
                                      -{r}
                                    </span>
                                  ))}
                                  {card.diffSummary.added.map((a, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded border border-emerald-300"
                                    >
                                      +{a}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Author Meta */}
                      <div className="flex items-center justify-between text-[11px] text-[color:var(--fg-muted)] pt-1 border-t border-[color:var(--line)]">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.author.avatar}
                            alt={card.author.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-border-card"
                          />
                          <span className="font-bold text-[color:var(--fg)]">{card.author.name}</span>
                        </div>
                        <span className="text-[10px] text-[color:var(--fg-muted)] font-semibold">{card.timestamp}</span>
                      </div>

                      {/* Action Buttons: Reject & Approve */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          id={`reject-btn-${card.id}`}
                          onClick={() => triggerReject(card)}
                          className="py-2 px-3 text-xs font-bold text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          id={`approve-btn-${card.id}`}
                          onClick={() => handleApprove(card.id)}
                          className="aurora-button py-2 px-3 text-xs font-bold text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Approve</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 3: Changes Requested (Rose Tint) */}
        <div className="surface-light min-w-[320px] md:min-w-0 snap-center flex flex-col bg-rose-500/[0.04] p-4.5 rounded-3xl border border-rose-500/25 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-rose-950">
                Changes Requested
              </h2>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-800 border border-rose-500/25">
              {changesCards.length}
            </span>
          </div>

          <p className="text-[11px] text-[color:var(--fg-muted)] font-medium leading-relaxed">
            Assets returned to author for claim qualification or terminology rewrite before re-submission.
          </p>

          <div className="space-y-3.5 min-h-[320px]">
            <AnimatePresence mode="popLayout">
              {changesCards.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-dashed border-rose-500/25 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-2 bg-rose-500/[0.02]"
                >
                  <ShieldCheck className="w-8 h-8 text-rose-500/50" />
                  <p className="text-xs font-black text-[color:var(--fg)]">Zero Open Change Loops</p>
                  <p className="text-[11px] text-[color:var(--fg-muted)] font-medium max-w-[220px]">
                    No assets have active legal or brand revisions pending.
                  </p>
                </motion.div>
              ) : (
                changesCards.map((card) => {
                  const grading = getScoreGrading(card.score);
                  return (
                    <motion.div
                      key={card.id}
                      layout
                      layoutId={card.id}
                      drag
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                      dragElastic={0.35}
                      whileDrag={{
                        scale: 1.04,
                        rotate: -1.5,
                        zIndex: 50,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        cursor: 'grabbing',
                      }}
                      onDragEnd={(_e, info) => {
                        // Drag left to route back to Manager Review Queue
                        if (info.offset.x < -80) {
                          handleMoveToReview(card.id);
                        }
                      }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4, rotate: 0.5, transition: springTransition }}
                      transition={springTransition}
                      className="surface-light p-4 rounded-2xl bg-white border border-rose-500/30 shadow-xs hover:shadow-md transition-shadow space-y-3 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span title="Drag left to Re-open for Manager Review" className="inline-flex items-center">
                            <GripVertical className="w-3.5 h-3.5 text-[color:var(--fg-subtle)] hover:text-[color:var(--fg)] shrink-0 transition-colors" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--fg-muted)] bg-slate-100 px-2 py-0.5 rounded border border-[color:var(--line)]">
                            {card.assetType}
                          </span>
                        </div>


                        <span
                          className="text-xs font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1"
                          style={{
                            backgroundColor: `${grading.hex}15`,
                            color: grading.hex,
                            borderColor: `${grading.hex}35`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: grading.hex }} />
                          Score: {card.score}%
                        </span>
                      </div>

                      <h3 className="text-xs font-black text-[color:var(--fg)] leading-snug">
                        {card.title}
                      </h3>

                      {card.notes && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-950 space-y-1">
                          <span className="font-black flex items-center gap-1 text-[10px] uppercase text-rose-800">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            Reviewer Feedback:
                          </span>
                          <p className="leading-relaxed font-medium">{card.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[color:var(--line)] text-[11px]">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.author.avatar}
                            alt={card.author.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-border-card"
                          />
                          <span className="text-[color:var(--fg)] font-bold">{card.author.name}</span>
                        </div>
                        <span className="text-[10px] text-[color:var(--fg-muted)] font-semibold">{card.timestamp}</span>
                      </div>

                      <button
                        onClick={() => handleMoveToReview(card.id)}
                        className="w-full py-2 px-3 text-xs font-black text-[color:var(--fg)] bg-white hover:bg-slate-100 border border-[color:var(--line)] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Re-open for Manager Review</span>
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Reject Reason Popover / Modal */}
      <AnimatePresence>
        {rejectModalCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={springTransition}
              className="surface-light w-full max-w-md bg-white border border-[color:var(--line)] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-500 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" />
                    <span>Request Changes</span>
                  </div>
                  <h3 className="text-base font-black text-[color:var(--fg)] mt-1">
                    Specify Rejection Rationale
                  </h3>
                  <p className="text-xs text-[color:var(--fg-muted)] font-medium">
                    Provide precise instructions to {rejectModalCard.author.name} before returning.
                  </p>
                </div>
                <button
                  onClick={() => setRejectModalCard(null)}
                  className="p-1.5 rounded-lg text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pre-canned Reason Options */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[color:var(--fg)] uppercase">
                  Select Primary Policy Reason
                </label>
                {[
                  'Non-compliant superlatives & unhedged guarantees',
                  'Unverified factual claim or missing legal citation',
                  'Tone deviates from authoritative enterprise baseline',
                  'Brand color contrast fails WCAG AA minimum',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedRejectReason(reason)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedRejectReason === reason
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-950 font-black'
                        : 'bg-white border-[color:var(--line)] text-[color:var(--fg)] hover:text-[color:var(--fg)] hover:bg-slate-50 font-semibold'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {/* Optional Custom Note */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-[color:var(--fg)] uppercase">
                  Add Contextual Directives (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customRejectNote}
                  onChange={(e) => setCustomRejectNote(e.target.value)}
                  placeholder="e.g. Please replace 'guarantee' with SLA commitment and route through Legal counsel..."
                  className="w-full text-xs p-3 bg-white border border-[color:var(--line)] rounded-xl text-[color:var(--fg)] placeholder:text-[color:var(--fg-muted)] font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[color:var(--line)]">
                <button
                  onClick={() => setRejectModalCard(null)}
                  className="px-4 py-2 text-xs font-bold text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <SendHorizontal className="w-3.5 h-3.5" />
                  <span>Send to Changes Requested</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
