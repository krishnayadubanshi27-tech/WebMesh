'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Layers,
  ShieldCheck,
  Zap,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { LoginCard } from './LoginCard';

export const LoginPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#F8FAFC] selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* LEFT PANEL: Enterprise Brand Panel (Hidden below lg) */}
      <div className="hidden lg:flex flex-col justify-between min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0B1030] via-[#161244] to-[#1B1450] text-white p-10 xl:p-14 2xl:p-16">
        {/* Soft Animated Gradient Mesh (Transform-only, low-opacity) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0" aria-hidden="true">
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    transform: [
                      'translate(0px, 0px) scale(1)',
                      'translate(50px, -40px) scale(1.15)',
                      'translate(-30px, 40px) scale(0.95)',
                      'translate(0px, 0px) scale(1)',
                    ],
                  }
            }
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-[15%] -left-[10%] w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-indigo-500/25 via-violet-500/20 to-pink-500/15 blur-[100px]"
          />
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    transform: [
                      'translate(0px, 0px) scale(1)',
                      'translate(-60px, 50px) scale(1.1)',
                      'translate(40px, -30px) scale(0.9)',
                      'translate(0px, 0px) scale(1)',
                    ],
                  }
            }
            transition={{
              duration: 26,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -bottom-[20%] -right-[15%] w-[640px] h-[640px] rounded-full bg-gradient-to-bl from-teal-500/18 via-indigo-600/20 to-purple-600/20 blur-[120px]"
          />
          {/* Subtle Vault Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        </div>

        {/* Top: Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-black">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-[20px] tracking-tight text-white">
                BrandMesh
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-white/10 text-indigo-300 rounded-md border border-white/15 backdrop-blur-xs">
                Enterprise
              </span>
            </div>
            <p className="text-[12px] text-slate-300 font-medium">
              AI Brand Governance Co-Pilot
            </p>
          </div>
        </div>

        {/* Middle: Value Prop & Benefit Lines */}
        <div className="relative z-10 my-auto py-10 space-y-8 max-w-lg">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Next-Gen Styleguide Co-Pilot</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.2]">
              Unified AI Brand Governance & Real-Time Compliance.
            </h2>
            <p className="text-[15px] text-slate-300 leading-relaxed font-normal">
              Guard your brand integrity across marketing, sales, and product copy before anything goes live.
            </p>
          </div>

          {/* 3 Benefit Lines with Lucide Icons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Automated Copy Compliance</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Real-time scans against banned terminology, unverified SLA promises, and tone discrepancies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-300 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sub-Second AI Context Rewrites</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Intelligent rewrite suggestions powered by multimodal Gemini and air-gapped confidential models.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/30 text-pink-300 flex items-center justify-center shrink-0 mt-0.5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Auditable Approval Workflows</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Kanban review queues, fast-track routing for 90+ trust scores, and enterprise sign-off telemetry.
                </p>
              </div>
            </div>
          </div>

          {/* Floating "Trust Score 92%" Mini-Card echoing the product */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl flex items-center gap-4 max-w-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex flex-col items-center justify-center shrink-0 font-extrabold shadow-md shadow-emerald-500/30">
              <span className="text-sm leading-none">92%</span>
              <span className="text-[9px] uppercase tracking-wider font-bold opacity-90">Score</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enterprise Verified</span>
              </div>
              <p className="text-[12px] text-slate-200 font-medium truncate mt-0.5">
                Q4 Omnichannel Launch Campaign
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-300">
                  <TrendingUp className="w-3 h-3" />
                  +14% vs baseline
                </span>
                <span>•</span>
                <span>Top 5% Brand Integrity</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom: Compliance Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span>SOC2 Type II Certified</span>
          <span>•</span>
          <span>WCAG 2.2 AAA Compliant</span>
          <span>•</span>
          <span>Frontify & Acrolinx Standard</span>
        </div>
      </div>

      {/* RIGHT PANEL: Centred Login Card */}
      <div className="w-full min-h-screen flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-14 xl:p-16 relative">
        {/* Ambient subtle background glow */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <LoginCard />
        </div>
      </div>
    </div>
  );
};
