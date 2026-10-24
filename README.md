# BrandMesh: AI Brand Governance Co-Pilot

A bespoke, pixel-perfect, and enterprise-grade SaaS web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**. It strictly incorporates the minimalist design language of **Frontify** and the deep content compliance and auditing intelligence of **Acrolinx**.

---
## 🎨 Design System & Visual Architecture

- **Frontify Minimalist Canvas**: Stark white card surfaces (`#FFFFFF`), subtle off-white backgrounds (`#F8FAFC`), crisp hairline borders (`border-slate-200`), geometric sans typography (Plus Jakarta Sans), and Frontify Cobalt Indigo (`#2A59FE`).
- **Acrolinx Multi-Tier Scorecard**: Calibrated circular SVG gauge with multi-stage color thresholds:
  - 🔴 **Crimson Alert** (`<60%`): Critical deterministic violations & legal exposure
  - 🟡 **Amber Advisory** (`60%–84%`): Needs review or tone realignment
  - 🟢 **Emerald Certified** (`85%–100%`): Enterprise approved & ready for distribution

---

## 🧩 Core Application Modules

### 1. Sticky Enterprise Glass Navbar
- Glassmorphic backdrop (`backdrop-blur-md bg-white/90 border-b border-slate-200/80`).
- Seamless animated tab transitions with Framer Motion `layoutId="active-nav-tab"`.
- **"Confidential Mode" Toggle**: Instantly activates an air-gapped **Ollama / Zero-Retention** security ribbon with glowing green status pulse and zero data egress guarantee.
- User profile avatar for *Elena Vance (Global Brand Director)*.

### 2. Tab 1: Brand Brain (Knowledge Base)
- **Tone & Terminology Card**: Prohibited words in pill tags (`"cheap"`, `"guarantee"`, `"best-in-class"`, `"disruptive"`, `"foolproof"`, `"revolutionary"`) with severity levels, approved alternatives, and an inline **Add Banned Word** drawer.
- **Verified Facts & Claims Card**: Pre-approved factual statements (99.99% SLA uptime, SOC 2 Type II Certified, Zurich Headquarters) with signoff leads and validity periods.
- **Visual Hex Codes Card**: Official Frontify color swatches with 1-click clipboard copy, WCAG contrast ratios, and AAA pass indicators.
- **WCAG Accessibility Card**: Contrast rules (4.5:1 text, 3:1 non-text), alt-text standards, and touch target size mandates (>=44x44px).
- **"Upload Brand PDF" Button**: Interactive modal simulating PDF parsing, vector rule extraction, and live ingestion into the Brand Brain.

### 3. Tab 2: Co-Pilot Studio (Acrolinx-style Audit Workspace)
- **Split-Screen Workspace**:
  - **Left Side**: Rich text editor with presets (*Q3 Launch Press Release*, *Hero Copy*, *Newsletter*). **Simulated live regex highlighting** of banned words as you type with interactive click popovers showing rule explanations and quick replacements. Includes a visual logo clearspace scanner.
  - **Right Side**: Dynamic circular **Brand Trust Score** gauge (0–100%) with animated SVG path, sub-score category breakups (Terminology, Tone, Legal Claims, Clarity), **"Preserve Intent"** toggle group (`Strict` | `Balanced` | `Punchy`), and **"1-Click Apply All Brand Fixes"** with celebration confetti and smooth score animation from 48% to 96%.
  - **"Submit to Approval Hub Pipeline"**: Dispatches audited copy directly into the Kanban board.

### 4. Tab 3: Approval Hub (Kanban Board)
- 3-column submission routing: **Fast-Track Approved** (Score $\ge 90\%$), **Manager Review Queue**, and **Changes Requested**.
- **Before vs After Diff Comparison Snapshot**: Cards in the Manager Review Queue feature side-by-side snapshots with red strikethroughs for deleted terms and bold green tags for approved additions.
- Interactive **Approve** and **Reject** buttons that transition cards smoothly across columns using Framer Motion spring physics.

### 5. Tab 4: Insights & Guideline Doctor
- **30-Day Violation Bar Chart**: Visualizes frequently broken rules (*Rule #LG-02: Unhedged Guarantees*, *Rule #TN-14: Superlatives*, etc.) with interactive hover metrics.
- **Departmental Compliance Leaderboard**: Real-time benchmarks for Corporate Comms, Product Marketing, Demand Gen, and Sales Enablement.
- **"Guideline Doctor" AI Alert Card**: Diagnoses rule fatigue and offers a 1-click **"Accept Guideline Doctor Recommendation"** button that dynamically updates the Brand Brain rule and displays an animated toast.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Micro-Interactions**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
