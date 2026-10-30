# BrandMesh: AI Brand Governance Co-Pilot

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase)](https://supabase.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-v14-FF0055?logo=framer)](https://www.framer.com/motion/)

**BrandMesh** is an enterprise-grade AI Brand Governance and Compliance Co-Pilot. It combines real-time deterministic styleguide enforcement, AI-powered tone realignment (via Google Gemini and air-gapped local Ollama models), a multi-stage approval Kanban pipeline, and automated rule diagnostics into a unified SaaS experience.

---

## 🎨 Visual Architecture & Design System

- **Frontify Minimalist Light Surfaces**: Crisp white cards (`bg-white`), hairline slate borders (`border-slate-200`), subtle elevation (`shadow-xl`, `shadow-md`), and rainbow accent top gradients (`from-indigo-500 via-violet-500 to-pink-500`).
- **High-Contrast Inspection Panels**: Accessible dark/light hybrid widgets for side-by-side diff matrix analysis, negative/positive token highlighting (`-removed` / `+added`), and reviewer feedback directives.
- **Acrolinx-Calibrated Scorecard**: Circular SVG Trust Score gauge with real-time threshold scoring:
  - 🔴 **Crimson Alert (`<60%`)**: Critical deterministic violations, unhedged claims, or legal exposure.
  - 🟡 **Amber Advisory (`60%–84%`)**: Requires human sign-off, claim hedging, or tone realignment.
  - 🟢 **Emerald Certified (`85%–100%`)**: Fast-track clearance ready for multi-channel distribution.

---

## 🧩 Core Application Modules

### 1. Sticky Enterprise Glass Navbar
- Glassmorphic backdrop (`backdrop-blur-md bg-white/90 border-b border-slate-200/80`).
- Seamless tab routing across all 4 pillars using Framer Motion `layoutId="active-nav-tab"`.
- **"Confidential Mode" Toggle**: Instantly routes all auditing through an air-gapped **Ollama / Zero-Retention** pipeline with glowing green status pulse and zero external data egress.
- User profile preview with active presence indicator and quick session management.

### 2. User Profile Banner & Auth Session Management
- **Authenticated Workspace Hero**: Personalized time-of-day greeting, verified email credentials, and Google OAuth provider chip.
- **Session Telemetry**: Last login timestamp, monospace user ID with 1-click clipboard copy, and direct navigation to `/account`.
- **Integrated Supabase Auth**: Full support for Magic Link, Email/Password, and Google OAuth authentication flows.

### 3. Tab 1: Brand Brain (Knowledge Base)
- **Central Governance Architecture**: Search across all 4 pillars with instant query filtering and 1-click refresh from Supabase:
  - **Tone & Terminology**: Prohibited phrases (`"cheap"`, `"guarantee"`, `"best-in-class"`, `"disruptive"`), severity classification, and approved enterprise alternatives with an inline **Add Banned Word** modal.
  - **Verified Facts & Claims**: Pre-vetted factual statements (SLA 99.99% uptime, SOC 2 Type II compliance, Zurich headquarters) with designated owners and validity periods.
  - **Visual Hex Specifications**: Official color swatches with 1-click hex code copying, WCAG contrast ratios, and AAA pass badges.
  - **WCAG Accessibility Rules**: Contrast thresholds (4.5:1 body, 3:1 graphical), alt-text standards, and touch target minimums ($\ge 44 \times 44\text{px}$).
- **"Upload Brand PDF" Ingestion**: Ingest and parse official styleguide PDFs, extracting rules automatically into the database.

### 4. Tab 2: Co-Pilot Studio (Audit & Remediation Workspace)
- **Split-Screen Studio**:
  - **Left Canvas**: Real-time rich text editor pre-loaded with sample copy (*Q3 Launch Press Release*, *Hero Headline*, *Sales Deck*). Highlights violations with interactive popovers showing exact rule rationales and quick-apply fixes. Includes a visual logo clearspace scanner.
  - **Right Gauge & Controls**: Live circular **Brand Trust Score** gauge (0–100%), violation breakdown by pillar (Terminology, Tone, Legal Claims, Clarity), and **"Preserve Intent"** mode switcher (`Strict` | `Balanced` | `Punchy`).
- **"1-Click Apply All Brand Fixes"**: Automatically transforms text, triggers a celebratory confetti burst (`canvas-confetti`), and animates score elevation from 48% to 96%.
- **Route to Approval Hub**: Submits audited copy directly into the multi-stage Kanban pipeline with score-based routing.

### 5. Tab 3: Approval Hub (Multi-Stage Kanban Pipeline)
- **Smart Routing Engine**:
  - Assets with score $\ge 90\%$ automatically bypass review queues into **Fast-Track Approved**.
  - Assets with score $< 90\%$ route directly to the **Manager Review Queue**.
- **Interactive Inspection View**:
  - Sliding thumb segmented toggle: **Diff Matrix**, **Before (Original Copy)**, and **After (Proposed Copy)**.
  - Red strikethrough tags (`-disruptive`, `-cheap`) and green addition tags (`+transformative`, `+cost-effective`).
- **Reviewer Action Directives**:
  - High-contrast **Approve** (with check burst animation) and **Reject** buttons.
  - **Rejection Modal**: Select pre-canned policy reasons (non-compliant superlatives, missing legal citations, WCAG contrast failures) with custom reviewer directives.
  - Returned cards land in **Changes Requested** with feedback notes and a 1-click **Re-open for Manager Review** button.
- **Draggable Cards**: Drag cards horizontally across columns using smooth Framer Motion spring physics.

### 6. Tab 4: Insights & Guideline Doctor
- **30-Day Violation Distribution**: Bar chart tracking frequently broken rules (*Rule #LG-02: Unhedged Guarantees*, *Rule #TN-14: Superlatives*, etc.) with interactive hover tooltips.
- **Departmental Compliance Leaderboard**: Real-time compliance benchmarks for Corporate Comms, Product Marketing, Demand Gen, and Sales Enablement.
- **"Guideline Doctor" AI Assistant**: Identifies rule fatigue and provides a 1-click **"Accept Guideline Doctor Recommendation"** button that dynamically relaxes over-restrictive policies and notifies the user via toast.
- **Multi-Format Export Audit Report**:
  - 📊 **Spreadsheet (.CSV)**: Generates and downloads formatted compliance metrics and violation summaries.
  - ⚡ **Telemetry (.JSON)**: Dumps raw audit event logs and departmental scoring data.
  - 🖨️ **Print / Save as PDF**: Clean print preview with custom `@media print` rules hiding navigation chrome.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with bespoke CSS custom properties |
| **Animations & Physics** | [Framer Motion 14](https://www.framer.com/motion/) |
| **Icons & Effects** | [Lucide React](https://lucide.dev/), [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime) |
| **AI / LLM Providers** | Google Gemini 2.5 Flash (`@google/generative-ai`), Local Ollama (`qwen2.5` / `llama3.2`) |
| **Document Processing** | `pdf-parse`, `multer` |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.18.0` or higher (Node 20+ recommended)
- **Package Manager**: `npm` or `pnpm`
- **Supabase Account**: (Optional for local testing; default mock fallback active)
- **Google Gemini API Key**: (Optional for cloud AI features)
- **Ollama**: (Optional for zero-egress confidential mode; runs on `http://127.0.0.1:11434`)

### 2. Environment Variables Setup
Create a `.env.local` file in the root directory:

```bash
# Google Gemini API Key (for Cloud AI Copilot)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Credentials (for Auth & Live Database Sync)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

# Optional: Local Ollama Endpoint for Confidential Mode
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

### 3. Installation
```bash
# Clone the repository
git clone https://github.com/krishnayadubanshi27-tech/WebMesh.git

# Navigate into the project directory
cd WebMesh

# Install dependencies
npm install
```

### 4. Running the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience BrandMesh.

### 5. Seeding Database Records (Optional)
To seed initial banned terms, facts, and rules into your connected Supabase database:
```bash
npm run seed
```

---

## 📂 Project Structure

```
WebMesh/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── audit-text/route.ts        # Primary text auditing endpoint
│   │   │   ├── doctor/route.ts            # Guideline Doctor recommendation API
│   │   │   ├── gemini-endpoint/route.ts   # Google Gemini API connector
│   │   │   ├── insights/route.ts          # Departmental metrics & top violations API
│   │   │   └── ollama-endpoint/route.ts   # Air-gapped local Ollama API
│   │   ├── account/page.tsx               # User account settings page
│   │   ├── login/page.tsx                 # Supabase authentication login
│   │   ├── signup/page.tsx                # New user registration
│   │   ├── globals.css                    # Tailwind CSS v4 design tokens & print styles
│   │   ├── layout.tsx                     # Root layout & font definition
│   │   └── page.tsx                       # Main authenticated co-pilot workspace
│   ├── components/
│   │   ├── ApprovalHubTab.tsx             # Multi-stage Kanban pipeline & diff viewer
│   │   ├── AuditorUI.tsx                  # Split-screen text auditor & score gauge
│   │   ├── AuthGate.tsx                   # Authentication wrapper & session guard
│   │   ├── BrandBrainTab.tsx              # 4 Governance Pillars & PDF uploader
│   │   ├── InsightsTab.tsx                # Violation analytics, leaderboard & PDF export
│   │   ├── Navbar.tsx                     # Glassmorphic header & confidential toggle
│   │   ├── ProfileCard.tsx                # User identity, telemetry & signout banner
│   │   └── StudioTab.tsx                  # Co-Pilot Studio preset selector & canvas
│   ├── data/
│   │   └── mockData.ts                    # Fallback rules, banned words, metrics & facts
│   ├── types/
│   │   └── brandmesh.ts                   # Core TypeScript interfaces & schemas
│   ├── lib/
│   │   └── supabaseClient.ts              # Supabase browser & server clients
│   └── llmService.ts                      # Multi-provider LLM orchestration engine
├── scripts/
│   └── seedData.ts                        # Supabase database seeder
├── mock_audit_events.csv                  # 100-row sample dataset with UUIDs for Supabase
├── package.json                           # Dependencies & project scripts
├── tsconfig.json                          # TypeScript configuration
└── README.md                              # Project documentation
```

---

## 🔒 Security & Compliance

- **Zero Data Egress Mode**: When **Confidential Mode** is active, external cloud API calls are completely suspended. Text remediation is processed locally via Ollama (`qwen2.5` / `llama3.2`) with zero disk logging or prompt caching.
- **Strict UUID Schema Validation**: Database models and audit tables enforce RFC 4122 v4 UUID keys across foreign relations.
- **Fine-Grained Role Access**: Integration with Supabase Row Level Security (RLS) ensures brand guidelines can only be modified by authorized brand managers.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
