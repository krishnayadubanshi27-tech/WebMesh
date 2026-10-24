'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getScoreGrading } from '@/utils';

interface CircularGaugeProps {
  score: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  showSubScores?: boolean;
  subScores?: {
    terminology: number;
    tone: number;
    claims: number;
    accessibility: number;
  };
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  score,
  size = 190,
  strokeWidth = 14,
  showSubScores = true,
  subScores = {
    terminology: score >= 90 ? 98 : 45,
    tone: score >= 90 ? 94 : 62,
    claims: score >= 90 ? 96 : 58,
    accessibility: 98,
  },
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const grading = getScoreGrading(score);

  // Target threshold tick at 90%
  const targetAngle = (90 / 100) * 360 - 90; // in degrees, rotated to start from top
  const targetRad = (targetAngle * Math.PI) / 180;
  const targetX1 = size / 2 + (radius - strokeWidth / 2 - 2) * Math.cos(targetRad);
  const targetY1 = size / 2 + (radius - strokeWidth / 2 - 2) * Math.sin(targetRad);
  const targetX2 = size / 2 + (radius + strokeWidth / 2 + 3) * Math.cos(targetRad);
  const targetY2 = size / 2 + (radius + strokeWidth / 2 + 3) * Math.sin(targetRad);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Main Acrolinx Ring */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            <linearGradient id="scoreRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="50%" stopColor={grading.color} />
              <stop offset="100%" stopColor={grading.color} />
            </linearGradient>
            <filter id="scoreGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track with Subtle Ticks */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Background Tick Marks (Every 15 degrees) */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const innerR = radius - strokeWidth / 2 - 4;
            const outerR = radius - strokeWidth / 2 - 1;
            const x1 = +(size / 2 + innerR * Math.cos(angle)).toFixed(2);
            const y1 = +(size / 2 + innerR * Math.sin(angle)).toFixed(2);
            const x2 = +(size / 2 + outerR * Math.cos(angle)).toFixed(2);
            const y2 = +(size / 2 + outerR * Math.sin(angle)).toFixed(2);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth={1}
              />
            );
          })}

          {/* Target 90 Marker Line */}
          <line
            x1={+targetX1.toFixed(2)}
            y1={+targetY1.toFixed(2)}
            x2={+targetX2.toFixed(2)}
            y2={+targetY2.toFixed(2)}
            stroke="#10B981"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Animated Main Progress Ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#scoreRingGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: 1.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            strokeLinecap="round"
            className="-rotate-90 origin-center"
            style={{
              filter: score >= 90 ? 'url(#scoreGlow)' : undefined,
            }}
          />
        </svg>

        {/* Center Score Display with Count-Up Number & Target Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div
            key={score}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex items-baseline"
          >
            <span
              className="text-5xl font-black tracking-tighter"
              style={{ color: grading.color, textShadow: grading.glow }}
            >
              {score}
            </span>
            <span className="text-xl font-bold text-white/85 ml-1">%</span>
          </motion.div>

          <span className="text-xs font-black tracking-wider uppercase text-white/95 mt-1">
            Brand Trust Score
          </span>

          <span className="text-[9px] font-semibold text-emerald-400/90 mt-0.5">
            Target: 90+ (Fast-Track)
          </span>
        </div>
      </div>

      {/* Status Chip */}
      <motion.div
        key={`status-${score}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide"
        style={{
          backgroundColor: grading.bgTint,
          color: grading.color,
          border: `1px solid ${grading.badgeBorder}`,
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: grading.color,
            boxShadow: `0 0 8px ${grading.color}`,
          }}
        />
        <span>{grading.statusLabel}</span>
      </motion.div>

      {/* Acrolinx 4 Sub-Score Rings (Terminology, Tone, Claims, Accessibility) */}
      {showSubScores && (
        <div className="grid grid-cols-4 gap-2 w-full mt-6 pt-5 border-t border-white/10">
          {[
            { label: 'Terminology', score: subScores.terminology, color: subScores.terminology >= 90 ? '#10B981' : '#F43F5E' },
            { label: 'Tone', score: subScores.tone, color: subScores.tone >= 85 ? '#10B981' : '#F59E0B' },
            { label: 'Claims', score: subScores.claims, color: subScores.claims >= 90 ? '#10B981' : '#F59E0B' },
            { label: 'WCAG', score: subScores.accessibility, color: '#10B981' },
          ].map((sub, i) => {
            const subRadius = 16;
            const subCircum = 2 * Math.PI * subRadius;
            const subOffset = subCircum - (sub.score / 100) * subCircum;

            return (
              <div key={i} className="flex flex-col items-center text-center space-y-1">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="w-10 h-10 -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r={subRadius}
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="3"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="20"
                      cy="20"
                      r={subRadius}
                      stroke={sub.color}
                      strokeWidth="3"
                      strokeDasharray={subCircum}
                      initial={{ strokeDashoffset: subCircum }}
                      animate={{ strokeDashoffset: subOffset }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-black text-white">
                    {sub.score}%
                  </span>
                </div>
                <span className="text-[10px] font-bold text-white/90 leading-tight">
                  {sub.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
