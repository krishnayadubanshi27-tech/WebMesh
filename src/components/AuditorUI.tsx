'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  XCircle,
  Terminal,
  Cpu,
} from 'lucide-react';
import { useAuditStore } from '@/store';

export interface AuditorUIProps {
  initialText?: string;
  brandId?: string | number;
}

export default function AuditorUI({ initialText = '', brandId = 1 }: AuditorUIProps) {
  const { isCloudMode } = useAuditStore();
  const [inputText, setInputText] = useState<string>(
    initialText ||
      'We promise a 100% guarantee that our cheap cloud solution replaces all legacy manpower with a foolproof hack. We host all customer data exclusively in our Singapore data center.'
  );
  const [bannedWordsFound, setBannedWordsFound] = useState<string[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [auditedBrandName, setAuditedBrandName] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [hasAudited, setHasAudited] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Call the backend /api/audit-text API route
  const handleAudit = async () => {
    if (!inputText.trim()) return;

    setIsAuditing(true);
    setHasAudited(false);
    setAiError(null);

    try {
      const response = await fetch('/api/audit-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textToAudit: inputText,
          brandId,
          isCloudMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const exactMsg = data.error || `HTTP ${response.status}: ${response.statusText}`;
        setAiError(exactMsg);
      } else {
        setBannedWordsFound(data.bannedWordsFound || []);
        if (data.aiError) {
          setAiError(data.aiError);
        } else {
          setAiFeedback(data.aiFeedback || 'All facts align.');
        }
        if (data.brandName) {
          setAuditedBrandName(data.brandName);
        }
      }
      setHasAudited(true);
    } catch (err: unknown) {
      console.error('Audit failed:', err);
      const rawError = err instanceof Error ? err.message : String(err);
      let formattedMsg = rawError;

      if (
        rawError.toLowerCase().includes('failed to fetch') ||
        rawError.toLowerCase().includes('connection refused')
      ) {
        formattedMsg = isCloudMode
          ? `Failed to fetch: Connection to /api/audit-text failed. (${rawError})`
          : `Connection Refused: Local Ollama daemon is not running at http://localhost:11434. (${rawError})`;
      }

      setAiError(formattedMsg);
      setHasAudited(true);
    } finally {
      setIsAuditing(false);
    }
  };

  // Function to highlight banned words in red
  const renderHighlightedText = () => {
    if (bannedWordsFound.length === 0) {
      return <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{inputText}</p>;
    }

    // Escape regex special chars to prevent syntax errors
    const escapedWords = bannedWordsFound.map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    // Create a regex pattern of all banned words: (cheap|guarantee|hack)
    const regexPattern = new RegExp(`(${escapedWords.join('|')})`, 'gi');

    // Split the text and wrap banned words in a red span
    const parts = inputText.split(regexPattern);
    const lowerBanned = bannedWordsFound.map((w) => w.toLowerCase());

    return (
      <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
        {parts.map((part, index) =>
          lowerBanned.includes(part.toLowerCase()) ? (
            <span
              key={index}
              className="bg-rose-500/20 text-rose-300 underline decoration-wavy decoration-rose-400 font-bold px-1.5 py-0.5 rounded border border-rose-500/30 mx-0.5"
              title="Prohibited Brand Violation (Regex Fast Check)"
            >
              {part}
            </span>
          ) : (
            <span key={index} className="text-slate-200">{part}</span>
          )
        )}
      </div>
    );
  };

  const samplePresets = [
    {
      title: 'Legal & SLA Overpromising',
      text: 'Our revolutionary platform gives a 100% guarantee and risk-free warranty that our cheap system will never suffer downtime.',
    },
    {
      title: 'Inclusivity & Tone Violation',
      text: 'Our engineering manpower relies on a master/slave architecture with a strict blacklist to manage all guys on the team.',
    },
    {
      title: 'Corporate Fact Contradiction',
      text: 'BrandMesh was founded in 2024 and stores all data in Frankfurt with a basic 95% SLA and no SOC2 certification.',
    },
  ];

  const handleCopyText = () => {
    navigator.clipboard.writeText(inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">
                Hybrid Brand Auditing Engine
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 rounded border border-blue-500/30">
                Regex + LLM Smart Check
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic regex catches banned words instantly, while Gemini checks factual alignment and tone integrity.
            </p>
          </div>

          {/* Quick Preset Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Samples:</span>
            {samplePresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(p.text);
                  setHasAudited(false);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg transition-colors cursor-pointer"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <textarea
              id="brand-auditor-textarea"
              rows={6}
              className="w-full p-4 rounded-xl text-sm text-slate-100 bg-slate-950/80 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2A59FE]/30 focus:border-[#2A59FE] transition-all resize-y font-normal leading-relaxed placeholder:text-slate-500"
              placeholder="Paste your draft blog post, marketing email, or sales copy here..."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setHasAudited(false);
              }}
            />
            <button
              type="button"
              onClick={handleCopyText}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-xs text-xs flex items-center gap-1 cursor-pointer"
              title="Copy text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[color:var(--fg-subtle)] font-medium">
              {inputText.split(/\s+/).filter(Boolean).length} words • {inputText.length} characters
            </span>

            <button
              id="run-audit-btn"
              type="button"
              onClick={handleAudit}
              disabled={isAuditing || !inputText.trim()}
              className="py-2.5 px-6 rounded-xl text-xs font-black tracking-wide text-white bg-[#2A59FE] hover:bg-blue-700 shadow-sm shadow-blue-500/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Auditing with Regex + LLM...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Audit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {hasAudited && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-6 text-slate-200"
          >
            {/* Top Stat Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    bannedWordsFound.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <h3 className="text-sm font-black text-white">
                  {bannedWordsFound.length > 0
                    ? `${bannedWordsFound.length} Prohibited Brand Term${bannedWordsFound.length > 1 ? 's' : ''} Detected`
                    : 'Zero Prohibited Terms Found'}
                </h3>
                {auditedBrandName && (
                  <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    Standard: {auditedBrandName}
                  </span>
                )}
              </div>

              {bannedWordsFound.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {bannedWordsFound.map((word, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-md"
                    >
                      &quot;{word}&quot;
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 1. Highlighted Text Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--fg-muted)]">
                  Your Audited Text:
                </h4>
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Red = Banned Words (Regex)
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200">
                {renderHighlightedText()}
              </div>
            </div>

            {/* 2. AI Fact Checker Feedback / Error Section */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {aiError ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    AI Fact Checker Feedback:
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 bg-slate-800 text-slate-200 border-slate-700">
                  {isCloudMode ? (
                    <>
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Cloud (Gemini)</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span>Local (Ollama: phi4-mini)</span>
                    </>
                  )}
                </span>
              </div>

              {aiError ? (
                <div
                  role="alert"
                  className="p-4 rounded-xl text-xs leading-relaxed bg-rose-950/40 border border-rose-800/80 text-rose-200 shadow-xs space-y-2"
                >
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-[13px]">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>AI Engine Failure Detected</span>
                  </div>

                  <div className="p-3 bg-rose-950/80 rounded-lg border border-rose-800 font-mono text-[11.5px] text-rose-300 break-words whitespace-pre-wrap selection:bg-rose-900">
                    {aiError}
                  </div>

                  <div className="text-[11px] text-rose-400 leading-normal pt-1">
                    {isCloudMode ? (
                      <p>
                        <strong>Troubleshooting Gemini:</strong> Verify your <code className="bg-rose-900/60 px-1 py-0.5 rounded text-rose-200">GEMINI_API_KEY</code> in <code className="bg-rose-900/60 px-1 py-0.5 rounded text-rose-200">.env.local</code> is an active Google AI Studio key starting with <code>AIzaSy...</code> and restart the server.
                      </p>
                    ) : (
                      <p>
                        <strong>Troubleshooting Ollama:</strong> Ensure your local Ollama daemon is running with <code className="bg-rose-900/60 px-1 py-0.5 rounded text-rose-200">ollama serve</code>, and pull the model with <code className="bg-rose-900/60 px-1 py-0.5 rounded text-rose-200">ollama run phi4-mini</code>.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={`p-4 rounded-xl text-xs leading-relaxed border ${
                    aiFeedback.toLowerCase().includes('all facts align')
                      ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-800/70 text-amber-200'
                  }`}
                >
                  <p className="font-medium whitespace-pre-wrap">{aiFeedback}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
