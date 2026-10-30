🌌 BrandMesh
Enterprise AI Brand Governance & Self-Healing Compliance Suite
BrandMesh is an enterprise-grade AI platform designed to eliminate brand compliance friction for marketing and legal teams. It acts as a real-time governance co-pilot that not only flags unprofessional or non-compliant language but also actively rewrites and "self-heals" outdated company policies.
Built for the most secure enterprise environments, BrandMesh features a Hybrid AI Architecture. It routes complex analytics to the Google Gemini cloud API while offering a 100% offline, air-gapped local mode via Transformers.js for strictly confidential, zero-data-egress document auditing.

✨ Key Features
📝 1. Real-Time Compliance Co-Pilot Studio
Intent-Preserving AI Rewrites: The studio highlights disruptive or non-compliant words (e.g., "revolutionary", "cheap") and offers a "1-Click Apply Compliant Fix" that rewrites the text while preserving the author's original intent.
Brand Trust Scorecard: Dynamically calculates an overall Trust Score (e.g., 38% vs Target 90+) based on terminology, tone, and claims.
Hybrid AI Engine Toggle: Users can instantly switch between "Cloud (Gemini)" for deep analysis and "Vault Air-Gapped" local mode for highly classified offline scanning.
🚥 2. Multi-Stage Approval Hub
Kanban Workflow Routing: A dynamic, drag-and-drop Kanban board that routes submissions based on their Trust Score.
Automated Triage: Documents automatically map to "Fast-Track Approved" (Score ≥ 90%), "Manager Review Queue", or "Changes Requested" columns.
🩺 3. Insights & Guideline Doctor
Empirical Compliance Telemetry: A high-level dashboard displaying real-time KPIs including Total Assets Audited, Overall Trust Index, 1-Click Fix Adoption, and Manual Escalation Rate.
AI Prescriptive Diagnosis: The "Guideline Doctor" automatically identifies the company's highest-friction rules (e.g., policies violated 13+ times) and explains exactly why human employees are struggling with them.
Self-Healing Guidelines: The system uses Gemini to prescribe a new, constructive rule (in strict JSON format) and allows administrators to apply the fix globally with one click.

🛠️ Technical Architecture
Frontend: Next.js (React) styled with Tailwind CSS, strictly enforcing a unified enterprise dark-mode aesthetic.
Backend API: Next.js Serverless API routes (/api/insights, /api/doctor) acting as a secure middleman.
Database: Supabase (PostgreSQL) relational database for managing audit events, rule versioning, and Kanban state.
Cloud AI: Google Gemini API for complex rule-friction math, diagnostic reasoning, and strict JSON policy generation.
Local AI (Air-Gapped): Transformers.js (toxic-bert) running inside a browser Web Worker, providing zero-latency, 100% offline text auditing directly on the client's GPU.

🚧 Challenges We Overcame
During development, we solved several critical engineering challenges to achieve enterprise-grade stability:
Asynchronous State Management: Architected a seamless data flow between Next.js server components and the local Transformers.js Web Worker to ensure the UI did not freeze during local WebGPU inference.
Strict Database Typing: Resolved strict PostgreSQL 22P02 UUID typing errors during data seeding by enforcing valid v4 UUID generation for all mock CSV audit events.
Security & Fetch Policies: Overcame Supabase Row Level Security (RLS) policies that were blocking frontend API fetch() calls, ensuring the Insights dashboard dynamically calculated metrics instead of returning '0' values.
CSS State Hydration: Patched dynamic rendering bugs where Tailwind components (like the Approval Hub Kanban cards) defaulted to light-mode backgrounds (bg-white) during AI state changes, ensuring strict dark-theme continuity (bg-slate-900).

🚀 Product Roadmap
BrandMesh is targeted at Fortune 500 compliance teams. Our next development phases include:
Multi-Modal Asset Scanning: Expanding beyond text to audit images and PDFs using Gemini Pro Vision to detect outdated logos and visual brand violations.
Strict Role-Based Access Control (RBAC): Implementing Supabase RLS and JWT authentication to restrict the Insights dashboard to Legal Managers while giving Junior Copywriters access only to the Co-Pilot Studio.
Enterprise Integration Ecosystem: Building webhooks for Slack and Jira so assets flagged in the Approval Hub automatically notify creators in their native workspaces.

