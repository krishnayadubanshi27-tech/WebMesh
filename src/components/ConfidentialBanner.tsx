'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Cpu, Server, CheckCircle2, Shield, Terminal } from 'lucide-react';

interface ConfidentialBannerProps {
  isActive: boolean;
}

export const ConfidentialBanner: React.FC<ConfidentialBannerProps> = ({ isActive }) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden bg-[#070D22] text-white border-b border-emerald-500/30 shadow-[0_4px_24px_rgba(16,185,129,0.12)] relative z-40"
        >
          {/* Subtle grid accent inside banner */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs relative z-10">
            <div className="flex items-center gap-3">
              {/* Animated Shield Icon */}
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-emerald-400 opacity-40" />
                <motion.div
                  animate={{ rotateY: [0, 180, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                </motion.div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-emerald-400 uppercase text-[11px] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Air-Gapped Vault Active
                </span>
                <span className="hidden sm:inline-block text-slate-500">•</span>
                <span className="text-slate-300 font-medium text-[11px] hidden md:inline">
                  Local Ollama Engine (Llama-3.3 70B Quantized)
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-3 text-[11px] text-slate-300">
              {/* Local - Ollama - Zero-Retention badge */}
              <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-400/30 font-bold shadow-xs">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Local • Ollama • Zero-Retention</span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-slate-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 font-medium">
                <Cpu className="w-3 h-3 text-emerald-400" />
                <span>18ms On-Prem Latency</span>
              </div>

              <div className="hidden lg:flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SOC-2 Air-Gapped Egress Lock</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
