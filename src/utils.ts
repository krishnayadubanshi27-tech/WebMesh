/**
 * Redacts personally identifiable information (PII) like emails, phone numbers,
 * and credit cards before prompt transmission to local or third-party models.
 */
export function redactPII(text: string): string {
  if (!text) return '';

  // Redact Emails
  let safeText = text.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[REDACTED_EMAIL]'
  );

  // Redact Phone Numbers (e.g. 123-456-7890 or 1234567890)
  safeText = safeText.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');

  // Redact standard 16-digit Credit Card numbers
  safeText = safeText.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[REDACTED_CARD]');

  return safeText;
}

/**
 * Acrolinx & Frontify calibrated score colour grading
 * 0-59 rose, 60-79 amber, 80-89 teal, 90-100 emerald with a soft glow
 */
export interface ScoreGrading {
  color: string;
  hex: string;
  glow: string;
  bgTint: string;
  badgeBorder: string;
  badgeText: string;
  statusLabel: string;
  gradient: string;
}

export function getScoreGrading(score: number): ScoreGrading {
  if (score >= 90) {
    return {
      color: '#10B981', // Emerald
      hex: '#10B981',
      glow: '0 0 24px rgba(16, 185, 129, 0.35)',
      bgTint: 'rgba(16, 185, 129, 0.12)',
      badgeBorder: 'rgba(16, 185, 129, 0.35)',
      badgeText: '#047857',
      statusLabel: 'Fast-Track Eligible',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    };
  }
  if (score >= 80) {
    return {
      color: '#14B8A6', // Teal
      hex: '#14B8A6',
      glow: '0 0 20px rgba(20, 184, 166, 0.28)',
      bgTint: 'rgba(20, 184, 166, 0.12)',
      badgeBorder: 'rgba(20, 184, 166, 0.3)',
      badgeText: '#0F766E',
      statusLabel: 'High Compliance',
      gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
    };
  }
  if (score >= 60) {
    return {
      color: '#F59E0B', // Amber
      hex: '#F59E0B',
      glow: '0 0 16px rgba(245, 158, 11, 0.22)',
      bgTint: 'rgba(245, 158, 11, 0.12)',
      badgeBorder: 'rgba(245, 158, 11, 0.3)',
      badgeText: '#B45309',
      statusLabel: 'Manager Review Required',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    };
  }
  return {
    color: '#F43F5E', // Rose
    hex: '#F43F5E',
    glow: '0 0 18px rgba(244, 63, 94, 0.28)',
    bgTint: 'rgba(244, 63, 94, 0.12)',
    badgeBorder: 'rgba(244, 63, 94, 0.3)',
    badgeText: '#BE123C',
    statusLabel: 'Critical Violations',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
  };
}

/**
 * Standard enterprise physics configuration for Framer Motion
 * Springs: stiffness ~300, damping ~30. No bounce.
 */
export const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

export const smoothEasing = [0.22, 1, 0.36, 1] as const;
