/**
 * Maps internal risk level values to display labels.
 * LOW → SAFE, SUSPICIOUS → SUSPICIOUS, HIGH → CRITICAL
 * Does NOT change any scoring logic — display only.
 */

const RISK_DISPLAY_MAP: Record<string, string> = {
  low: 'SAFE',
  LOW: 'SAFE',
  suspicious: 'SUSPICIOUS',
  SUSPICIOUS: 'SUSPICIOUS',
  MEDIUM: 'SUSPICIOUS',
  high: 'CRITICAL',
  HIGH: 'CRITICAL',
};

export function displayRiskLabel(riskLevel: string): string {
  return RISK_DISPLAY_MAP[riskLevel] || riskLevel.toUpperCase();
}

/** Color classes keyed by display label */
export const riskDisplayColors: Record<string, string> = {
  SAFE: 'bg-green-100 text-green-700',
  SUSPICIOUS: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

/** Get color class for any raw risk level */
export function getRiskColorClass(riskLevel: string): string {
  const label = displayRiskLabel(riskLevel);
  return riskDisplayColors[label] || 'bg-green-100 text-green-700';
}
