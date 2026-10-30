'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Stethoscope,
  CheckCircle2,
  Sparkles,
  Zap,
  Activity,
  X,
  Loader2,
  Bot,
  Check,
  ShieldCheck,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileCode,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ProfileCard } from '@/components/ProfileCard';
import { AuthGate } from '@/components/AuthGate';
import { TabType } from '@/types/brandmesh';
import { springTransition } from '@/utils';
import { TOP_VIOLATED_RULES, DEPARTMENT_METRICS } from '@/data/mockData';

interface ToastNotificationState {
  title: string;
  message: string;
  ruleId?: string;
}

export default function InsightsPage() {
  return (
    <AuthGate>
      {({ user, signOut }) => (
        <AuthenticatedInsights user={user} onSignOut={signOut} />
      )}
    </AuthGate>
  );
}

function AuthenticatedInsights({
  user,
  onSignOut,
}: {
  user: any;
  onSignOut: () => Promise<void>;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('insights');

  // 1. Force the use of React state with the exact requested initial structure
  const [metrics, setMetrics] = useState({
    totalAssets: 0,
    trustIndex: 0,
    fixAdoption: 0,
    manualEscalation: 0,
  });

  // Guideline Doctor state
  const [doctorData, setDoctorData] = useState({
    finding: 'Analyzing historical rule overrides to detect ambiguity, excessive rigidity, and missing approved alternatives.',
    current_rule: 'Prohibit all absolute commercial guarantee claims without prior legal team signoff.',
    prescribed_rule: 'Frame value propositions with verified SLA citations: "Commit to high-efficiency reliability backed by Enterprise SLA schedules."',
    risk_level: 'High',
    projected_impact: 'Reduces legal review bottlenecks by 40% and increases copy velocity.',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [hasAcceptedDoctor, setHasAcceptedDoctor] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<ToastNotificationState | null>(null);

  // Synchronize Tab with main page router if needed
  useEffect(() => {
    if (activeTab !== 'insights') {
      router.push(`/?tab=${activeTab}`);
    }
  }, [activeTab, router]);

  // 2. useEffect that fetches from /api/insights and /api/doctor with console.log(data)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const numericDays = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;

    // Fetch KPI metrics from /api/insights
    fetch(`/api/insights?range=${numericDays}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Insights data:', data);
        if (isMounted && data) {
          const raw = data.metrics || data;
          setMetrics({
            totalAssets:
              data.totalAssets ??
              data.totalAssetsAudited ??
              data.total_assets_audited ??
              raw.totalAssetsAudited ??
              raw.total_assets_audited ??
              0,
            trustIndex:
              data.trustIndex ??
              data.trust_index ??
              raw.trustIndex ??
              raw.trust_index ??
              0,
            fixAdoption:
              data.fixAdoption ??
              data.oneClickFixAdoption ??
              data.one_click_fix_adoption ??
              raw.oneClickFixAdoption ??
              raw.one_click_fix_adoption ??
              0,
            manualEscalation:
              data.manualEscalation ??
              data.manualEscalationRate ??
              data.manual_escalation_rate ??
              raw.manualEscalationRate ??
              raw.manual_escalation_rate ??
              0,
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching /api/insights:', err);
      });

    // Fetch Gemini diagnosis from /api/doctor
    fetch('/api/doctor')
      .then((res) => res.json())
      .then((data) => {
        console.log('Doctor data:', data);
        if (isMounted && data && !data.error) {
          setDoctorData({
            finding: data.finding || 'Empirical analysis completed on historical policy friction.',
            current_rule: data.current_rule || 'Current standard rule.',
            prescribed_rule: data.prescribed_rule || 'Prescribed self-healing rewrite.',
            risk_level: data.risk_level || 'Medium',
            projected_impact: data.projected_impact || 'Positive operational impact projected.',
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching /api/doctor:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  // Apply Guideline Doctor Recommendation
  const handleApplyDoctorSuggestion = async () => {
    if (!doctorData.prescribed_rule) return;
    setIsApplying(true);
    try {
      const res = await fetch('/api/doctor/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: '24cac8bc-25e8-430f-9111-45c0491f9aa1',
          new_rule_text: doctorData.prescribed_rule,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply recommendation');

      setHasAcceptedDoctor(true);
      setToastNotification({
        title: 'Guideline Doctor Suggestion Applied',
        message:
          data.message ||
          'Rule updated in brand_guidelines. Version incremented with instant synchronization.',
      });
      setTimeout(() => setToastNotification(null), 5000);
    } catch (err: any) {
      console.error('Failed to apply doctor prescription:', err);
      setToastNotification({
        title: 'Application Notice',
        message: err.message || 'Unable to update rule at this time.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Export Audit Report Handlers
  const exportMenuRef = React.useRef<HTMLDivElement>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportMenuOpen]);

  const handleExportCSV = () => {
    const generatedDate = new Date().toISOString();
    const windowLabel = timeRange === '7d' ? 'Last 7 Days' : timeRange === '90d' ? 'Last 90 Days' : 'Last 30 Days';

    const csvRows: string[] = [];
    csvRows.push('BrandMesh Enterprise AI Brand Governance - Executive Audit Report');
    csvRows.push(`Generated At,${generatedDate}`);
    csvRows.push(`Audit Window,${windowLabel}`);
    csvRows.push('Organization,BrandMesh Enterprise Governance Suite');
    csvRows.push('');

    csvRows.push('--- EXECUTIVE KPI METRICS ---');
    csvRows.push('Metric,Value,Benchmark Target,Status');
    csvRows.push(`Total Assets Audited,${metrics.totalAssets},10+,${metrics.totalAssets >= 10 ? 'Passed' : 'Low Volume'}`);
    csvRows.push(`Overall Brand Trust Index,${metrics.trustIndex}%,90%,${metrics.trustIndex >= 90 ? 'Compliant' : 'Review Required'}`);
    csvRows.push(`1-Click Auto-Fix Adoption,${metrics.fixAdoption}%,80%,${metrics.fixAdoption >= 80 ? 'Exceeded' : 'Under Target'}`);
    csvRows.push(`Manual Escalation Rate,${metrics.manualEscalation}%,< 15%,${metrics.manualEscalation <= 15 ? 'Healthy' : 'Friction Flagged'}`);
    csvRows.push('');

    csvRows.push('--- GUIDELINE DOCTOR DIAGNOSIS ---');
    csvRows.push(`Risk Level,${doctorData.risk_level}`);
    csvRows.push(`Clinical Finding,"${doctorData.finding.replace(/"/g, '""')}"`);
    csvRows.push(`Current Restrictive Rule,"${doctorData.current_rule.replace(/"/g, '""')}"`);
    csvRows.push(`Prescribed Self-Healing Rewrite,"${doctorData.prescribed_rule.replace(/"/g, '""')}"`);
    csvRows.push(`Projected Impact,"${doctorData.projected_impact.replace(/"/g, '""')}"`);
    csvRows.push('');

    csvRows.push('--- DEPARTMENT COMPLIANCE BREAKDOWN ---');
    csvRows.push('Department,Compliance Score,Audited Assets,Status');
    DEPARTMENT_METRICS.forEach((d) => {
      csvRows.push(`"${d.department.replace(/"/g, '""')}",${d.complianceRate}%,${d.totalAssets},${d.activeViolations}`);
    });
    csvRows.push('');

    csvRows.push('--- TOP VIOLATED RULES TELEMETRY ---');
    csvRows.push('Rule Code,Rule Name,Category,Violations (30d),Trend,Primary Department');
    TOP_VIOLATED_RULES.forEach((r) => {
      csvRows.push(`"${r.ruleCode}","${r.ruleName.replace(/"/g, '""')}","${r.category}",${r.violations30Days},${r.trendPercent > 0 ? '+' : ''}${r.trendPercent}%,${r.primaryDepartment}`);
    });

    const csvContent = csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BrandMesh_Audit_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastNotification({
      title: 'Audit Report Exported',
      message: `Downloaded CSV report for ${windowLabel}.`,
    });
  };

  const handleExportJSON = () => {
    const reportData = {
      reportTitle: 'BrandMesh Executive Audit Report',
      exportTimestamp: new Date().toISOString(),
      timeRange,
      kpiMetrics: metrics,
      guidelineDoctorDiagnosis: doctorData,
      departmentCompliance: DEPARTMENT_METRICS,
      topRuleViolations: TOP_VIOLATED_RULES,
    };

    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BrandMesh_Audit_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastNotification({
      title: 'JSON Telemetry Exported',
      message: 'Downloaded raw JSON compliance payload for SIEM/GRC.',
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative transition-colors duration-500 overflow-x-hidden bg-slate-950">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl text-slate-100 flex items-start gap-3 max-w-md"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white">{toastNotification.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {toastNotification.message}
              </p>
            </div>
            <button
              onClick={() => setToastNotification(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/8 to-pink-500/5 blur-[120px]" />
        <div className="absolute top-[35%] -right-[15%] w-[680px] h-[680px] rounded-full bg-gradient-to-bl from-violet-500/10 via-teal-500/8 to-indigo-500/5 blur-[140px]" />
      </div>

      {/* Sticky Enterprise Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={0}
        user={user}
        onSignOut={onSignOut}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14 py-8 space-y-6">
        <div className="mb-6">
          <ProfileCard user={user} onSignOut={onSignOut} />
        </div>

        {/* Dashboard Top Header & Range Switcher */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Executive Governance Telemetry</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Insights & <span className="text-indigo-400">Guideline Doctor</span>
            </h1>
            <p className="text-xs text-slate-400">
              Dynamic compliance metrics, AI friction diagnostics, and self-healing brand guidelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 7d / 30d / 90d Range Toggle */}
            <div className="relative flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold shadow-xs">
              {(['7d', '30d', '90d'] as const).map((r) => {
                const isActive = timeRange === r;
                return (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    disabled={isLoading}
                    className={`relative px-3.5 py-1.5 transition-colors cursor-pointer z-10 ${
                      isActive ? 'text-white font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="range-thumb"
                        transition={springTransition}
                        className="absolute inset-0 bg-slate-800 rounded-xl shadow-xs border border-slate-700"
                      />
                    )}
                    <span className="relative z-10">
                      {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Export Audit Report Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Export Audit Report</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                    isExportMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isExportMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-slate-200 space-y-1 backdrop-blur-md"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
                      Select Export Format
                    </div>

                    <button
                      onClick={() => {
                        handleExportCSV();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>CSV Spreadsheet</span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            .csv
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">Complete metrics & audit logs</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        handleExportJSON();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>JSON Data Payload</span>
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                            .json
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">SIEM & compliance telemetry</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        window.print();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-3 transition-colors cursor-pointer group border-t border-slate-800/80 pt-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>Print / Save as PDF</span>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            .pdf
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">Executive board presentation</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 4 Dynamic KPI Metric Cards - NO HARDCODED VALUES */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 animate-pulse shadow-xs"
              >
                <div className="h-3 w-1/2 bg-slate-800 rounded" />
                <div className="h-8 w-3/4 bg-slate-800 rounded" />
                <div className="h-2.5 w-2/3 bg-slate-800/60 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Assets Audited */}
            <motion.div
              whileHover={{ y: -3, transition: springTransition }}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Assets Audited
                </span>
                <div className="w-2 h-2 rounded-full bg-indigo-500/50 group-hover:scale-125 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tight font-mono">
                  {metrics.totalAssets}
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Unique assets audited across all channels ({timeRange})
              </p>
            </motion.div>

            {/* Metric 2: Overall Trust Index */}
            <motion.div
              whileHover={{ y: -3, transition: springTransition }}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Overall Trust Index
                </span>
                <div className="w-2 h-2 rounded-full bg-emerald-500/50 group-hover:scale-125 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tight font-mono">
                  {metrics.trustIndex}%
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Compliance and brand fidelity score</p>
            </motion.div>

            {/* Metric 3: 1-Click Fix Adoption */}
            <motion.div
              whileHover={{ y: -3, transition: springTransition }}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  1-Click Fix Adoption
                </span>
                <div className="w-2 h-2 rounded-full bg-indigo-500/50 group-hover:scale-125 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tight font-mono">
                  {metrics.fixAdoption}%
                </span>
                <span className="text-xs font-bold text-indigo-400 flex items-center bg-indigo-500/15 px-1.5 py-0.2 rounded-full">
                  <Sparkles className="w-3 h-3 mr-0.5" /> Auto
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Auto-remediation resolution rate</p>
            </motion.div>

            {/* Metric 4: Manual Escalation Rate */}
            <motion.div
              whileHover={{ y: -3, transition: springTransition }}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Manual Escalation Rate
                </span>
                <div className="w-2 h-2 rounded-full bg-rose-500/50 group-hover:scale-125 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tight font-mono">
                  {metrics.manualEscalation}%
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> Monitored
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Legal & brand manager review friction</p>
            </motion.div>
          </div>
        )}

        {/* GUIDELINE DOCTOR: Dark Card with Dynamic doctorData State */}
        <div className="relative rounded-3xl p-[1.5px] overflow-hidden shadow-2xl">
          <div className="conic-border-glow absolute -inset-[200%] opacity-80" />

          <div className="relative z-10 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-[23px] text-slate-200 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5 flex-1">
                {/* Doctor Stethoscope Badge */}
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                  <Stethoscope className="w-7 h-7" />
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/25 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                      <Bot className="w-3 h-3 text-indigo-400" />
                      Guideline Doctor • AI Prescriptive Diagnosis
                    </span>
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      Friction Diagnosis Active
                    </span>
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                      Risk: {doctorData.risk_level}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    High-Friction Policy Diagnosis & Self-Healing Prescription
                  </h2>

                  {/* Gemini Diagnosis State */}
                  {isLoading ? (
                    <div className="space-y-2.5 py-2">
                      <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Gemini is diagnosing historical violations & prescribing rewrite...</span>
                      </div>
                      <div className="h-3 w-full max-w-3xl rounded bg-white/10 animate-pulse" />
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-5xl">
                      <strong className="text-white">Empirical Clinical Finding: </strong>
                      {doctorData.finding}
                    </p>
                  )}
                </div>
              </div>

              {/* Heartbeat Monitor */}
              <div className="shrink-0 flex flex-col items-center lg:items-end justify-center space-y-2">
                <div className="w-48 h-12 relative flex items-center">
                  <svg className="w-full h-full" viewBox="0 0 200 40" fill="none">
                    <path
                      d="M 0,20 L 40,20 L 50,8 L 60,32 L 70,16 L 80,24 L 90,20 L 140,20 L 150,5 L 160,35 L 170,20 L 200,20"
                      stroke="rgba(99, 102, 241, 0.2)"
                      strokeWidth="2"
                      fill="none"
                    />
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

            {/* Before vs After Rule Comparison Box: DYNAMIC DOCTOR DATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4.5 rounded-2xl border border-slate-800">
              {/* Dynamic Current Rule */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Current Restrictive Rule:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-900 p-3 rounded-xl border border-slate-800 break-words">
                  &quot;{doctorData.current_rule}&quot;
                </p>
              </div>

              {/* Dynamic Prescribed Rule */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Prescribed Self-Healing Rule:
                </span>
                <p className="text-xs text-emerald-200 leading-relaxed font-mono bg-slate-900 p-3 rounded-xl border border-emerald-500/30 break-words">
                  &quot;{doctorData.prescribed_rule}&quot;
                </p>
              </div>
            </div>

            {/* Bottom Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong className="text-emerald-400 font-bold">Projected Impact: </strong>
                  {doctorData.projected_impact}
                </span>
              </div>

              {hasAcceptedDoctor ? (
                <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Recommendation Applied to Brand Brain</span>
                </div>
              ) : (
                <button
                  id="accept-doctor-recommendation-btn"
                  onClick={handleApplyDoctorSuggestion}
                  disabled={isApplying || isLoading || !doctorData.prescribed_rule}
                  className="px-6 py-3 rounded-2xl font-black text-xs text-white tracking-wide shadow-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Applying Prescription...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Apply Guideline Doctor Suggestion</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Breakdown Grid: Top Violations & Departments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Violations Chart (7 Cols) */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white">
                  Top Violated Brand Guidelines
                </h3>
                <p className="text-xs text-slate-400">
                  Relative violation volume across organizational marketing units
                </p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                Telemetry Active
              </span>
            </div>

            <div className="space-y-4">
              {TOP_VIOLATED_RULES.map((rule) => (
                <div key={rule.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{rule.ruleName}</span>
                    <span className="font-mono text-slate-400">{rule.violations30Days} flags</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, (rule.violations30Days / 45) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Telemetry (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white">Department Adoption</h3>
                <p className="text-xs text-slate-400">Governance compliance breakdown</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                4 Teams
              </span>
            </div>

            <div className="space-y-3">
              {DEPARTMENT_METRICS.map((dept) => (
                <div
                  key={dept.department}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{dept.department}</h4>
                    <p className="text-[11px] text-slate-400">
                      {dept.totalAssets} assets • {dept.activeViolations} active flags
                    </p>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    {dept.complianceRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Enterprise Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-6 text-slate-400">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">BrandMesh</span>
            <span>• Executive Governance Intelligence & Self-Healing Guidelines</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>SOC2 Type II</span>
            <span>•</span>
            <span>Gemini AI Engine</span>
            <span>•</span>
            <span>Supabase Cloud Synchronized</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
