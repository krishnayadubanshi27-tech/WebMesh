'use client';

import React, { useRef, useMemo, useEffect } from 'react';

interface OverlayTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  bannedWords: string[];
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
 * - Bottom layer (div): Perfectly renders live text with `bg-red-100 text-red-600 underline decoration-wavy`
 *   on any word matching the active banned words registry.
 * - Top layer (transparent textarea): Transparent input where user types with matching font, padding, line-height & synchronized scroll.
 */
export const OverlayTextEditor: React.FC<OverlayTextEditorProps> = ({
  value,
  onChange,
  bannedWords,
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

  // Tokenize text into matches and non-matches
  const regex = useMemo(() => {
    if (bannedSet.size === 0) return null;
    const sortedWords = Array.from(bannedSet).sort((a, b) => b.length - a.length);
    const pattern = `(\\b(?:${sortedWords.map(escapeRegExp).join('|')})\\b)`;
    return new RegExp(pattern, 'gi');
  }, [bannedSet]);

  const renderBackdropTokens = () => {
    if (!value) return null;
    if (!regex) {
      return (
        <span className="text-[color:var(--fg)] font-normal" style={{ color: 'var(--fg)' }}>
          {value}
        </span>
      );
    }

    const parts = value.split(regex);
    return parts.map((part, index) => {
      const isBanned = bannedSet.has(part.toLowerCase());
      if (isBanned) {
        return (
          <span
            key={index}
            className="bg-red-100 text-red-700 underline decoration-wavy decoration-red-600 font-bold px-0.5 rounded-xs"
            style={{ color: '#b91c1c' }}
          >
            {part}
          </span>
        );
      }
      return (
        <span
          key={index}
          className="text-[color:var(--fg)] font-normal"
          style={{ color: 'var(--fg)' }}
        >
          {part}
        </span>
      );
    });
  };

  // Shared typography and layout classes ensuring 100% alignment at 16px / line-height 1.7
  const sharedTypographyStyles =
    'font-sans text-[16px] leading-[1.7] font-normal tracking-normal p-5 whitespace-pre-wrap break-words';

  return (
    <div
      className={`relative w-full ${minHeight} rounded-2xl surface-light bg-white border border-[color:var(--line)] focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-hidden ${className}`}
    >
      {/* BOTTOM LAYER: Highlighting Div */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={`absolute inset-0 overflow-auto pointer-events-none select-none text-[color:var(--fg)] ${sharedTypographyStyles} scrollbar-none`}
        style={{
          boxSizing: 'border-box',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          color: 'var(--fg)',
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
          value ? 'text-transparent' : 'text-[color:var(--fg)]'
        } caret-[#4F46E5] placeholder:text-[color:var(--fg-muted)] [&::placeholder]:[-webkit-text-fill-color:var(--fg-muted)] selection:bg-indigo-500/25 selection:text-transparent selection:[-webkit-text-fill-color:transparent] z-10`}
        style={{
          boxSizing: 'border-box',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          caretColor: '#4F46E5',
        }}
      />
    </div>
  );
};
