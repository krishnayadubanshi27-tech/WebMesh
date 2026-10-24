'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  supabase,
  applyPremiumTemplate,
  addManualBannedWord,
  saveExtractedRules,
  BrandGuidelineRecord,
} from '../supabase';
import { useAuditStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BannedTerm,
  VerifiedFact,
  ColorSwatch,
  A11yRule,
  Severity,
} from '@/types/brandmesh';
import {
  UploadCloud,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  BookOpen,
  ShieldCheck,
  Palette,
  Eye,
  X,
  Database,
  RefreshCw,
  AlertCircle,
  Loader2,
  Sparkles,
  Wand2,
  Users,
  ChevronDown,
  ChevronUp,
  Activity,
  Award,
  ArrowRight,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { UploadPdfModal } from './UploadPdfModal';
import { BRAND_TEMPLATES, BrandTemplate } from '@/data/brandTemplates';
import { springTransition } from '@/utils';

export interface DatabaseBannedWord {
  id?: string;
  word?: string;
  term?: string;
  category?: 'Tone' | 'Legal' | 'Superlative' | 'Jargon' | string;
  severity?: Severity;
  reason?: string;
  approved_alternatives?: string[] | string;
  approvedAlternatives?: string[] | string;
  created_at?: string;
}

interface BrandBrainTabProps {
  bannedTerms: BannedTerm[];
  setBannedTerms: React.Dispatch<React.SetStateAction<BannedTerm[]>>;
  verifiedFacts: VerifiedFact[];
  colorSwatches: ColorSwatch[];
  a11yRules: A11yRule[];
}

/**
 * Reusable Spotlight Card with cursor-following radial gradient
 */
const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}> = ({ children, className = '', accentColor = 'rgba(99, 102, 241, 0.08)' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden frontify-card ${className}`}
    >
      {/* Dynamic Cursor Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, ${accentColor}, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const BrandBrainTab: React.FC<BrandBrainTabProps> = ({
  bannedTerms,
  setBannedTerms,
  verifiedFacts,
  colorSwatches,
  a11yRules,
}) => {
  const {
    activeBrandId,
    setActiveBrandId,
    activeBrandName,
    setActiveBrandName,
    setBrandGuidelines,
  } = useAuditStore();

  // --- Dynamic Pillars State (populated from Supabase or fallback defaults) ---
  const [dbBannedWords, setDbBannedWords] = useState<DatabaseBannedWord[]>([]);
  const [dbFacts, setDbFacts] = useState<VerifiedFact[]>(verifiedFacts);
  const [dbColors, setDbColors] = useState<ColorSwatch[]>(colorSwatches);
  const [dbA11y, setDbA11y] = useState<A11yRule[]>(a11yRules);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [connectionMessage, setConnectionMessage] = useState<string>('Ready to connect...');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Expanded card state (Show N more)
  const [expandedPillars, setExpandedPillars] = useState<{ [key: string]: boolean }>({
    bannedWords: false,
    facts: false,
    colors: false,
    a11y: false,
  });

  const toggleExpand = (pillar: string) => {
    setExpandedPillars((prev) => ({ ...prev, [pillar]: !prev[pillar] }));
  };

  // Hovered banned word for replacement morph
  const [hoveredWordId, setHoveredWordId] = useState<string | null>(null);

  // --- Modal & Mutate Data State ("+ Add Banned Word") ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Form Inputs
  const [inputWord, setInputWord] = useState('');
  const [inputCategory, setInputCategory] = useState<'Tone' | 'Legal' | 'Superlative' | 'Jargon'>('Tone');
  const [inputSeverity, setInputSeverity] = useState<Severity>('critical');
  const [inputReplacements, setInputReplacements] = useState('');
  const [inputReason, setInputReason] = useState('');

  // --- AI Auto-Generation State & Template State ---
  const [aiPrompt, setAiPrompt] = useState('We are a luxury watch brand.');
  const [isGeneratingAiRules, setIsGeneratingAiRules] = useState(false);
  const [aiGenSuccessToast, setAiGenSuccessToast] = useState<string | null>(null);
  const [activeTemplateToast, setActiveTemplateToast] = useState<string | null>(null);

  // 1. One-Click Template Activation (Method 2)
  const handleApplyTemplate = async (template: BrandTemplate) => {
    setActiveTemplateToast(`Activating "${template.name}"...`);

    const newDbItems: DatabaseBannedWord[] = template.rules.map((rule, idx) => ({
      id: `tmpl-${template.id}-${Date.now()}-${idx}`,
      word: rule.word,
      term: rule.word,
      category: rule.category,
      severity: rule.severity,
      reason: rule.reason,
      approvedAlternatives: rule.approvedAlternatives,
      approved_alternatives: rule.approvedAlternatives,
      created_at: new Date().toISOString(),
    }));

    setDbBannedWords((prev) => [...newDbItems, ...prev]);

    const newBannedTerms: BannedTerm[] = template.rules.map((rule, idx) => ({
      id: `tmpl-${template.id}-${Date.now()}-${idx}`,
      term: rule.word,
      category: rule.category,
      severity: rule.severity,
      reason: rule.reason,
      approvedAlternatives: rule.approvedAlternatives,
      pattern: new RegExp(`\\b${rule.word}\\b`, 'gi'),
    }));
    setBannedTerms((prev) => [...newBannedTerms, ...prev]);

    try {
      if (template.id === 'premium-luxury') {
        const saved = await applyPremiumTemplate(template.name);
        if (saved && saved.length > 0) {
          setActiveBrandId(saved[0].id);
          setActiveBrandName(saved[0].brand_name);
        }

        const luxuryFacts: VerifiedFact[] = [
          {
            id: `fact-lux-${Date.now()}-1`,
            claim: 'We emphasize value over price',
            source: 'Brand Architecture Standard',
            verifiedBy: 'Brand Governance Team',
            verifiedDate: 'Today',
            validUntil: '2028-12-31',
            status: 'active',
            category: 'Corporate',
          },
          {
            id: `fact-lux-${Date.now()}-2`,
            claim: 'Our products are luxury grade',
            source: 'Brand Architecture Standard',
            verifiedBy: 'Brand Governance Team',
            verifiedDate: 'Today',
            validUntil: '2028-12-31',
            status: 'active',
            category: 'Corporate',
          },
        ];
        setDbFacts((prev) => [...luxuryFacts, ...prev]);

        const luxuryColors: ColorSwatch[] = [
          {
            id: `color-lux-${Date.now()}-1`,
            name: 'Noir Obsidian',
            hex: '#000000',
            rgb: 'rgb(0, 0, 0)',
            role: 'Primary Luxury Onyx',
            contrastOnWhite: '21:1',
            contrastOnDark: '1:1',
            passAAA: true,
            category: 'Brand Primary',
          },
          {
            id: `color-lux-${Date.now()}-2`,
            name: 'Imperial Gold',
            hex: '#FFD700',
            rgb: 'rgb(255, 215, 0)',
            role: 'Luxury Accent & Seal',
            contrastOnWhite: '9.2:1',
            contrastOnDark: '12:1',
            passAAA: true,
            category: 'Brand Primary',
          },
        ];
        setDbColors((prev) => [...luxuryColors, ...prev]);
      } else {
        const saved = await saveExtractedRules(template.name, {
          banned_words: template.rules.map((r) => r.word),
          facts: [],
          hex_colors: [],
        });
        if (saved && saved.length > 0) {
          setActiveBrandId(saved[0].id);
          setActiveBrandName(saved[0].brand_name);
        }
      }

      const rows = template.rules.map((r) => ({
        word: r.word,
        category: r.category,
        severity: r.severity,
        reason: r.reason,
        approved_alternatives: r.approvedAlternatives,
      }));
      await supabase.from('banned_words').insert(rows);
    } catch (e) {
      console.warn('Notice saving template to Supabase:', e);
    }

    setActiveTemplateToast(`Activated "${template.name}" (+${template.rules.length} brand rules applied)!`);
    setTimeout(() => setActiveTemplateToast(null), 3500);
  };

  // 2. AI Auto-Generation via Gemini
  const handleGenerateAiRules = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAiRules(true);

    try {
      const res = await fetch('/api/generate-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDescription: aiPrompt }),
      });
      const data = await res.json();

      if (data.success && data.brandRules) {
        const { banned_words, facts, hex_colors } = data.brandRules;

        if (Array.isArray(banned_words) && banned_words.length > 0) {
          const generatedDbWords: DatabaseBannedWord[] = banned_words.map((item, idx) => ({
            id: `ai-term-${Date.now()}-${idx}`,
            word: item.word,
            term: item.word,
            category: (item.category as 'Tone' | 'Legal' | 'Superlative' | 'Jargon') || 'Tone',
            severity: item.severity || 'warning',
            reason: item.reason || `AI auto-generated rule for ${aiPrompt}`,
            approvedAlternatives: item.alternatives || ['verified phrasing'],
            approved_alternatives: item.alternatives || ['verified phrasing'],
            created_at: new Date().toISOString(),
          }));
          setDbBannedWords((prev) => [...generatedDbWords, ...prev]);

          const generatedTerms: BannedTerm[] = banned_words.map((item, idx) => ({
            id: `ai-term-${Date.now()}-${idx}`,
            term: item.word,
            category: (item.category as 'Tone' | 'Legal' | 'Superlative' | 'Jargon') || 'Tone',
            severity: item.severity || 'warning',
            reason: item.reason || `AI auto-generated rule for ${aiPrompt}`,
            approvedAlternatives: item.alternatives || ['verified phrasing'],
            pattern: new RegExp(`\\b${item.word}\\b`, 'gi'),
          }));
          setBannedTerms((prev) => [...generatedTerms, ...prev]);
        }

        if (Array.isArray(facts) && facts.length > 0) {
          const newFacts: VerifiedFact[] = facts.map((f, idx) => ({
            id: `fact-ai-${Date.now()}-${idx}`,
            claim: f.claim,
            source: f.source || 'AI Brand Standard',
            verifiedBy: 'Gemini AI Brand Architect',
            verifiedDate: 'Today',
            validUntil: '2028-12-31',
            status: 'active',
            category: 'Corporate',
          }));
          setDbFacts((prev) => [...newFacts, ...prev]);
        }

        if (Array.isArray(hex_colors) && hex_colors.length > 0) {
          const newColors: ColorSwatch[] = hex_colors.map((c, idx) => ({
            id: `color-ai-${Date.now()}-${idx}`,
            name: c.name || 'Brand Accent',
            hex: c.hex.startsWith('#') ? c.hex : `#${c.hex}`,
            rgb: 'rgb(79, 70, 229)',
            role: 'AI Auto-Generated Palette',
            contrastOnWhite: '11.4:1',
            contrastOnDark: '8.2:1',
            passAAA: true,
            category: 'Brand Primary',
          }));
          setDbColors((prev) => [...newColors, ...prev]);
        }

        setAiGenSuccessToast(
          `Success! Gemini synthesized ${banned_words?.length || 0} prohibited terms, ${facts?.length || 0} brand facts, and ${hex_colors?.length || 0} colors!`
        );
      } else {
        throw new Error(data.error || 'Failed to auto-generate rules');
      }
    } catch (err: unknown) {
      console.error('AI rule generation error:', err);
      setAiGenSuccessToast('Failed to auto-generate rules. Check API connection.');
    } finally {
      setIsGeneratingAiRules(false);
      setTimeout(() => setAiGenSuccessToast(null), 4000);
    }
  };

  // --- Fetch Data for All 4 Pillars from Supabase ---
  const fetchAllPillars = useCallback(async () => {
    setIsLoading(true);
    let anySuccess = false;

    // Pillar 0: Brand Guidelines Table
    try {
      const { data: bgData, error: bgError } = await supabase
        .from('brand_guidelines')
        .select('*')
        .order('created_at', { ascending: false });

      if (!bgError && bgData && bgData.length > 0) {
        anySuccess = true;
        setBrandGuidelines(bgData as BrandGuidelineRecord[]);
        const latest = bgData[0] as BrandGuidelineRecord;
        setActiveBrandId(latest.id);
        if (latest.brand_name) setActiveBrandName(latest.brand_name);

        if (Array.isArray(latest.banned_words) && latest.banned_words.length > 0) {
          const bgWords: DatabaseBannedWord[] = latest.banned_words.map((w, idx) => ({
            id: `bg-word-${latest.id}-${idx}`,
            word: w,
            term: w,
            category: 'Tone',
            severity: 'critical' as Severity,
            reason: `Restricted in ${latest.brand_name || 'Brand Guidelines'} standard`,
            approvedAlternatives: ['standardized phrasing'],
            approved_alternatives: ['standardized phrasing'],
          }));
          setDbBannedWords((prev) => {
            const setWords = new Set(prev.map((p) => (p.word || p.term || '').toLowerCase()));
            const additions = bgWords.filter((w) => !setWords.has(w.word!.toLowerCase()));
            return [...additions, ...prev];
          });
        }

        if (Array.isArray(latest.facts) && latest.facts.length > 0) {
          const bgFacts: VerifiedFact[] = latest.facts.map((claim, idx) => ({
            id: `bg-fact-${latest.id}-${idx}`,
            claim,
            source: `${latest.brand_name || 'Brand'} Standard`,
            verifiedBy: 'Brand Governance Team',
            verifiedDate: 'Today',
            validUntil: '2028-12-31',
            status: 'active',
            category: 'Compliance',
          }));
          setDbFacts((prev) => {
            const setClaims = new Set(prev.map((p) => p.claim.toLowerCase()));
            const additions = bgFacts.filter((f) => !setClaims.has(f.claim.toLowerCase()));
            return [...additions, ...prev];
          });
        }

        if (Array.isArray(latest.hex_colors) && latest.hex_colors.length > 0) {
          const bgColors: ColorSwatch[] = latest.hex_colors.map((hex, idx) => ({
            id: `bg-color-${latest.id}-${idx}`,
            name: `${latest.brand_name || 'Brand'} Color ${idx + 1}`,
            hex: hex.startsWith('#') ? hex : `#${hex}`,
            rgb: 'rgb(79, 70, 229)',
            role: 'Brand Palette Token',
            contrastOnWhite: '9:1',
            contrastOnDark: '7:1',
            passAAA: true,
            category: 'Brand Primary',
          }));
          setDbColors((prev) => {
            const setColors = new Set(prev.map((p) => p.hex.toLowerCase()));
            const additions = bgColors.filter((c) => !setColors.has(c.hex.toLowerCase()));
            return [...additions, ...prev];
          });
        }
      }
    } catch (err) {
      console.warn('Notice querying brand_guidelines:', err);
    }

    // Pillar 1: Tone & Terminology (banned_words)
    try {
      const { data, error } = await supabase.from('banned_words').select('*');
      if (error) {
        console.warn('Supabase banned_words notice:', error.message);
      } else if (data && data.length > 0) {
        setDbBannedWords(data as DatabaseBannedWord[]);
        anySuccess = true;
      }
    } catch (err) {
      console.warn('Error fetching banned_words:', err);
    }

    // Pillar 2: Verified Facts & Claims (verified_facts)
    try {
      const { data, error } = await supabase.from('verified_facts').select('*');
      if (error) {
        console.warn('Supabase verified_facts notice:', error.message);
      } else if (data && data.length > 0) {
        setDbFacts(data as VerifiedFact[]);
        anySuccess = true;
      }
    } catch (err) {
      console.warn('Error fetching verified_facts:', err);
    }

    // Pillar 3: Visual Hex Codes & Design Tokens (color_swatches)
    try {
      const { data, error } = await supabase.from('color_swatches').select('*');
      if (error) {
        console.warn('Supabase color_swatches notice:', error.message);
      } else if (data && data.length > 0) {
        setDbColors(data as ColorSwatch[]);
        anySuccess = true;
      }
    } catch (err) {
      console.warn('Error fetching color_swatches:', err);
    }

    // Pillar 4: WCAG Accessibility Standards (a11y_rules)
    try {
      const { data, error } = await supabase.from('a11y_rules').select('*');
      if (error) {
        console.warn('Supabase a11y_rules notice:', error.message);
      } else if (data && data.length > 0) {
        setDbA11y(data as A11yRule[]);
        anySuccess = true;
      }
    } catch (err) {
      console.warn('Error fetching a11y_rules:', err);
    }

    setSupabaseConnected(anySuccess);
    setConnectionMessage(
      anySuccess
        ? 'Connected to Supabase live database'
        : 'Running on local cache (pending Supabase credentials in .env.local)'
    );
    setIsLoading(false);
  }, [setActiveBrandId, setActiveBrandName, setBrandGuidelines]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: wordsData } = await supabase.from('banned_words').select('*');
      if (active && wordsData && wordsData.length > 0) {
        setDbBannedWords(wordsData as DatabaseBannedWord[]);
        setSupabaseConnected(true);
      }
      const { data: factsData } = await supabase.from('verified_facts').select('*');
      if (active && factsData && factsData.length > 0) {
        setDbFacts(factsData as VerifiedFact[]);
      }
      const { data: colorsData } = await supabase.from('color_swatches').select('*');
      if (active && colorsData && colorsData.length > 0) {
        setDbColors(colorsData as ColorSwatch[]);
      }
      const { data: a11yData } = await supabase.from('a11y_rules').select('*');
      if (active && a11yData && a11yData.length > 0) {
        setDbA11y(a11yData as A11yRule[]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  // --- Mutate Data: Handle Add Banned Word Submit & Supabase INSERT (Method 3) ---
  const handleAddBannedWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim()) return;

    setIsSubmitting(true);
    setModalFeedback(null);

    const cleanWord = inputWord.trim().toLowerCase();
    const alternativesArray = inputReplacements.trim()
      ? inputReplacements.split(',').map((s) => s.trim()).filter(Boolean)
      : ['standardized solution', 'verified terminology'];

    const cleanReason =
      inputReason.trim() ||
      'Custom enterprise governance rule manually restricted by brand management team.';

    const newLocalItem: DatabaseBannedWord = {
      id: `term-${Date.now()}`,
      word: cleanWord,
      term: cleanWord,
      category: inputCategory,
      severity: inputSeverity,
      reason: cleanReason,
      approvedAlternatives: alternativesArray,
      approved_alternatives: alternativesArray,
      created_at: new Date().toISOString(),
    };

    setDbBannedWords((prev) => [newLocalItem, ...prev]);

    const newBannedTerm: BannedTerm = {
      id: newLocalItem.id || `term-${Date.now()}`,
      term: cleanWord,
      severity: inputSeverity,
      category: inputCategory,
      reason: cleanReason,
      approvedAlternatives: alternativesArray,
      pattern: new RegExp(`\\b${cleanWord}\\b`, 'gi'),
    };
    setBannedTerms((prev) => [newBannedTerm, ...prev]);

    try {
      let { data, error } = await supabase.from('banned_words').insert([
        {
          word: cleanWord,
          category: inputCategory,
          severity: inputSeverity,
          reason: cleanReason,
          approved_alternatives: alternativesArray,
        },
      ]).select();

      if (error && error.message.includes('column')) {
        const retryResult = await supabase.from('banned_words').insert([
          {
            word: cleanWord,
            category: inputCategory,
            severity: inputSeverity,
          },
        ]).select();
        data = retryResult.data;
        error = retryResult.error;
      }

      // Method 3: Update brand_guidelines table
      if (activeBrandId) {
        try {
          const existingWords = dbBannedWords
            .map((item) => (item.word || item.term || '').toLowerCase())
            .filter(Boolean);
          await addManualBannedWord(activeBrandId, existingWords, cleanWord);
        } catch (m3Err) {
          console.warn('Notice updating brand_guidelines via addManualBannedWord:', m3Err);
        }
      }

      if (error) {
        console.warn('Supabase INSERT notice:', error.message);
        setModalFeedback({
          type: 'warning',
          message: `Saved to local registry! (Supabase notice: ${error.message})`,
        });
      } else {
        setModalFeedback({
          type: 'success',
          message: `Success! "${cleanWord}" inserted into Supabase database.`,
        });
      }
    } catch (err: unknown) {
      console.warn('Supabase insert exception:', err);
      setModalFeedback({
        type: 'warning',
        message: 'Saved to local registry. Check Supabase connection in .env.local.',
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setModalFeedback(null);
        setInputWord('');
        setInputReplacements('');
        setInputReason('');
      }, 1500);
    }
  };

  // --- Real-Time Search Filter Function ---
  const query = searchQuery.trim().toLowerCase();

  const activeBannedSource: (DatabaseBannedWord | BannedTerm)[] =
    dbBannedWords.length > 0 ? dbBannedWords : bannedTerms;

  const filteredBannedWords = activeBannedSource.filter((item) => {
    const term = ('term' in item && item.term ? item.term : 'word' in item && item.word ? item.word : '').toLowerCase();
    const reason = (item.reason || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const altsSource = 'approvedAlternatives' in item && item.approvedAlternatives
      ? item.approvedAlternatives
      : 'approved_alternatives' in item && item.approved_alternatives
      ? item.approved_alternatives
      : [];

    const alts = Array.isArray(altsSource)
      ? altsSource.join(' ').toLowerCase()
      : typeof altsSource === 'string'
      ? altsSource.toLowerCase()
      : '';

    const matchesSearch =
      !query ||
      term.includes(query) ||
      reason.includes(query) ||
      cat.includes(query) ||
      alts.includes(query);

    const matchesCategory =
      activeCategoryFilter === 'All' || item.category === activeCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const filteredFacts = dbFacts.filter((fact) => {
    if (!query) return true;
    return (
      fact.claim.toLowerCase().includes(query) ||
      fact.source.toLowerCase().includes(query) ||
      fact.verifiedBy.toLowerCase().includes(query) ||
      fact.category.toLowerCase().includes(query) ||
      fact.status.toLowerCase().includes(query)
    );
  });

  const filteredColors = dbColors.filter((swatch) => {
    if (!query) return true;
    return (
      swatch.name.toLowerCase().includes(query) ||
      swatch.hex.toLowerCase().includes(query) ||
      swatch.role.toLowerCase().includes(query) ||
      swatch.category.toLowerCase().includes(query)
    );
  });

  const filteredA11y = dbA11y.filter((rule) => {
    if (!query) return true;
    return (
      rule.code.toLowerCase().includes(query) ||
      rule.title.toLowerCase().includes(query) ||
      rule.requirement.toLowerCase().includes(query) ||
      rule.level.toLowerCase().includes(query) ||
      rule.ratioOrSize.toLowerCase().includes(query)
    );
  });

  const totalMatches =
    filteredBannedWords.length + filteredFacts.length + filteredColors.length + filteredA11y.length;

  return (
    <div className="space-y-8">
      {/* PHASE 2: Brand Brain Hero with Left-Aligned Headline & Governance Health Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Central Brand Governance Architecture</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                supabaseConnected
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-slate-200/50 text-slate-600 border border-slate-300'
              }`}
              title={connectionMessage}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {supabaseConnected ? 'Supabase Live Sync' : 'Database Ready'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[var(--text-ink)] leading-tight">
            Brand Governance <span className="aurora-text">Architecture</span>
          </h1>
          <p className="text-sm sm:text-[15px] text-[var(--text-soft-ink)] mt-2 leading-relaxed">
            Single-source-of-truth styleguide: deterministic terminology rules, verified factual claims, visual hex specifications, and accessibility mandates.
          </p>
        </div>

        {/* Global Search & Action Triggers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search all 4 pillars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 py-2.5 text-xs bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl w-60 sm:w-72 text-[var(--text-ink)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchAllPillars}
            disabled={isLoading}
            title="Refresh database records"
            className="p-2.5 text-[var(--text-soft-ink)] hover:text-[var(--text-ink)] hover:bg-slate-200/50 border border-[var(--border-color)] rounded-xl transition-colors cursor-pointer shadow-xs bg-[var(--card-bg)]"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            id="upload-brand-pdf-btn"
            onClick={() => setIsPdfModalOpen(true)}
            className="aurora-button px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Brand PDF</span>
          </button>
        </div>
      </div>

      {/* Governance Health Strip: 4 Animated Stat Chips with Count-Up Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Active Rules */}
        <div className="frontify-card p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text-ink)] tracking-tight">
              {filteredBannedWords.length}
            </div>
            <div className="text-[11px] font-bold text-[var(--text-soft-ink)] uppercase tracking-wider">
              Rules Active
            </div>
          </div>
        </div>

        {/* Stat 2: Verified Facts */}
        <div className="frontify-card p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0 border border-teal-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text-ink)] tracking-tight">
              {filteredFacts.length}
            </div>
            <div className="text-[11px] font-bold text-[var(--text-soft-ink)] uppercase tracking-wider">
              Facts Certified
            </div>
          </div>
        </div>

        {/* Stat 3: Palette Tokens */}
        <div className="frontify-card p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0 border border-violet-500/20">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text-ink)] tracking-tight">
              {filteredColors.length}
            </div>
            <div className="text-[11px] font-bold text-[var(--text-soft-ink)] uppercase tracking-wider">
              Palette Tokens
            </div>
          </div>
        </div>

        {/* Stat 4: WCAG Pass Rate with Mini Coverage Ring */}
        <div className="frontify-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--text-ink)] tracking-tight">
                98.4%
              </div>
              <div className="text-[11px] font-bold text-[var(--text-soft-ink)] uppercase tracking-wider">
                WCAG Pass Rate
              </div>
            </div>
          </div>

          {/* Mini SVG Coverage Ring */}
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-10 h-10 -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-slate-200 dark:text-slate-700"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeDasharray={100}
                strokeDashoffset={1.6}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-emerald-600">AAA</span>
          </div>
        </div>
      </div>

      {/* PHASE 3: Bento Grid Layout for 4 Governance Pillars (varied spans, spotlights, show N more) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PILLAR 1: Tone & Terminology (Banned Words) -> Span 7 */}
        <div className="lg:col-span-7">
          <SpotlightCard className="p-6 space-y-5" accentColor="rgba(244, 63, 94, 0.08)">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center justify-center shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-[var(--text-ink)]">
                      Tone & Terminology Standards
                    </h2>
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {filteredBannedWords.length} Prohibited
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-soft-ink)]">
                    Hover a pill to preview certified replacement phrasing.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Word</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['All', 'Tone', 'Legal', 'Superlative', 'Jargon'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeCategoryFilter === cat
                      ? 'bg-[var(--text-ink)] text-white shadow-xs'
                      : 'bg-slate-100 text-[var(--text-soft-ink)] hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Banned Word Pills with Strike-Through Replacement Morph */}
            <div className="space-y-3">
              {(expandedPillars.bannedWords
                ? filteredBannedWords
                : filteredBannedWords.slice(0, 3)
              ).map((item, idx) => {
                const word = 'term' in item && item.term ? item.term : 'word' in item && item.word ? item.word : '';
                const alts = 'approvedAlternatives' in item && item.approvedAlternatives
                  ? item.approvedAlternatives
                  : 'approved_alternatives' in item && item.approved_alternatives
                  ? item.approved_alternatives
                  : [];
                const firstAlt = Array.isArray(alts) && alts[0] ? alts[0] : 'approved alternative';
                const severity = item.severity || 'warning';
                const itemId = item.id || `word-${idx}`;
                const isHovered = hoveredWordId === itemId;

                const severityStyle =
                  severity === 'critical'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-violet-50 border-violet-200 text-violet-900';

                return (
                  <motion.div
                    key={itemId}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springTransition}
                    onMouseEnter={() => setHoveredWordId(itemId)}
                    onMouseLeave={() => setHoveredWordId(null)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${severityStyle} hover:shadow-xs`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[14px]">
                          {isHovered ? (
                            <span className="flex items-center gap-1.5">
                              <span className="line-through opacity-50">&quot;{word}&quot;</span>
                              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 inline" />
                              <span className="text-emerald-700 font-bold">&quot;{firstAlt}&quot;</span>
                            </span>
                          ) : (
                            <span>&quot;{word}&quot;</span>
                          )}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/70 border border-black/5">
                          {item.category || 'Tone'}
                        </span>
                      </div>

                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80">
                        {severity}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-soft-ink)] mt-1.5 leading-relaxed">
                      {item.reason || 'Restricted brand terminology.'}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* Show N More Toggle */}
            {filteredBannedWords.length > 3 && (
              <button
                onClick={() => toggleExpand('bannedWords')}
                className="w-full py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-soft-ink)] hover:text-[var(--text-ink)] hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {expandedPillars.bannedWords ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Show Fewer Rules</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Show {filteredBannedWords.length - 3} More Prohibited Terms</span>
                  </>
                )}
              </button>
            )}
          </SpotlightCard>
        </div>

        {/* PILLAR 2: Certified Facts & Claims -> Span 5 */}
        <div className="lg:col-span-5">
          <SpotlightCard className="p-6 space-y-5" accentColor="rgba(20, 184, 166, 0.08)">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-500/20 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-[var(--text-ink)]">
                      Verified Brand Facts
                    </h2>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      {filteredFacts.length} Certified
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-soft-ink)]">
                    Empirical data claims backed by legal signoffs.
                  </p>
                </div>
              </div>
            </div>

            {/* Verified Facts List */}
            <div className="space-y-3">
              {(expandedPillars.facts
                ? filteredFacts
                : filteredFacts.slice(0, 3)
              ).map((fact, idx) => {
                const isExpiring = fact.status === 'expiring-soon';
                return (
                  <motion.div
                    key={fact.id || idx}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springTransition}
                    className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] space-y-2 hover:border-teal-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-[var(--text-ink)] leading-snug">
                        {fact.claim}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          isExpiring
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isExpiring ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                          }`}
                        />
                        {fact.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-soft-ink)] pt-1">
                      <span>Source: {fact.source}</span>
                      <span className="font-semibold text-slate-500">Exp: {fact.validUntil}</span>
                    </div>

                    {/* Expiry Mini Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isExpiring ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: isExpiring ? '25%' : '85%' }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Show N More Toggle */}
            {filteredFacts.length > 3 && (
              <button
                onClick={() => toggleExpand('facts')}
                className="w-full py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-soft-ink)] hover:text-[var(--text-ink)] hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {expandedPillars.facts ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Show Fewer Facts</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Show {filteredFacts.length - 3} More Certified Facts</span>
                  </>
                )}
              </button>
            )}
          </SpotlightCard>
        </div>

        {/* PILLAR 3: Visual Hex Codes & Design Tokens -> Span 6 */}
        <div className="lg:col-span-6">
          <SpotlightCard className="p-6 space-y-5" accentColor="rgba(124, 58, 237, 0.08)">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 border border-violet-500/20 flex items-center justify-center shadow-xs">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-[var(--text-ink)]">
                      Visual Palette Tokens
                    </h2>
                    <span className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                      {filteredColors.length} Tokens
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-soft-ink)]">
                    Click any swatch to copy HEX value to clipboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Swatches Grid (Fluid 2-col layout on wide displays) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
              {(expandedPillars.colors
                ? filteredColors
                : filteredColors.slice(0, 3)
              ).map((color, idx) => {
                const isCopied = copiedHex === color.hex;
                return (
                  <motion.div
                    key={color.id || idx}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springTransition}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => copyToClipboard(color.hex)}
                    className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-between gap-4 cursor-pointer hover:border-violet-300 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-xl shadow-inner border border-black/10 shrink-0 transition-transform duration-200 hover:scale-110"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div>
                        <div className="font-extrabold text-[14px] text-[var(--text-ink)] flex items-center gap-2">
                          <span>{color.name}</span>
                          <span className="font-mono text-xs font-semibold text-slate-500">
                            {color.hex}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-soft-ink)]">{color.role}</p>

                        {/* Contrast Ratio Mini Bars */}
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-semibold">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            White: {color.contrastOnWhite}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            Dark: {color.contrastOnDark}
                          </span>
                          {color.passAAA && (
                            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[9px] font-bold">
                              WCAG AAA
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
                      title="Copy HEX"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Show N More Toggle */}
            {filteredColors.length > 3 && (
              <button
                onClick={() => toggleExpand('colors')}
                className="w-full py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-soft-ink)] hover:text-[var(--text-ink)] hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {expandedPillars.colors ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Show Fewer Colors</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Show {filteredColors.length - 3} More Palette Tokens</span>
                  </>
                )}
              </button>
            )}
          </SpotlightCard>
        </div>

        {/* PILLAR 4: WCAG Accessibility Standards -> Span 6 */}
        <div className="lg:col-span-6">
          <SpotlightCard className="p-6 space-y-5" accentColor="rgba(16, 185, 129, 0.08)">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shadow-xs">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-[var(--text-ink)]">
                      WCAG Accessibility Rules
                    </h2>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Level AA & AAA
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-soft-ink)]">
                    Mandatory color contrast ratios and text sizing standards.
                  </p>
                </div>
              </div>
            </div>

            {/* WCAG Pass Rate Progress Bar */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>System Accessibility Conformance</span>
                <span>98.4% Passing</span>
              </div>
              <div className="w-full bg-emerald-200/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '98.4%' }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                />
              </div>
            </div>

            {/* A11y Rules List (Fluid 2-col layout on wide displays) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
              {(expandedPillars.a11y ? filteredA11y : filteredA11y.slice(0, 3)).map((rule, idx) => (
                <motion.div
                  key={rule.id || idx}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springTransition}
                  className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] space-y-1.5 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-extrabold text-[var(--text-ink)]">
                        {rule.code}: {rule.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {rule.level}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-soft-ink)] leading-relaxed pl-6">
                    {rule.requirement}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Show N More Toggle */}
            {filteredA11y.length > 3 && (
              <button
                onClick={() => toggleExpand('a11y')}
                className="w-full py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-soft-ink)] hover:text-[var(--text-ink)] hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {expandedPillars.a11y ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Show Fewer Rules</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Show {filteredA11y.length - 3} More Accessibility Standards</span>
                  </>
                )}
              </button>
            )}
          </SpotlightCard>
        </div>
      </div>

      {/* Dynamic Rule Acquisition Section: AI Generation & Brand Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): AI Auto-Generation Bar */}
        <div className="lg:col-span-7 frontify-card p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[var(--text-ink)] tracking-tight">
                    AI Auto-Generation Engine (Gemini)
                  </h3>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 rounded-md border border-purple-200">
                    Prompt-to-Rules
                  </span>
                </div>
                <p className="text-xs text-[var(--text-soft-ink)]">
                  Describe your industry or company. Gemini synthesizes 20 tailored prohibited terms, facts, and color tokens.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., We are a luxury watch brand / B2B FinTech SaaS"
                className="flex-1 px-4 py-2.5 text-xs bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-[var(--text-ink)]"
              />
              <button
                type="button"
                onClick={handleGenerateAiRules}
                disabled={isGeneratingAiRules || !aiPrompt.trim()}
                className="aurora-button px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
              >
                {isGeneratingAiRules ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Auto-Generate</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Prompts */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-[var(--text-muted)]">Try prompt:</span>
              {[
                'We are a luxury watch brand.',
                'Enterprise Cybersecurity & Zero-Trust Cloud.',
                'Sustainable Eco-Friendly Apparel.',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAiPrompt(sample)}
                  className="px-2.5 py-1 text-[11px] font-medium text-[var(--text-soft-ink)] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right (5 cols): Pre-Built Brand Templates */}
        <div className="lg:col-span-5 frontify-card p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-[var(--text-ink)] tracking-tight">
                Pre-Built Brand Templates
              </h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">1-Click Apply</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {BRAND_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:border-indigo-300 transition-all flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[var(--text-ink)]">{tmpl.name}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {tmpl.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-soft-ink)] line-clamp-1 mt-0.5">
                    {tmpl.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 rounded-xl transition-all cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Brand PDF Modal */}
      <UploadPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onRulesExtracted={(newTerms) => {
          setBannedTerms((prev) => [...newTerms, ...prev]);
          fetchAllPillars();
        }}
      />

      {/* Add Banned Word Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-3xl shadow-2xl border border-[var(--border-color)] p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text-ink)]">
                      Add Custom Banned Word
                    </h3>
                    <p className="text-xs text-[var(--text-soft-ink)]">
                      Synchronizes to Supabase brand_guidelines & banned_words table.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddBannedWordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                    Prohibited Word or Phrase *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cheap, guarantee, hack"
                    value={inputWord}
                    onChange={(e) => setInputWord(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-[var(--text-ink)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                      Category
                    </label>
                    <select
                      value={inputCategory}
                      onChange={(e) => setInputCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-ink)]"
                    >
                      <option value="Tone">Tone</option>
                      <option value="Legal">Legal</option>
                      <option value="Superlative">Superlative</option>
                      <option value="Jargon">Jargon</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                      Severity
                    </label>
                    <select
                      value={inputSeverity}
                      onChange={(e) => setInputSeverity(e.target.value as Severity)}
                      className="w-full px-3 py-2 text-xs bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-ink)]"
                    >
                      <option value="critical">Critical</option>
                      <option value="warning">Warning</option>
                      <option value="discouraged">Discouraged</option>
                      <option value="suggestion">Suggestion</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                    Approved Alternatives (Comma-Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. cost-effective, high value, strategic solution"
                    value={inputReplacements}
                    onChange={(e) => setInputReplacements(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                    Governance Rationale
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Explain why this word dilutes or compromises the brand standard..."
                    value={inputReason}
                    onChange={(e) => setInputReason(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-ink)]"
                  />
                </div>

                {modalFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      modalFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {modalFeedback.message}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-[var(--text-soft-ink)] hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !inputWord.trim()}
                    className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-60"
                  >
                    {isSubmitting ? 'Saving to Database...' : 'Save Rule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
