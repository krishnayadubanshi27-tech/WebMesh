'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle,
  Loader2,
  Sparkles,
  AlertCircle,
  Database,
  FileCheck2,
} from 'lucide-react';
import { BannedTerm, Severity } from '@/types/brandmesh';
import { supabase } from '@/supabase';
import { ExtractedBrandData } from '@/lib/gemini';
import { useAuditStore } from '@/store';

interface UploadPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesExtracted: (newTerms: BannedTerm[]) => void;
}

export const UploadPdfModal: React.FC<UploadPdfModalProps> = ({
  isOpen,
  onClose,
  onRulesExtracted,
}) => {
  const { setActiveBrandId, setActiveBrandName } = useAuditStore();
  const [stage, setStage] = useState<'idle' | 'extracting' | 'extracted'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedBrandData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingToSupabase, setIsSavingToSupabase] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File selection handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage('Please upload a valid PDF document (.pdf).');
      }
    }
  };

  // Create a sample enterprise PDF Blob if user wants to test without an external file
  const handleUseSamplePdf = () => {
    const sampleContent = `%PDF-1.4
Acme Global Enterprise Brand Guidelines & Compliance Standard (v4.2)

1. Tone & Terminology Standards:
- Never use the term "unlimited" when describing enterprise cloud storage or throughput. Without explicit fair-use schedules, it creates regulatory liability. Approved alternatives: "scalable high-capacity", "enterprise-metered".
- Strictly avoid esoteric buzzwords such as "magic" or "wizardry" when explaining machine learning features. It reduces technical credibility. Approved alternatives: "algorithmic automation", "intelligent pipeline".
- Disparaging competitors as "clunky" or "primitive" is forbidden. All competitor comparisons must be grounded in third-party benchmark reports. Approved alternative: "legacy architectural solutions".

2. Certified Facts & Verification:
- Production Uptime: 99.99% Availability SLA backed by Zurich Financial Insurance Syndicate.
- Compliance Certifications: SOC 2 Type II, ISO 27001:2022, and HIPAA BAA compliant across all EU and US nodes.
- Global Footprint: Headquartered in Zurich, Switzerland with 2,400+ enterprise clients.

3. Official Frontify Visual Palette:
- Brand Cobalt Blue: #2A59FE (Primary CTAs, Hero Headers, Visual Focus)
- Emerald Mint: #10B981 (Trust Badges, High Compliance Gauges)
- Crimson Alert: #EF4444 (Banned Terms, Rule Rejection Indicators)
%%EOF`;

    const blob = new Blob([sampleContent], { type: 'application/pdf' });
    const sampleFile = new File([blob], 'Acme_Enterprise_Brand_Styleguide_v4.2.pdf', {
      type: 'application/pdf',
    });
    setSelectedFile(sampleFile);
    setErrorMessage(null);
  };

  // --- Step 4: Wire the Frontend Upload Handler ---
  const handleUploadAndExtract = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select or drop a PDF file first.');
      return;
    }

    setStage('extracting');
    setErrorMessage(null);
    setSaveStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('pdfFile', selectedFile);

      // Post to our Next.js PDF extraction route
      const response = await fetch('/api/upload-brand-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to extract brand rules from PDF.');
      }

      setExtractedData(result.data);
      if (result.brandGuideline) {
        setActiveBrandId(result.brandGuideline.id);
        if (result.brandGuideline.brand_name) {
          setActiveBrandName(result.brandGuideline.brand_name);
        }
      }
      setStage('extracted');
    } catch (err: unknown) {
      console.error('PDF upload pipeline failed:', err);
      const msg = err instanceof Error ? err.message : 'Upload pipeline failed';
      setErrorMessage(msg);
      setStage('idle');
    }
  };

  const handleApplyRules = async () => {
    if (!extractedData) return;
    setIsSavingToSupabase(true);
    setSaveStatusMessage('Syncing extracted rules to database...');

    const mappedTerms: BannedTerm[] = extractedData.banned_words.map((item, index) => {
      const cleanWord = item.word.toLowerCase();
      const alternatives =
        item.alternatives && item.alternatives.length > 0
          ? item.alternatives
          : ['standardized phrasing'];

      return {
        id: `term-ext-${Date.now()}-${index}`,
        term: cleanWord,
        severity: (item.severity as Severity) || 'warning',
        category: (item.category as 'Tone' | 'Legal' | 'Superlative' | 'Jargon') || 'Tone',
        reason: item.reason || `Extracted from ${selectedFile?.name || 'PDF'} via Gemini AI.`,
        approvedAlternatives: alternatives,
        pattern: new RegExp(`\\b${cleanWord}\\b`, 'gi'),
      };
    });

    // Also attempt inserting into Supabase banned_words table
    try {
      const insertRows = extractedData.banned_words.map((item) => ({
        word: item.word.toLowerCase(),
        category: item.category || 'Tone',
        severity: item.severity || 'warning',
        reason: item.reason || 'Extracted via Gemini AI PDF ingestion',
        approved_alternatives: item.alternatives || ['standardized solution'],
      }));

      await supabase.from('banned_words').insert(insertRows);
    } catch (dbErr) {
      console.warn('Notice: Local state updated, Supabase insert notice:', dbErr);
    }

    onRulesExtracted(mappedTerms);
    setIsSavingToSupabase(false);
    onClose();
    setStage('idle');
    setSelectedFile(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-white surface-light rounded-3xl shadow-2xl border border-[color:var(--line)] overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-[color:var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2A59FE] to-indigo-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[color:var(--fg)]">
                      Upload Brand Guidelines PDF
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#2A59FE] border border-blue-200">
                      pdf-parse & Gemini AI
                    </span>
                  </div>
                  <p className="text-xs text-[color:var(--fg-muted)]">
                    Extracts text with pdf-parse, structures with Gemini AI, and syncs to Supabase.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {stage === 'idle' && (
                <div className="space-y-4">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,application/pdf"
                    className="hidden"
                  />

                  {/* Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                      isDragOver
                        ? 'border-[#2A59FE] bg-blue-50/40'
                        : selectedFile
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 hover:border-[#2A59FE] bg-slate-50/50 hover:bg-blue-50/20'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl shadow-xs border flex items-center justify-center transition-transform ${
                        selectedFile
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-white border-slate-200 text-[#2A59FE]'
                      }`}
                    >
                      {selectedFile ? (
                        <FileCheck2 className="w-7 h-7" />
                      ) : (
                        <UploadCloud className="w-7 h-7" />
                      )}
                    </div>

                    <div>
                      {selectedFile ? (
                        <>
                          <p className="text-sm font-bold text-slate-800 truncate max-w-sm">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-slate-800">
                            Drop your Brand Styleguide PDF here, or browse
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Supports standard PDF files up to 50MB
                          </p>
                        </>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-[#2A59FE] bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition-colors">
                      {selectedFile ? 'Choose a Different File' : 'Browse Files'}
                    </span>
                  </div>

                  {/* Or Use Sample PDF */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText className="w-4 h-4 text-[#2A59FE]" />
                      <span>Don&apos;t have a PDF ready?</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseSamplePdf}
                      className="font-bold text-[#2A59FE] hover:underline cursor-pointer"
                    >
                      Use Sample Styleguide PDF
                    </button>
                  </div>
                </div>
              )}

              {stage === 'extracting' && (
                <div className="py-10 px-4 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2A59FE] flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
                    <Loader2 className="w-7 h-7 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Processing PDF & Structuring with Gemini AI...
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Step A: Reading buffer with pdf-parse → Step B: Gemini structuring rules → Step C: Preparing database sync.
                    </p>
                  </div>
                </div>
              )}

              {stage === 'extracted' && extractedData && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">PDF Parsing & AI Extraction Successful</p>
                      <p className="text-[11px] text-emerald-700">
                        Extracted {extractedData.banned_words.length} banned rules, {extractedData.facts.length} verified facts, and {extractedData.hex_colors.length} color swatches from {selectedFile?.name || 'PDF'}.
                      </p>
                    </div>
                  </div>

                  {/* Banned Words Found */}
                  {extractedData.banned_words.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Extracted Prohibited Terms ({extractedData.banned_words.length}):
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {extractedData.banned_words.map((item, i) => (
                          <div
                            key={i}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                                  &quot;{item.word}&quot;
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{item.reason}</p>
                              {item.alternatives && item.alternatives.length > 0 && (
                                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                                  Alternatives: {item.alternatives.join(', ')}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                              {item.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Facts & Claims Found */}
                  {extractedData.facts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Extracted Verified Facts ({extractedData.facts.length}):
                      </p>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {extractedData.facts.map((f, i) => (
                          <div
                            key={i}
                            className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800"
                          >
                            <span className="font-bold text-emerald-700">Claim: </span>
                            &quot;{f.claim}&quot;
                            {f.source && (
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                Source: {f.source}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors Found */}
                  {extractedData.hex_colors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Extracted Color Swatches ({extractedData.hex_colors.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {extractedData.hex_colors.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span>{c.name}</span>
                            <span className="font-mono text-slate-500 text-[11px]">{c.hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 italic">
                {saveStatusMessage || (stage === 'extracted' ? 'Ready to sync to database' : '')}
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {stage === 'extracted' ? (
                  <button
                    onClick={handleApplyRules}
                    disabled={isSavingToSupabase}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#2A59FE] hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isSavingToSupabase ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        <span>Import into Brand Brain & Database</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleUploadAndExtract}
                    disabled={stage === 'extracting' || !selectedFile}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#2A59FE] to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upload & Extract with Gemini</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
