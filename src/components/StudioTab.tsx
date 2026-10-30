'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BannedTerm,
  IntentPreset,
  KanbanCard,
  Severity,
} from '@/types/brandmesh';
import { STUDIO_PRESETS } from '@/data/mockData';
import { CircularGauge } from './CircularGauge';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Wand2,
  CheckCircle2,
  Send,
  Upload,
  Image as ImageIcon,
  Check,
  Zap,
  Play,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Eye,
  FileEdit,
  X,
  Info,
} from 'lucide-react';
import AuditorUI from './AuditorUI';
import { OverlayTextEditor } from './OverlayTextEditor';
import { useAuditStore } from '@/store';
import { springTransition, smoothEasing } from '@/utils';
import { insertSubmission } from '@/supabase';


interface StudioTabProps {
  bannedTerms: BannedTerm[];
  onRouteToApprovals: (newCard: KanbanCard) => void;
}

interface DetectedIssue {
  id: string;
  word: string;
  ruleCode: string;
  ruleName: string;
  type: 'deterministic' | 'ai';
  severity: Severity;
  explanation: string;
  replacement: string;
  category?: string;
  resolved?: boolean;
}

export const StudioTab: React.FC<StudioTabProps> = ({
  bannedTerms,
  onRouteToApprovals,
}) => {
  const activeBrandId = useAuditStore((s) => s.activeBrandId);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(STUDIO_PRESETS[0].id);
  const [content, setContent] = useState<string>(STUDIO_PRESETS[0].content);
  const [intent, setIntent] = useState<IntentPreset>('balanced');
  const [viewMode, setViewMode] = useState<'inspect' | 'edit'>('edit');

  // Extract raw terms for deterministic live highlighter overlay
  const bannedWordsList = useMemo(() => {
    return (bannedTerms || []).map((bt) => bt.term).filter(Boolean);
  }, [bannedTerms]);
  const [activeTooltipIssue, setActiveTooltipIssue] = useState<DetectedIssue | null>(null);
  const [activeIssueTab, setActiveIssueTab] = useState<'all' | 'deterministic' | 'ai'>('all');
  const [isApplyingFix, setIsApplyingFix] = useState<boolean>(false);
  const [hasAppliedFix, setHasAppliedFix] = useState<boolean>(false);
  const [activeStudioMode, setActiveStudioMode] = useState<'copilot' | 'auditor'>('copilot');
  const [isSubmittingToSupabase, setIsSubmittingToSupabase] = useState<boolean>(false);


  // Scanning beam state
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Logo upload state & drag-over
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isVerifyingAsset, setIsVerifyingAsset] = useState<boolean>(false);
  const [uploadedLogo, setUploadedLogo] = useState<{
    name: string;
    clearSpacePass: boolean;
    contrastRatio: string;
    palettePass: boolean;
  } | null>(null);

  // Dismissed/ignored issues
  const [ignoredIssueIds, setIgnoredIssueIds] = useState<Set<string>>(new Set());

  // Trigger Scanning Beam down the editor
  const handleTriggerAuditScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 750);
  };

  // Real-time compliance scanner
  const detectedIssues = useMemo(() => {
    if (hasAppliedFix) return [];

    const issues: DetectedIssue[] = [];

    // Deterministic Rule Gate (from active Banned Terms)
    const seenWords = new Set<string>();
    bannedTerms.forEach((bt) => {
      const cleanWord = bt.term.toLowerCase();
      if (seenWords.has(cleanWord)) return;
      const regex = new RegExp(`\\b${bt.term}\\b`, 'gi');
      if (regex.test(content) && !ignoredIssueIds.has(`det-${cleanWord}`)) {
        seenWords.add(cleanWord);
        issues.push({
          id: `det-${cleanWord}`,
          word: bt.term,
          ruleCode: bt.id.toUpperCase(),
          ruleName: `Prohibited Term: "${bt.term}"`,
          type: 'deterministic',
          severity: bt.severity,
          explanation: bt.reason,
          replacement: bt.approvedAlternatives[0] || 'standardized phrasing',
          category: bt.category || 'Tone',
        });
      }
    });

    // AI Tone & Legal Claim Violations
    if (
      (content.toLowerCase().includes('100%') || content.toLowerCase().includes('guarantee')) &&
      !ignoredIssueIds.has('ai-claim-1')
    ) {
      issues.push({
        id: 'ai-claim-1',
        word: '100% uptime',
        ruleCode: 'AI-CL-02',
        ruleName: 'Overpromising SLA Commitment',
        type: 'ai',
        severity: 'critical',
        explanation: 'Unconditional 100% claims violate enterprise legal compliance protocols.',
        replacement: 'enterprise 99.99% SLA commitment',
        category: 'Legal',
      });
    }

    if (
      content.split(' ').length > 25 &&
      content.includes('legacy systems') &&
      !ignoredIssueIds.has('ai-tone-2')
    ) {
      issues.push({
        id: 'ai-tone-2',
        word: 'needlessly overpriced',
        ruleCode: 'AI-TN-09',
        ruleName: 'Aggressive Competitor Disparagement',
        type: 'ai',
        severity: 'warning',
        explanation: 'Brand guidelines mandate positive positioning without competitor disparagement.',
        replacement: 'traditional legacy platforms',
        category: 'Tone',
      });
    }

    return issues;
  }, [content, bannedTerms, hasAppliedFix, ignoredIssueIds]);

  // Dynamic Acrolinx Brand Trust Score calculation
  const score = useMemo(() => {
    if (hasAppliedFix) return 96;
    if (detectedIssues.length === 0) return 95;

    const penalty = detectedIssues.reduce((acc, issue) => {
      if (issue.severity === 'critical') return acc + 14;
      if (issue.severity === 'warning') return acc + 8;
      return acc + 5;
    }, 0);

    return Math.max(38, 98 - penalty);
  }, [detectedIssues, hasAppliedFix]);

  const handleSelectPreset = (presetId: string) => {
    const preset = STUDIO_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setContent(preset.content);
      setHasAppliedFix(false);
      setActiveTooltipIssue(null);
      setIgnoredIssueIds(new Set());
      handleTriggerAuditScan();
    }
  };

  // 1-Click Apply Fix logic with layout swap & confetti burst
  const handleApply1ClickFix = () => {
    setIsApplyingFix(true);
    handleTriggerAuditScan();

    let fixedContent = content;
    const replacements: Record<string, string> = {
      cheap: intent === 'punchy' ? 'accessible' : 'cost-effective',
      guarantee: intent === 'strict' ? 'commit to' : 'back with our SLA',
      guarantees: intent === 'strict' ? 'commits to' : 'delivers verified',
      '100% uptime': 'industry-leading 99.99% uptime',
      'best-in-class': intent === 'punchy' ? 'enterprise-grade' : 'benchmark-proven',
      disruptive: intent === 'punchy' ? 'innovative' : 'transformative',
      revolutionary: 'architectural advancement',
      foolproof: 'intuitive and streamlined',
      'needlessly overpriced': 'traditional legacy alternatives',
    };

    Object.entries(replacements).forEach(([bad, good]) => {
      const regex = new RegExp(`\\b${bad}\\b`, 'gi');
      fixedContent = fixedContent.replace(regex, good);
    });

    setTimeout(() => {
      setContent(fixedContent);
      setHasAppliedFix(true);
      setIsApplyingFix(false);
      setActiveTooltipIssue(null);

      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#4F46E5', '#10B981', '#7C3AED', '#EC4899'],
        });
      } catch {
        // Fallback
      }
    }, 400);
  };

  // Replace single word
  const handleReplaceSingleWord = (badWord: string, replacement: string) => {
    const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
    setContent((prev) => prev.replace(regex, replacement));
    setActiveTooltipIssue(null);
  };

  // Ignore single word
  const handleIgnoreWord = (issueId: string) => {
    setIgnoredIssueIds((prev) => new Set([...prev, issueId]));
    setActiveTooltipIssue(null);
  };

  // Route to Kanban approval hub & insert into Supabase submissions table
  const handleSendToApprovals = async () => {
    setIsSubmittingToSupabase(true);

    try {
      // 1. INSERT new row into the Supabase 'submissions' table with final text and current Trust Score
      const { data: dbRecord, error: dbError } = await insertSubmission(content, score);

      if (dbError) {
        console.warn('Notice: Insert to Supabase submissions table returned notice, continuing with optimistic route:', dbError);
      }

      // 2. Map submission to KanbanCard with smart routing
      const newKanbanSubmission: KanbanCard = {
        id: dbRecord?.id ? `supabase-sub-${dbRecord.id}` : `card-sub-${Date.now()}`,
        title: 'Studio Audit: ' + (STUDIO_PRESETS.find((p) => p.id === selectedPresetId)?.title || 'Custom Campaign Draft'),
        assetType: 'Press Release',
        department: 'Product Marketing',
        author: {
          name: 'Elena Vance',
          role: 'Global Brand Director',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
        },
        timestamp: 'Just now',
        score: score,
        // Smart routing: score >= 90 -> 'fast-track' ("Fast-Track Approved"), score < 90 -> 'review' ("Manager Review Queue")
        status: score >= 90 ? 'fast-track' : 'review',
        beforeText: STUDIO_PRESETS.find((p) => p.id === selectedPresetId)?.content || content,
        afterText: content,
        diffSummary: {
          removed: ['cheap', 'guarantee', 'disruptive', 'best-in-class'],
          added: ['cost-effective', 'commit to', 'transformative', 'benchmark-proven'],
        },
        criticalViolations: detectedIssues.filter((i) => i.severity === 'critical').length,
        notes: hasAppliedFix
          ? 'Pre-vetted with 1-Click Fix. Intent preset: ' + intent
          : 'Submitted directly from Co-Pilot Studio audit session.',
      };

      onRouteToApprovals(newKanbanSubmission);
    } catch (err) {
      console.error('Error submitting to Approval Hub:', err);
    } finally {
      setIsSubmittingToSupabase(false);
    }
  };


  const filteredIssues = detectedIssues.filter((issue) => {
    if (activeIssueTab === 'deterministic') return issue.type === 'deterministic';
    if (activeIssueTab === 'ai') return issue.type === 'ai';
    return true;
  });

  // Render text with live highlighted spans
  // Deterministic = solid rose wavy underline
  // AI-check = dashed violet underline
  const renderHighlightedText = () => {
    if (hasAppliedFix || detectedIssues.length === 0) {
      return (
        <span className="text-slate-200 leading-[1.7] font-normal whitespace-pre-wrap">
          {content}
        </span>
      );
    }

    const wordsToHighlight = detectedIssues.map((i) => i.word).filter(Boolean);
    if (wordsToHighlight.length === 0) {
      return <span className="text-slate-200 leading-[1.7] whitespace-pre-wrap">{content}</span>;
    }

    const pattern = new RegExp(
      `(${wordsToHighlight.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'gi'
    );
    const parts = content.split(pattern);

    return (
      <span className="whitespace-pre-wrap leading-[1.7] text-slate-200">
        {parts.map((part, index) => {
          const matchingIssue = detectedIssues.find(
            (i) => i.word.toLowerCase() === part.toLowerCase()
          );

          if (matchingIssue) {
            const isDeterministic = matchingIssue.type === 'deterministic';
            return (
              <span
                key={index}
                onClick={() => setActiveTooltipIssue(matchingIssue)}
                className={`inline-block px-1.5 py-0.5 mx-0.5 rounded cursor-pointer transition-all font-semibold ${
                  isDeterministic
                    ? 'underline decoration-rose-400 decoration-wavy underline-offset-4 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-500/30'
                    : 'underline decoration-violet-400 decoration-dashed underline-offset-4 bg-violet-500/20 text-violet-200 hover:bg-violet-500/30 border border-violet-500/30'
                }`}
                title={`Click to inspect ${matchingIssue.ruleName}`}
              >
                {part}
              </span>
            );
          }

          return (
            <span key={index} className="text-slate-200 font-normal">
              {part}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Mode Switcher */}
      {/* Studio Header & Mode Switcher */}
      <div className="surface-light frontify-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Real-Time Compliance Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[color:var(--fg)] tracking-tight mt-1">
            Co-Pilot <span className="aurora-text">Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-[color:var(--fg-muted)] font-medium mt-0.5">
            Wavy & dashed inline rule scanning, intent-aware AI rewriting, and Acrolinx Trust Scorecards.
          </p>
        </div>

        {/* Mode Switcher & Presets */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveStudioMode('copilot')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeStudioMode === 'copilot'
                  ? 'bg-slate-800 text-slate-100 shadow-xs font-black border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 font-bold'
              }`}
            >
              Co-Pilot Studio
            </button>
            <button
              type="button"
              onClick={() => setActiveStudioMode('auditor')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStudioMode === 'auditor'
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-slate-200 font-bold'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hybrid Engine (/api/audit-text)</span>
            </button>
          </div>

          {activeStudioMode === 'copilot' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {STUDIO_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedPresetId === p.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : 'bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border-slate-700/60'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Render AuditorUI directly if in Hybrid Engine Mode */}
      {activeStudioMode === 'auditor' ? (
        <AuditorUI initialText={content} brandId={activeBrandId || undefined} />
      ) : (
        /* Split-Screen Workspace: Full Wide Canvas */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDE (7 to 8 Cols on Wide Displays): Editor & Asset Drop Zone */}
          <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 space-y-6">
            {/* Main Content Editor Card */}
            <div className="surface-light frontify-card p-6 flex flex-col relative overflow-hidden">
              {/* Scanning Beam (700ms sweeping laser line) */}
              {isScanning && <div className="scan-line" />}

              {/* Editor Header Bar */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[color:var(--line)] mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-[color:var(--fg-muted)]">
                    Document Editor
                  </span>
                  <span className="text-xs text-[color:var(--fg-subtle)]">•</span>
                  <span className="text-xs font-bold text-[color:var(--fg)]">
                    {content.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <span className="text-xs text-[color:var(--fg-subtle)]">•</span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
                    Live Scanner Active
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Run Live Audit Beam Button */}
                  <button
                    type="button"
                    onClick={handleTriggerAuditScan}
                    className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-500/30"
                    title="Sweep laser scanning beam down document"
                  >
                    <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                    <span>Scan</span>
                  </button>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                    <button
                      onClick={() => setViewMode('edit')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                        viewMode === 'edit'
                          ? 'bg-slate-800 text-slate-100 shadow-xs font-bold border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200 font-medium'
                      }`}
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Live Editor</span>
                    </button>
                    <button
                      onClick={() => setViewMode('inspect')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                        viewMode === 'inspect'
                          ? 'bg-slate-800 text-slate-100 shadow-xs font-bold border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200 font-medium'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Contextual Floating Popover when an inline highlight is clicked */}
              <AnimatePresence>
                {activeTooltipIssue && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={springTransition}
                    className="mb-4 p-4 rounded-2xl bg-[#0F1535] text-white shadow-2xl border border-[#232B56] text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px]">
                          {activeTooltipIssue.ruleCode}
                        </span>
                        <span className="font-bold text-slate-100 text-[13px]">
                          Violation: &quot;{activeTooltipIssue.word}&quot;
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTooltipIssue(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">
                      {activeTooltipIssue.explanation}
                    </p>

                    <div className="flex items-center justify-between pt-2.5 border-t border-[#232B56] gap-3">
                      <span className="text-slate-400 text-xs">
                        Suggested: <strong className="text-emerald-400 font-bold">&quot;{activeTooltipIssue.replacement}&quot;</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleIgnoreWord(activeTooltipIssue.id)}
                          className="px-3 py-1 text-slate-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Ignore
                        </button>
                        <button
                          onClick={() =>
                            handleReplaceSingleWord(
                              activeTooltipIssue.word,
                              activeTooltipIssue.replacement
                            )
                          }
                          className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Custom Two-Layer Overlay Text Editor: Live deterministic banned word highlighting */}
              {viewMode === 'inspect' ? (
                <div className="min-h-[440px] xl:min-h-[500px] rounded-2xl bg-slate-900 border border-slate-800 p-5 text-slate-200">
                  <div className="text-[16px] font-normal text-slate-200 leading-[1.7] min-h-[420px] xl:min-h-[480px]">
                    {renderHighlightedText()}
                  </div>
                </div>
              ) : (
                <OverlayTextEditor
                  id="copilot-overlay-textarea"
                  value={content}
                  onChange={(val) => {
                    setContent(val);
                    setHasAppliedFix(false);
                  }}
                  bannedWords={bannedWordsList}
                  aiWords={detectedIssues.filter((i) => i.type === 'ai').map((i) => i.word)}
                  placeholder="Paste or write brand copy to audit in real-time..."
                />
              )}

              {/* Editor Status Footer */}
              <div className="mt-4 pt-4 border-t border-[color:var(--line)] flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--fg-muted)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-semibold text-[color:var(--fg)]">Solid Wavy = Deterministic Banned Terms</span>
                  <span className="text-[color:var(--fg-subtle)]">•</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <span className="font-semibold text-[color:var(--fg)]">Dashed = AI Tone Violations</span>
                </div>

                <div className="flex items-center gap-2 font-black text-[color:var(--fg)]">
                  <span>Score:</span>
                  <span className={score >= 90 ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                    {score}%
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Asset Safe-Zone Verification Zone (with drag animation) */}
            <div className="surface-light frontify-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center border border-purple-500/20">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[color:var(--fg)]">
                      Visual Brand Asset Safe-Zone Verification
                    </h3>
                    <p className="text-xs text-[color:var(--fg-muted)] font-medium">
                      Audit logo clear space margins and contrast against brand guidelines
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Frontify DAM Sync
                </span>
              </div>

              {uploadedLogo ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-[color:var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center p-2 border border-indigo-500 shadow-xs">
                      <div className="text-white font-black text-xl tracking-tight">BM</div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[color:var(--fg)]">{uploadedLogo.name}</p>
                      <p className="text-[11px] text-[color:var(--fg-muted)]">Vector SVG • 2400 x 800 px</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Clearspace 100% OK
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> {uploadedLogo.contrastRatio}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setUploadedLogo(null)}
                    className="text-xs font-semibold text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] px-3 py-1.5 rounded-lg border border-[color:var(--line)] bg-white cursor-pointer shadow-xs"
                  >
                    Replace Asset
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    setIsVerifyingAsset(true);
                    setTimeout(() => {
                      setIsVerifyingAsset(false);
                      setUploadedLogo({
                        name: 'BrandMesh_Monogram_Dark.svg',
                        clearSpacePass: true,
                        contrastRatio: '14.2:1 (AAA Pass)',
                        palettePass: true,
                      });
                    }, 600);
                  }}
                  onClick={() => {
                    setIsVerifyingAsset(true);
                    setTimeout(() => {
                      setIsVerifyingAsset(false);
                      setUploadedLogo({
                        name: 'BrandMesh_Monogram_Dark.svg',
                        clearSpacePass: true,
                        contrastRatio: '14.2:1 (AAA Pass)',
                        palettePass: true,
                      });
                    }, 600);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                      : 'border-[color:var(--line)] hover:border-indigo-400 bg-slate-50/50'
                  }`}
                >
                  {isVerifyingAsset ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-bold text-indigo-600">
                        Analyzing 44px clearspace & contrast ratios...
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-black text-[color:var(--fg)]">
                        Drop logo asset or click to upload
                      </p>
                      <p className="text-[11px] text-[color:var(--fg-muted)] font-medium mt-0.5">
                        Evaluates against 44px clearspace and WCAG 4.5:1 background contrast
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE (5 to 4 Cols): Sticky Acrolinx Dark Ink Trust Score Panel & Actions */}
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 space-y-6 lg:sticky lg:top-20">
            {/* Acrolinx Dark Ink Trust Score Panel */}
            <div className="dark-ink-panel surface-dark p-6 rounded-3xl shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-[color:var(--line)] mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black tracking-wider uppercase text-[color:var(--fg)]">
                    Acrolinx Trust Score
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[color:var(--fg-muted)]">
                  Target: 90+
                </span>
              </div>

              {/* Large SVG Ring with Target 90 Marker and 4 Sub-Scores */}
              <CircularGauge score={score} size={190} showSubScores={true} />
            </div>

            {/* 1-Click Fix & Intent Preservation Card */}
            <div className="surface-light frontify-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[color:var(--fg)]">
                    Intent-Preserving AI Rewrite
                  </h3>
                  <p className="text-xs text-[color:var(--fg-muted)] font-medium">
                    Choose governance strictness profile
                  </p>
                </div>

                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Gemini Co-Pilot
                </span>
              </div>

              {/* Segmented Control with Sliding LayoutId Thumb */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 relative">
                {(['strict', 'balanced', 'punchy'] as const).map((preset) => {
                  const isActive = intent === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setIntent(preset)}
                      className={`relative py-1.5 text-xs font-bold capitalize transition-colors rounded-xl cursor-pointer ${
                        isActive
                          ? 'text-indigo-600 font-extrabold'
                          : 'text-[color:var(--fg-muted)] hover:text-[color:var(--fg)]'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="intent-thumb"
                          className="absolute inset-0 bg-white rounded-xl shadow-xs -z-10"
                          transition={springTransition}
                        />
                      )}
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>

              {/* Intent Description Preview */}
              <p className="text-xs text-[color:var(--fg-muted)] font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-[color:var(--line)]">
                {intent === 'strict'
                  ? '🔒 Strict: Absolute legal precision, qualified SLA backing, zero superlative risk.'
                  : intent === 'balanced'
                  ? '⚖️ Balanced: Natural enterprise conversational tone with certified factual integrity.'
                  : '⚡ Punchy: High-conversion direct marketing language optimized for maximum clarity.'}
              </p>

              {/* 1-Click Apply Fix Button with Shimmer */}
              <button
                type="button"
                onClick={handleApply1ClickFix}
                disabled={isApplyingFix || hasAppliedFix || detectedIssues.length === 0}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  hasAppliedFix
                    ? 'bg-emerald-600 shadow-emerald-500/20'
                    : 'aurora-button'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {hasAppliedFix ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Certified Compliant (Score 96%)</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>1-Click Apply Compliant Fix ({detectedIssues.length} Issues)</span>
                  </>
                )}
              </button>

              {/* Send to Approval Hub CTA */}
              <button
                type="button"
                onClick={handleSendToApprovals}
                disabled={isSubmittingToSupabase}
                className="w-full py-3 px-4 rounded-2xl text-xs font-black text-[color:var(--fg)] bg-slate-100 hover:bg-slate-200 border border-[color:var(--line)] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
              >
                {isSubmittingToSupabase ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Inserting into Supabase submissions...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Submit to Approval Hub ({score >= 90 ? 'Fast-Track Approved' : 'Manager Review Queue'})</span>
                  </>
                )}
              </button>

            </div>

            {/* Violations List Card (Grouped & Staggered) */}
            <div className="surface-light frontify-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[color:var(--line)]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[color:var(--fg)]">
                    Detected Violations ({filteredIssues.length})
                  </h3>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {(['all', 'deterministic', 'ai'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveIssueTab(tab)}
                      className={`px-2.5 py-1 rounded capitalize transition-colors ${
                        activeIssueTab === tab
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] hover:bg-slate-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {filteredIssues.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-emerald-800">
                    Zero Violations Detected
                  </p>
                  <p className="text-xs text-[color:var(--fg-muted)] font-medium">
                    Copy meets all deterministic and AI brand compliance checks.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {filteredIssues.map((issue) => (
                      <motion.div
                        key={issue.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={springTransition}
                        className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                          issue.type === 'deterministic'
                            ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                            : 'bg-violet-50/90 border-violet-200 text-violet-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[color:var(--fg)]">&quot;{issue.word}&quot;</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white text-[color:var(--fg-muted)] border border-[color:var(--line)]">
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[color:var(--fg-muted)] line-clamp-2">
                          {issue.explanation}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-emerald-700">
                            Fix: {issue.replacement}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleReplaceSingleWord(issue.word, issue.replacement)}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                          >
                            Apply Fix
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
