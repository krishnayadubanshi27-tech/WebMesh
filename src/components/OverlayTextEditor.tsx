'use client';

import React, { useRef, useMemo, useEffect } from 'react';

interface OverlayTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  bannedWords: string[];
  aiWords?: string[];
  placeholder?: string;
  id?: string;
  className?: string;
  minHeight?: string;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Custom 2-Layer Overlay Text Editor:
 * - Bottom layer (div): High-contrast text-slate-200 with wavy rose underline for banned words
 *   and dashed violet underline for AI tone issues.
 * - Top layer (transparent textarea): Transparent input where user types with matching font, padding, line-height & synchronized scroll.
 */
export const OverlayTextEditor: React.FC<OverlayTextEditorProps> = ({
  value,
  onChange,
  bannedWords,
  aiWords = [],
  placeholder = 'Write or paste copy to audit in real-time...',
  id = 'copilot-overlay-textarea',
  className = '',
  minHeight = 'min-h-[440px] xl:min-h-[500px]',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Synchronize scrolling between textarea and backdrop layer
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Keep scroll in sync when value changes programmatically (e.g. presets or 1-Click Fix)
  useEffect(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [value]);

  // Normalized banned words set including plural and common verb forms
  const bannedSet = useMemo(() => {
    const set = new Set<string>();
    bannedWords.forEach((word) => {
      if (word && typeof word === 'string') {
        const lower = word.trim().toLowerCase();
        if (!lower) return;
        set.add(lower);

        // Inflections to catch real-world usage (e.g. guarantee -> guarantees)
        if (lower.endsWith('y')) {
          set.add(lower.slice(0, -1) + 'ies');
        } else {
          set.add(lower + 's');
          set.add(lower + 'd');
          set.add(lower + 'ed');
          set.add(lower + 'ing');
        }
      }
    });
    return set;
  }, [bannedWords]);

  const aiSet = useMemo(() => {
    const set = new Set<string>();
    aiWords.forEach((word) => {
      if (word && typeof word === 'string') {
        const lower = word.trim().toLowerCase();
        if (lower) set.add(lower);
      }
    });
    return set;
  }, [aiWords]);

  // Combined tokenization pattern
  const regex = useMemo(() => {
    const allWords = new Set<string>([...bannedSet, ...aiSet]);
    if (allWords.size === 0) return null;
    const sortedWords = Array.from(allWords).sort((a, b) => b.length - a.length);
    const pattern = `(\\b(?:${sortedWords.map(escapeRegExp).join('|')})\\b)`;
    return new RegExp(pattern, 'gi');
  }, [bannedSet, aiSet]);

  const renderBackdropTokens = () => {
    if (!value) return null;
    if (!regex) {
      return (
        <span className="text-slate-200 font-normal">
          {value}
        </span>
      );
    }

    const parts = value.split(regex);
    return parts.map((part, index) => {
      const lower = part.toLowerCase();
      const isBanned = bannedSet.has(lower);
      const isAi = aiSet.has(lower);

      if (isBanned) {
        return (
          <span
            key={index}
            className="bg-rose-500/20 text-rose-200 underline decoration-wavy decoration-rose-400 font-semibold px-1 py-0.5 rounded-xs border border-rose-500/30"
          >
            {part}
          </span>
        );
      }
      if (isAi) {
        return (
          <span
            key={index}
            className="bg-violet-500/20 text-violet-200 underline decoration-dashed decoration-violet-400 font-semibold px-1 py-0.5 rounded-xs border border-violet-500/30"
          >
            {part}
          </span>
        );
      }
      return (
        <span
          key={index}
          className="text-slate-200 font-normal"
        >
          {part}
        </span>
      );
    });
  };

  // Shared typography and layout classes ensuring 100% alignment at 16px / line-height 1.7
  const sharedTypographyStyles =
    'font-sans text-[16px] leading-[1.7] font-normal tracking-normal p-5 whitespace-pre-wrap break-words text-slate-200';

  return (
    <div
      className={`relative w-full ${minHeight} rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-hidden text-slate-200 ${className}`}
    >
      {/* BOTTOM LAYER: Highlighting Div */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={`absolute inset-0 overflow-auto pointer-events-none select-none text-slate-200 ${sharedTypographyStyles} scrollbar-none`}
        style={{
          boxSizing: 'border-box',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          color: '#e2e8f0',
        }}
      >
        {renderBackdropTokens()}
        {/* Preserve trailing newline height when user presses enter at end */}
        {value.endsWith('\n') && <br />}
      </div>

      {/* TOP LAYER: Transparent Textarea */}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className={`absolute inset-0 w-full h-full bg-transparent resize-none border-0 outline-none ${sharedTypographyStyles} ${
          value ? 'text-transparent' : 'text-slate-200'
        } caret-indigo-400 placeholder:text-slate-500 [&::placeholder]:[-webkit-text-fill-color:#64748b] selection:bg-indigo-500/30 selection:text-transparent selection:[-webkit-text-fill-color:transparent] z-10`}
        style={{
          boxSizing: 'border-box',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          caretColor: '#818cf8',
        }}
      />
    </div>
  );
};
