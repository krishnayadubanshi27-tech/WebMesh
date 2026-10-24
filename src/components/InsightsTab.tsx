'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RuleInsight,
  DepartmentMetric,
} from '@/types/brandmesh';
import { springTransition } from '@/utils';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Stethoscope,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  AlertCircle,
  FileCheck,
  Check,
  Building2,
  Calendar,
  Download,
  Activity,
  Zap,
} from 'lucide-react';

interface InsightsTabProps {
  topViolations: RuleInsight[];
  departmentMetrics: DepartmentMetric[];
  onAcceptDoctorRecommendation: () => void;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
  topViolations,
  departmentMetrics,
  onAcceptDoctorRecommendation,
}) => {
  const [hasAcceptedDoctor, setHasAcceptedDoctor] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoveredRule, setHoveredRule] = useState<RuleInsight | null>(null);

  const handleAcceptRecommendation = () => {
    setHasAcceptedDoctor(true);
    onAcceptDoctorRecommendation();
  };

  // Dynamic range multipliers for animating values between 7 / 30 / 90 days
  const rangeMultiplier = timeRange === '7d' ? 0.28 : timeRange === '90d' ? 2.65 : 1.0;

  const getAdjustedCount = (baseCount: number) => {
    return Math.max(1, Math.round(baseCount * rangeMultiplier));
  };

  const maxAdjustedViolations = Math.max(
    ...topViolations.map((v) => getAdjustedCount(v.violations30Days)),
    40
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="frontify-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-primary uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-brand-primary" />
            <span>Executive Governance Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-ink-primary tracking-tight mt-0.5">
            Insights & <span className="aurora-text">Guideline Doctor</span>
          </h1>
          <p className="text-xs text-ink-secondary">
            Empirical compliance telemetry, rule friction diagnostics, and self-healing brand guidelines.
          </p>
        </div>

        {/* 7d / 30d / 90d Segmented Range with Sliding LayoutId Thumb */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center bg-bg-app p-1 rounded-2xl border border-border-card text-xs font-bold">
            {(['7d', '30d', '90d'] as const).map((range) => {
              const isActive = timeRange === range;
              return (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`relative px-3.5 py-1.5 transition-colors cursor-pointer z-10 ${
                    isActive ? 'text-ink-primary font-black' : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="range-slider-thumb"
                      transition={springTransition}
                      className="absolute inset-0 bg-bg-card rounded-xl shadow-xs border border-border-card"
                    />
                  )}
                  <span className="relative z-10">
                    {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                  </span>
                </button>
              );
            })}
          </div>

          <button className="px-3.5 py-2 text-xs font-bold text-ink-primary bg-bg-card hover:bg-bg-app rounded-xl border border-border-card flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95">
            <Download className="w-3.5 h-3.5 text-brand-primary" />
            <span className="hidden sm:inline">Export Audit PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row with Count-Up Style Numbers & Tiny Delta Arrows */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -3, transition: springTransition }}
          className="frontify-card p-5 space-y-1.5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
              Total Assets Audited
            </span>
            <div className="w-2 h-2 rounded-full bg-brand-primary/40" />
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={timeRange}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black text-ink-primary tracking-tight"
            >
              {timeRange === '7d' ? '482' : timeRange === '90d' ? '5,820' : '1,952'}
            </motion.span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +18.4%
            </span>
          </div>
          <p className="text-[11px] text-ink-secondary">Across 14 enterprise workspaces</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: springTransition }}
          className="frontify-card p-5 space-y-1.5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
              Overall Trust Index
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={timeRange}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black text-ink-primary tracking-tight"
            >
              {timeRange === '7d' ? '92.8%' : timeRange === '90d' ? '89.4%' : '91.4%'}
            </motion.span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +6.2%
            </span>
          </div>
          <p className="text-[11px] text-ink-secondary">Target threshold: 90% benchmark</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: springTransition }}
          className="frontify-card p-5 space-y-1.5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
              1-Click Fix Adoption
            </span>
            <div className="w-2 h-2 rounded-full bg-indigo-500/40" />
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={timeRange}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black text-ink-primary tracking-tight"
            >
              84.7%
            </motion.span>
            <span className="text-xs font-bold text-brand-primary flex items-center bg-brand-primary/10 px-1.5 py-0.2 rounded-full">
              <Sparkles className="w-3 h-3 mr-0.5" /> High
            </span>
          </div>
          <p className="text-[11px] text-ink-secondary">Saved ~340 review hours this period</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: springTransition }}
          className="frontify-card p-5 space-y-1.5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
              Manual Escalation Rate
            </span>
            <div className="w-2 h-2 rounded-full bg-rose-500/40" />
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={timeRange}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black text-ink-primary tracking-tight"
            >
              6.2%
            </motion.span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
              <TrendingDown className="w-3 h-3 mr-0.5" /> -4.1%
            </span>
          </div>
          <p className="text-[11px] text-ink-secondary">Down from 10.3% previous baseline</p>
        </motion.div>
      </div>

      {/* GUIDELINE DOCTOR: Dark Ink Panel with Rotating Conic-Gradient Border and ECG Heartbeat */}
      <div className="relative rounded-3xl p-[1.5px] overflow-hidden shadow-2xl">
        {/* Animated Conic Gradient Border Sheen */}
        <div className="conic-border-glow absolute -inset-[200%] opacity-80" />

        {/* Dark Ink Panel Interior */}
        <div className="relative z-10 dark-ink-panel p-6 sm:p-8 rounded-[23px] text-white space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Doctor Stethoscope Badge */}
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-brand-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                <Stethoscope className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/25 text-indigo-300 border border-indigo-400/30">
                    Guideline Doctor • AI Prescriptive Diagnosis
                  </span>
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    High Rule Friction Detected
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Pricing Rule #PR-02 (&quot;Unhedged Guarantees&quot;) violated 14 times
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-5xl">
                  <strong>Empirical Clinical Finding:</strong> Enterprise Demand Generation and Sales teams frequently draft SLA assurance, but an absolute prohibition on assurance phrasing forces <strong>68% of marketing assets</strong> into manual legal escalation queues.
                </p>
              </div>
            </div>

            {/* ECG Heartbeat Line Animation */}
            <div className="shrink-0 flex flex-col items-center lg:items-end justify-center space-y-2">
              <div className="w-48 h-12 relative flex items-center">
                <svg className="w-full h-full" viewBox="0 0 200 40" fill="none">
                  {/* Subtle background pulse track */}
                  <path
                    d="M 0,20 L 40,20 L 50,8 L 60,32 L 70,16 L 80,24 L 90,20 L 140,20 L 150,5 L 160,35 L 170,20 L 200,20"
                    stroke="rgba(99, 102, 241, 0.2)"
                    strokeWidth="2"
                    fill="none"
                  />
                  {/* Glowing animated lead */}
                  <path
                    className="ecg-path"
                    d="M 0,20 L 40,20 L 50,8 L 60,32 L 70,16 L 80,24 L 90,20 L 140,20 L 150,5 L 160,35 L 170,20 L 200,20"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Brand Health Monitor
              </span>
            </div>
          </div>

          {/* Before vs After Rule Simplification Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.04] p-4.5 rounded-2xl border border-white/10">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                Current Restrictive Rule:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-mono bg-black/30 p-2.5 rounded-xl border border-white/5">
                &quot;Prohibit all assurance phrasing ('guarantee', 'commit', 'promise') across marketing collateral unconditionally.&quot;
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                Prescribed Self-Healing Rule:
              </span>
              <p className="text-xs text-emerald-200 leading-relaxed font-mono bg-black/30 p-2.5 rounded-xl border border-emerald-500/30">
                &quot;Permit SLA-hedged commitments with verified hyperlink: <em>'Commit to 99.99% uptime subject to Enterprise SLA terms.'</em>&quot;
              </p>
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Zap className="w-4 h-4 text-brand-primary" />
              <span>Projected impact: Eliminates 38 false-positive review blocks per month.</span>
            </div>

            {hasAcceptedDoctor ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Recommendation Applied to Brand Brain</span>
              </motion.div>
            ) : (
              <button
                id="accept-doctor-recommendation-btn"
                onClick={handleAcceptRecommendation}
                className="aurora-button px-6 py-3 rounded-2xl font-black text-xs text-white tracking-wide shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply Guideline Doctor Suggestion</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: Custom Bar Chart (7 Cols) & Department Leaderboard (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Custom SVG/Div Bar Chart with Sparkline Tooltips & Staggered Bar Animations */}
        <div className="lg:col-span-7 frontify-card p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink-primary">
                Most Frequently Violated Brand Rules
              </h3>
              <p className="text-xs text-ink-secondary">
                Empirical friction density by policy code ({timeRange.toUpperCase()} view)
              </p>
            </div>
            <span className="text-xs font-bold text-ink-secondary bg-bg-app px-2.5 py-1 rounded-full border border-border-card">
              Total Flags: {Math.round(151 * rangeMultiplier)}
            </span>
          </div>

          {/* Bars Container */}
          <div className="space-y-4 pt-1">
            {topViolations.map((rule, idx) => {
              const adjustedCount = getAdjustedCount(rule.violations30Days);
              const percentage = Math.min(100, Math.round((adjustedCount / maxAdjustedViolations) * 100));
              const isHovered = hoveredRule?.id === rule.id;

              // Color gradient by severity & category
              const barGradient =
                rule.category === 'Legal Claims'
                  ? 'from-rose-500 to-rose-400 shadow-rose-500/20'
                  : rule.category === 'Tone of Voice'
                  ? 'from-amber-500 to-amber-400 shadow-amber-500/20'
                  : rule.category === 'Visual Identity'
                  ? 'from-teal-500 to-teal-400 shadow-teal-500/20'
                  : 'from-brand-primary to-brand-violet shadow-brand-primary/20';

              return (
                <div
                  key={rule.id}
                  onMouseEnter={() => setHoveredRule(rule)}
                  onMouseLeave={() => setHoveredRule(null)}
                  className="p-3.5 rounded-2xl hover:bg-bg-app transition-all cursor-pointer space-y-2 border border-transparent hover:border-border-card relative group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink-secondary text-[11px] bg-bg-card px-1.5 py-0.5 rounded border border-border-card">
                        {rule.ruleCode}
                      </span>
                      <span className="font-bold text-ink-primary">{rule.ruleName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.span
                        key={adjustedCount}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-black text-ink-primary"
                      >
                        {adjustedCount} violations
                      </motion.span>
                      <span
                        className={`text-[10px] font-bold flex items-center ${
                          rule.trend === 'up' ? 'text-rose-500' : 'text-emerald-500'
                        }`}
                      >
                        {rule.trend === 'up' ? '↑' : '↓'} {rule.trendPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Track & Animated Bar */}
                  <div className="w-full bg-border-card/50 h-3 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r ${barGradient} transition-all`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{
                        delay: idx * 0.06,
                        duration: 0.65,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ink-secondary">
                    <span>
                      Category: <strong className="text-ink-primary font-semibold">{rule.category}</strong>
                    </span>
                    <span>
                      Primary Friction: <strong className="text-ink-primary font-semibold">{rule.primaryDepartment}</strong>
                    </span>
                  </div>

                  {/* Hover Tooltip with Mini SVG Sparkline */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={springTransition}
                        className="absolute left-1/2 -top-16 -translate-x-1/2 z-30 bg-ink-primary text-white text-[11px] px-3.5 py-2.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 pointer-events-none"
                      >
                        <div>
                          <div className="font-black">{rule.ruleName}</div>
                          <div className="text-slate-400 text-[10px]">
                            {adjustedCount} incidents in {timeRange} • {rule.trendPercent}% {rule.trend}
                          </div>
                        </div>

                        {/* Mini Sparkline SVG */}
                        <div className="w-16 h-6 shrink-0 flex items-center">
                          <svg className="w-full h-full" viewBox="0 0 60 20">
                            <polyline
                              points={
                                rule.trend === 'up'
                                  ? '0,18 10,16 20,14 30,15 40,8 50,10 60,3'
                                  : '0,4 10,6 20,12 30,8 40,14 50,12 60,18'
                              }
                              fill="none"
                              stroke={rule.trend === 'up' ? '#F43F5E' : '#10B981'}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Leaderboard (5 Cols) */}
        <div className="lg:col-span-5 frontify-card p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-primary">
                    Departmental Compliance Index
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Real-time cross-enterprise alignment benchmarks
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {departmentMetrics.map((dm) => (
                <div
                  key={dm.department}
                  className="p-3.5 rounded-2xl bg-bg-app border border-border-card space-y-2 hover:border-brand-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${dm.avatarColor}`} />
                      <span className="text-xs font-bold text-ink-primary">
                        {dm.department}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        dm.complianceRate >= 90
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                          : dm.complianceRate >= 80
                          ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/25'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                      }`}
                    >
                      {dm.complianceRate}% Compliance
                    </span>
                  </div>

                  <div className="w-full bg-border-card h-2 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-2 rounded-full ${
                        dm.complianceRate >= 90
                          ? 'bg-emerald-500'
                          : dm.complianceRate >= 80
                          ? 'bg-brand-primary'
                          : 'bg-amber-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${dm.complianceRate}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ink-secondary pt-1">
                    <span>{Math.round(dm.totalAssets * rangeMultiplier)} assets submitted</span>
                    <span className="font-semibold text-ink-primary">
                      {Math.max(1, Math.round(dm.activeViolations * rangeMultiplier))} pending review flags
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
