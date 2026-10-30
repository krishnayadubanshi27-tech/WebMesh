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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-800 shadow-xl relative overflow-hidden">
        {/* Top accent gradient bar matching ProfileCard */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
            <Columns3 className="w-4 h-4 text-indigo-600" />
            <span>Multi-Stage Governance Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Approval <span className="aurora-text">Hub</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Kanban workflow routing: automated fast-track clearances, manager diff reviews, and legal revision loops.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48 text-slate-900 placeholder:text-slate-400 font-medium transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
            {['All', 'Demand Gen', 'Sales Enablement', 'Product Marketing', 'Executive Comms'].map(
              (dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    selectedDepartment === dept
                      ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
                >
                  {dept === 'All' ? 'All Teams' : dept.split(' ')[0]}
                </button>
              )
            )}
          </div>
          {/* Supabase Live Connection & Sync Button */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase: {isFetchingSupabase ? 'Syncing...' : `${supabaseSyncedCount || fastTrackCards.length + reviewCards.length} Submissions`}</span>
            <button
              type="button"
              onClick={loadSubmissionsFromSupabase}
              disabled={isFetchingSupabase}
              title="Refresh submissions from Supabase"
              className="ml-1 p-1 hover:bg-emerald-100/70 text-emerald-700 rounded cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingSupabase ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Smart Routing & Draggable Kanban Hint Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong className="text-slate-900 font-bold">Smart Routing Active:</strong>{' '}
            <span className="text-slate-600">Submissions with score &ge; 90% map to </span>
            <span className="text-emerald-600 font-bold">Fast-Track Approved</span>
            <span className="text-slate-600">. Score &lt; 90% maps to </span>
            <span className="text-amber-600 font-bold">Manager Review Queue</span>.
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
          <GripVertical className="w-3.5 h-3.5 text-indigo-600" />
          <span>Cards are draggable horizontally across columns</span>
        </div>
      </div>


      {/* Kanban Board Columns: Horizontal Scroll with Snap on Mobile, 3-Grid on Desktop */}
      <div className="flex md:grid md:grid-cols-3 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 gap-6 items-start scrollbar-none">
        
        {/* COLUMN 1: Fast-Track Approved */}
        <div className="min-w-[320px] md:min-w-0 snap-center flex flex-col bg-slate-100/70 p-4.5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-600">
                Fast-Track Approved
              </h2>
            </div>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {fastTrackCards.length}
            </span>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Auto-approved assets with Trust Score &ge; 90%. Cleared for immediate multi-channel distribution.
          </p>

          <div className="space-y-3.5 min-h-[320px]">
            <AnimatePresence mode="popLayout">
              {fastTrackCards.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-dashed border-emerald-500/25 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-2 bg-slate-900/40"
                >
                  <Sparkles className="w-8 h-8 text-emerald-500/50 animate-pulse" />
                  <p className="text-xs font-black text-slate-200">No Fast-Track Assets</p>
                  <p className="text-xs text-slate-300 font-medium max-w-[220px]">
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
                      className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md hover:shadow-lg transition-shadow space-y-3 relative group cursor-grab active:cursor-grabbing text-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span title="Drag card horizontally to route across columns" className="inline-flex items-center">
                            <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0 transition-colors" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
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

                      <h3 className="text-xs font-black text-white leading-snug">
                        {card.title}
                      </h3>

                      <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-100 font-medium line-clamp-2 italic leading-relaxed">
                        &quot;{card.afterText}&quot;
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px]">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.author.avatar}
                            alt={card.author.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-600"
                          />
                          <span className="text-white font-bold">{card.author.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-300 font-medium">{card.timestamp}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Ready to Publish
                        </span>
                        <button
                          onClick={() => handleMoveToReview(card.id)}
                          className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer hover:underline transition-colors"
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

        {/* COLUMN 2: Manager Review Queue */}
        <div className="min-w-[320px] md:min-w-0 snap-center flex flex-col bg-slate-100/70 p-4.5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-600">
                Manager Review Queue
              </h2>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {reviewCards.length}
            </span>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Assets with unhedged claims or tone deviation requiring human sign-off before distribution.
          </p>

          <div className="space-y-4 min-h-[320px]">
            <AnimatePresence mode="popLayout">
              {reviewCards.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-dashed border-amber-500/25 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-2 bg-slate-900/40"
                >
                  <FileCheck className="w-8 h-8 text-amber-500/50" />
                  <p className="text-xs font-black text-slate-200">Queue Completely Clear</p>
                  <p className="text-xs text-slate-300 font-medium max-w-[220px]">
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
                          ? {
                              x: [0, -8, 8, -6, 6, -3, 3, 0],
                              opacity: 1,
                              transition: {
                                x: { duration: 0.38, ease: 'easeInOut' },
                              },
                            }
                          : { opacity: 1, y: 0, x: 0 }
                      }
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4, rotate: 0.5, transition: springTransition }}
                      transition={
                        isShaking
                          ? {
                              x: { duration: 0.38, ease: 'easeInOut' },
                              default: springTransition,
                            }
                          : springTransition
                      }
                      className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md hover:shadow-lg transition-shadow space-y-3.5 relative overflow-hidden cursor-grab active:cursor-grabbing text-white"
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
                            <GripVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 shrink-0 transition-colors" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                            {card.assetType}
                          </span>


                          <span className="text-[11px] font-bold text-slate-300">
                            • {card.department.split(' ')[0]}
                          </span>
                        </div>

                        {/* Mini score chip & SLA timer */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1"
                            style={{
                              backgroundColor: `${grading.hex}25`,
                              color: grading.hex,
                              borderColor: `${grading.hex}50`,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: grading.hex }} />
                            {card.score}%
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-200 bg-amber-500/25 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            2h 45m SLA
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xs font-black text-white leading-snug">
                        {card.title}
                      </h3>

                      {/* Before | After | Diff Segmented Control with Sliding Thumb */}
                      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-2.5 text-[11px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-200">
                            <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                            Inspection View
                          </span>
                          <span className="text-rose-200 font-black text-xs bg-rose-500/25 px-2.5 py-0.5 rounded border border-rose-500/40">
                            {card.criticalViolations} Flags
                          </span>
                        </div>

                        {/* Sliding Thumb Segmented Button */}
                        <div className="relative flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                          {(['diff', 'before', 'after'] as const).map((viewKey) => {
                            const isActive = currentView === viewKey;
                            return (
                              <button
                                key={viewKey}
                                onClick={() =>
                                  setDiffViews((prev) => ({ ...prev, [card.id]: viewKey }))
                                }
                                className={`relative flex-1 py-1.5 text-center capitalize transition-colors z-10 cursor-pointer ${
                                  isActive ? 'text-white font-black' : 'text-slate-300 hover:text-white font-bold'
                                }`}
                              >
                                {isActive && (
                                  <motion.div
                                    layoutId={`diff-slider-${card.id}`}
                                    transition={springTransition}
                                    className="absolute inset-0 bg-indigo-600/40 border border-indigo-400/50 rounded-lg shadow-xs"
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
                            <div className="space-y-1.5">
                              <span className="text-xs font-black uppercase text-rose-200 bg-rose-500/25 px-2 py-0.5 rounded border border-rose-500/40">
                                Original Draft Copy:
                              </span>
                              <p className="text-rose-100 font-medium line-through decoration-rose-400/80 bg-rose-950/60 p-2.5 rounded-lg border border-rose-700/60 leading-relaxed text-xs">
                                {card.beforeText}
                              </p>
                            </div>
                          )}

                          {currentView === 'after' && (
                            <div className="space-y-1.5">
                              <span className="text-xs font-black uppercase text-emerald-200 bg-emerald-500/25 px-2 py-0.5 rounded border border-emerald-500/40">
                                Proposed Compliant Copy:
                              </span>
                              <p className="text-emerald-100 font-bold bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-700/60 leading-relaxed text-xs">
                                {card.afterText}
                              </p>
                            </div>
                          )}

                          {currentView === 'diff' && (
                            <div className="space-y-2">
                              <p className="text-rose-100 font-medium text-xs line-through decoration-rose-400/80 bg-rose-950/60 p-2.5 rounded-lg border border-rose-700/60 leading-relaxed">
                                {card.beforeText}
                              </p>
                              <p className="text-emerald-100 font-bold text-xs bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-700/60 leading-relaxed">
                                {card.afterText}
                              </p>
                              {card.diffSummary && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  {card.diffSummary.removed.map((r, i) => (
                                    <span
                                      key={i}
                                      className="text-xs font-bold line-through bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded border border-rose-600/60 shadow-2xs"
                                    >
                                      -{r}
                                    </span>
                                  ))}
                                  {card.diffSummary.added.map((a, i) => (
                                    <span
                                      key={i}
                                      className="text-xs font-black bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded border border-emerald-600/60 shadow-2xs"
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
                      <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-700/60">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.author.avatar}
                            alt={card.author.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-600"
                          />
                          <span className="font-bold text-white">{card.author.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-300 font-medium">{card.timestamp}</span>
                      </div>

                      {/* Action Buttons: Reject & Approve */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          id={`reject-btn-${card.id}`}
                          onClick={() => triggerReject(card)}
                          className="py-2.5 px-3 text-xs font-bold text-rose-200 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/50 hover:border-rose-400 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                        >
                          <X className="w-4 h-4 text-rose-400" />
                          <span>Reject</span>
                        </button>

                        <button
                          id={`approve-btn-${card.id}`}
                          onClick={() => handleApprove(card.id)}
                          className="aurora-button py-2.5 px-3 text-xs font-bold text-white rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
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

        {/* COLUMN 3: Changes Requested */}
        <div className="min-w-[320px] md:min-w-0 snap-center flex flex-col bg-slate-100/70 p-4.5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-rose-600">
                Changes Requested
              </h2>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {changesCards.length}
            </span>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Assets returned to author for claim qualification or terminology rewrite before re-submission.
          </p>

          <div className="space-y-3.5 min-h-[320px]">
            <AnimatePresence mode="popLayout">
              {changesCards.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-dashed border-rose-500/25 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-2 bg-slate-900/40"
                >
                  <ShieldCheck className="w-8 h-8 text-rose-500/50" />
                  <p className="text-xs font-black text-slate-200">Zero Open Change Loops</p>
                  <p className="text-xs text-slate-300 font-medium max-w-[220px]">
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
                      className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md hover:shadow-lg transition-shadow space-y-3 cursor-grab active:cursor-grabbing text-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span title="Drag left to Re-open for Manager Review" className="inline-flex items-center">
                            <GripVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 shrink-0 transition-colors" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                            {card.assetType}
                          </span>
                        </div>


                        <span
                          className="text-xs font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 bg-rose-500/20 text-rose-300 border-rose-500/40"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Score: {card.score}%
                        </span>
                      </div>

                      <h3 className="text-xs font-black text-white leading-snug">
                        {card.title}
                      </h3>

                      {card.notes && (
                        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs space-y-1.5">
                          <span className="font-black flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-300">
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            Reviewer Feedback:
                          </span>
                          <p className="leading-relaxed font-medium text-slate-200">{card.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.author.avatar}
                            alt={card.author.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-600"
                          />
                          <span className="text-white font-bold">{card.author.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-300 font-medium">{card.timestamp}</span>
                      </div>

                      <button
                        onClick={() => handleMoveToReview(card.id)}
                        className="w-full py-2.5 px-3 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                      >
                        <RotateCcw className="w-4 h-4 text-indigo-400" />
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
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-400 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" />
                    <span>Request Changes</span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">
                    Specify Rejection Rationale
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Provide precise instructions to {rejectModalCard.author.name} before returning.
                  </p>
                </div>
                <button
                  onClick={() => setRejectModalCard(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pre-canned Reason Options */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-300 uppercase">
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
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 font-black'
                        : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700/80 font-semibold'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {/* Optional Custom Note */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-300 uppercase">
                  Add Contextual Directives (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customRejectNote}
                  onChange={(e) => setCustomRejectNote(e.target.value)}
                  placeholder="e.g. Please replace 'guarantee' with SLA commitment and route through Legal counsel..."
                  className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setRejectModalCard(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-colors"
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
