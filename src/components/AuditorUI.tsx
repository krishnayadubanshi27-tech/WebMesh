'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';

export interface AuditorUIProps {
  initialText?: string;
  brandId?: string | number;
}

export default function AuditorUI({ initialText = '', brandId = 1 }: AuditorUIProps) {
  const [inputText, setInputText] = useState<string>(
    initialText ||
      'We promise a 100% guarantee that our cheap cloud solution replaces all legacy manpower with a foolproof hack. We host all customer data exclusively in our Singapore data center.'
  );
  const [bannedWordsFound, setBannedWordsFound] = useState<string[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [auditedBrandName, setAuditedBrandName] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [hasAudited, setHasAudited] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Call the backend /api/audit-text API route
  const handleAudit = async () => {
    if (!inputText.trim()) return;

    setIsAuditing(true);
    setHasAudited(false);

    try {
      const response = await fetch('/api/audit-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textToAudit: inputText,
          brandId,
        }),
      });

      const data = await response.json();
      setBannedWordsFound(data.bannedWordsFound || []);
      setAiFeedback(data.aiFeedback || 'All facts align.');
      if (data.brandName) {
        setAuditedBrandName(data.brandName);
      }
      setHasAudited(true);
    } catch (err: unknown) {
      console.error('Audit failed:', err);
      setAiFeedback('Failed to reach audit engine. Please check backend connection.');
      setHasAudited(true);
    } finally {
      setIsAuditing(false);
    }
  };

  // Function to highlight banned words in red
  const renderHighlightedText = () => {
    if (bannedWordsFound.length === 0) {
      return <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{inputText}</p>;
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
      <div className="text-slate-800 leading-relaxed whitespace-pre-wrap">
        {parts.map((part, index) =>
          lowerBanned.includes(part.toLowerCase()) ? (
            <span
              key={index}
              style={{
                backgroundColor: '#ffcccc',
                color: '#cc0000',
                fontWeight: 'bold',
                padding: '2px 4px',
                borderRadius: '3px',
                margin: '0 1px',
              }}
              title="Prohibited Brand Violation (Regex Fast Check)"
            >
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
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
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                Hybrid Brand Auditing Engine
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#2A59FE] rounded border border-blue-200">
                Regex + LLM Smart Check
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
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
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
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
              className="w-full p-4 rounded-xl text-sm text-slate-800 bg-slate-50/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A59FE]/20 focus:border-[#2A59FE] transition-all resize-y font-normal leading-relaxed"
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
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-500 border border-slate-200 shadow-xs text-xs flex items-center gap-1"
              title="Copy text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
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
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6"
          >
            {/* Top Stat Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    bannedWordsFound.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <h3 className="text-sm font-black text-slate-900">
                  {bannedWordsFound.length > 0
                    ? `${bannedWordsFound.length} Prohibited Brand Term${bannedWordsFound.length > 1 ? 's' : ''} Detected`
                    : 'Zero Prohibited Terms Found'}
                </h3>
                {auditedBrandName && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your Audited Text:
                </h4>
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Red = Banned Words (Regex)
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-sm">
                {renderHighlightedText()}
              </div>
            </div>

            {/* 2. AI Fact Checker Feedback Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  AI Fact Checker Feedback:
                </h4>
              </div>

              <div
                className={`p-4 rounded-xl text-xs leading-relaxed border ${
                  aiFeedback.toLowerCase().includes('all facts align')
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <p className="font-medium whitespace-pre-wrap">{aiFeedback}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
