export type TabType = 'brain' | 'studio' | 'approvals' | 'insights';

export type Severity = 'critical' | 'warning' | 'discouraged' | 'suggestion';

export interface BannedTerm {
  id: string;
  term: string;
  severity: Severity;
  category: 'Tone' | 'Jargon' | 'Legal' | 'Superlative';
  reason: string;
  approvedAlternatives: string[];
  pattern: RegExp;
}

export interface VerifiedFact {
  id: string;
  claim: string;
  source: string;
  verifiedBy: string;
  verifiedDate: string;
  validUntil: string;
  status: 'active' | 'expiring-soon' | 'under-review';
  category: 'Infrastructure' | 'Compliance' | 'Corporate' | 'Metrics';
}

export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  role: string;
  contrastOnWhite: string;
  contrastOnDark: string;
  passAAA: boolean;
  category: 'Brand Primary' | 'Neutral Slate' | 'Status Accents';
}

export interface A11yRule {
  id: string;
  code: string;
  title: string;
  requirement: string;
  ratioOrSize: string;
  level: 'WCAG AA' | 'WCAG AAA';
  status: 'enforced' | 'advisory';
}

export interface Violation {
  id: string;
  ruleCode: string;
  ruleName: string;
  type: 'deterministic' | 'ai';
  severity: Severity;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  explanation: string;
  suggestedFix: string;
  category: 'Terminology' | 'Tone' | 'Legal' | 'Clarity';
}

export type IntentPreset = 'strict' | 'balanced' | 'punchy';

export interface StudioPreset {
  id: string;
  title: string;
  badge: string;
  content: string;
  description: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  assetType: 'Press Release' | 'Landing Page' | 'Email Campaign' | 'Sales Deck' | 'Product Announcement' | 'Executive Comms';
  department: 'Product Marketing' | 'Demand Gen' | 'Sales Enablement' | 'Executive Comms';
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  timestamp: string;
  score: number;
  status: 'fast-track' | 'review' | 'changes';
  beforeText: string;
  afterText: string;
  diffSummary: {
    removed: string[];
    added: string[];
  };
  criticalViolations: number;
  notes?: string;
}

export interface RuleInsight {
  id: string;
  ruleCode: string;
  ruleName: string;
  category: 'Terminology' | 'Legal Claims' | 'Tone of Voice' | 'Visual Identity';
  violations30Days: number;
  trend: 'up' | 'down' | 'neutral';
  trendPercent: number;
  primaryDepartment: string;
}

export interface DepartmentMetric {
  department: string;
  complianceRate: number;
  totalAssets: number;
  activeViolations: number;
  avatarColor: string;
}
