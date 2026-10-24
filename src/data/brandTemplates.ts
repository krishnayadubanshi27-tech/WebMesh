import { Severity } from '@/types/brandmesh';

export interface TemplateRule {
  word: string;
  category: 'Tone' | 'Legal' | 'Superlative' | 'Jargon';
  severity: Severity;
  reason: string;
  approvedAlternatives: string[];
}

export interface BrandTemplate {
  id: string;
  name: string;
  badge: string;
  description: string;
  iconName: string;
  rules: TemplateRule[];
}

export const BRAND_TEMPLATES: BrandTemplate[] = [
  {
    id: 'inclusivity',
    name: 'Inclusivity & Modern Workplace',
    badge: 'DE&I Standards',
    description: 'Eliminates archaic, biased, or exclusionary phrasing in favor of universally welcoming enterprise language.',
    iconName: 'Users',
    rules: [
      {
        word: 'mankind',
        category: 'Tone',
        severity: 'warning',
        reason: 'Gender-exclusive language. Use gender-neutral terminology.',
        approvedAlternatives: ['humanity', 'people', 'humankind'],
      },
      {
        word: 'manpower',
        category: 'Tone',
        severity: 'warning',
        reason: 'Gender-coded staffing terminology.',
        approvedAlternatives: ['workforce', 'personnel', 'team capacity', 'staffing'],
      },
      {
        word: 'master/slave',
        category: 'Jargon',
        severity: 'critical',
        reason: 'Problematic technical architecture metaphor.',
        approvedAlternatives: ['primary/replica', 'leader/follower', 'host/worker'],
      },
      {
        word: 'blacklist/whitelist',
        category: 'Jargon',
        severity: 'critical',
        reason: 'Outdated color-metaphor cybersecurity terms.',
        approvedAlternatives: ['blocklist/allowlist', 'denylist/permitlist'],
      },
      {
        word: 'guys',
        category: 'Tone',
        severity: 'discouraged',
        reason: 'Informal gendered greeting.',
        approvedAlternatives: ['everyone', 'team', 'colleagues', 'folks'],
      },
    ],
  },
  {
    id: 'legal-finance',
    name: 'Legal & Financial Compliance',
    badge: 'SEC & FTC Protocols',
    description: 'Prevents legally binding false promises, overpromising SLAs, and unregulated financial claims.',
    iconName: 'Scale',
    rules: [
      {
        word: 'guarantee',
        category: 'Legal',
        severity: 'critical',
        reason: 'Creates unconditional warranty obligations without contract disclaimer.',
        approvedAlternatives: ['commit to', 'back with our SLA', 'deliver verified reliability'],
      },
      {
        word: 'promise',
        category: 'Legal',
        severity: 'critical',
        reason: 'Informal promise language that can imply strict liability.',
        approvedAlternatives: ['aim to deliver', 'target', 'dedicate resources to'],
      },
      {
        word: '100% risk-free',
        category: 'Legal',
        severity: 'critical',
        reason: 'Unsubstantiated consumer protection violation according to FTC guidelines.',
        approvedAlternatives: ['backed by standard satisfaction terms', 'structured pilot program'],
      },
      {
        word: 'foolproof',
        category: 'Legal',
        severity: 'warning',
        reason: 'Misrepresents system resilience against user error or failure.',
        approvedAlternatives: ['intuitive and streamlined', 'resilient', 'fail-safe guided'],
      },
      {
        word: 'unconditional refund',
        category: 'Legal',
        severity: 'warning',
        reason: 'Conflicts with standard SaaS enterprise master service agreements.',
        approvedAlternatives: ['standard 30-day agreement terms', 'pro-rated credit'],
      },
    ],
  },
  {
    id: 'premium-luxury',
    name: 'Premium & Luxury Brand Positioning',
    badge: 'High-End Positioning',
    description: 'Guards brand prestige by banning commodity, bargain, and discount terminology.',
    iconName: 'Sparkles',
    rules: [
      {
        word: 'cheap',
        category: 'Tone',
        severity: 'critical',
        reason: 'Devalues brand craftsmanship and conveys poor material quality.',
        approvedAlternatives: ['accessible', 'cost-effective', 'exceptional value'],
      },
      {
        word: 'bargain',
        category: 'Tone',
        severity: 'warning',
        reason: 'Erodes premium market positioning and price integrity.',
        approvedAlternatives: ['compelling value', 'strategic investment', 'favorable terms'],
      },
      {
        word: 'discount',
        category: 'Tone',
        severity: 'warning',
        reason: 'Substitutes value creation with price slashing.',
        approvedAlternatives: ['preferred client pricing', 'exclusive tier pricing', 'introductory rate'],
      },
      {
        word: 'hack',
        category: 'Jargon',
        severity: 'warning',
        reason: 'Implies shortcuts, unvetted workarounds, and lack of rigor.',
        approvedAlternatives: ['strategy', 'methodology', 'framework', 'optimization'],
      },
      {
        word: 'budget-friendly',
        category: 'Tone',
        severity: 'discouraged',
        reason: 'Frames product as an inferior low-tier compromise.',
        approvedAlternatives: ['high capital efficiency', 'maximized ROI', 'streamlined deployment'],
      },
    ],
  },
];
