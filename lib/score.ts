export type ScoreColor = 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export interface ScoreInfo {
  color: ScoreColor;
  label: string;
  hex: string;
  gradient: string;
  range: string;
  min: number;
  max: number;
  description: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  glowStyle: string;
}

export function getScoreInfo(score: number): ScoreInfo {
  if (score < 300) {
    return {
      color: 'orange',
      label: 'Orange',
      hex: '#f97316',
      gradient: 'from-orange-600 to-amber-500',
      range: '100–299',
      min: 100,
      max: 299,
      description: 'Lower ranges of bioactive antioxidants in the body',
      bgClass: 'bg-orange-500/10',
      textClass: 'text-orange-400',
      borderClass: 'border-orange-500/30',
      glowStyle: '0 0 40px rgba(249,115,22,0.4)',
    };
  } else if (score < 400) {
    return {
      color: 'yellow',
      label: 'Yellow',
      hex: '#eab308',
      gradient: 'from-yellow-500 to-amber-400',
      range: '300–399',
      min: 300,
      max: 399,
      description: 'Moderate ranges of bioactive antioxidants in the body',
      bgClass: 'bg-yellow-500/10',
      textClass: 'text-yellow-400',
      borderClass: 'border-yellow-500/30',
      glowStyle: '0 0 40px rgba(234,179,8,0.4)',
    };
  } else if (score < 550) {
    return {
      color: 'green',
      label: 'Green',
      hex: '#22c55e',
      gradient: 'from-green-500 to-emerald-400',
      range: '400–549',
      min: 400,
      max: 549,
      description: 'Moderate ranges of bioactive antioxidants in the body',
      bgClass: 'bg-green-500/10',
      textClass: 'text-green-400',
      borderClass: 'border-green-500/30',
      glowStyle: '0 0 40px rgba(34,197,94,0.4)',
    };
  } else if (score < 750) {
    return {
      color: 'blue',
      label: 'Blue',
      hex: '#38bdf8',
      gradient: 'from-blue-500 to-cyan-400',
      range: '550–749',
      min: 550,
      max: 749,
      description: 'Higher ranges of bioactive antioxidants in the body',
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-500/30',
      glowStyle: '0 0 40px rgba(56,189,248,0.4)',
    };
  } else {
    return {
      color: 'purple',
      label: 'Purple',
      hex: '#a855f7',
      gradient: 'from-purple-500 to-violet-400',
      range: '750–1000',
      min: 750,
      max: 1000,
      description: 'Higher ranges of bioactive antioxidants in the body',
      bgClass: 'bg-purple-500/10',
      textClass: 'text-purple-400',
      borderClass: 'border-purple-500/30',
      glowStyle: '0 0 40px rgba(168,85,247,0.4)',
    };
  }
}

export function getScoreAngle(score: number): number {
  // Map score 100-1000 to angle -140deg to 140deg
  const clampedScore = Math.max(100, Math.min(1000, score));
  const normalized = (clampedScore - 100) / (1000 - 100);
  return -140 + normalized * 280;
}

export function getProgressPercent(score: number): number {
  return Math.max(0, Math.min(100, ((score - 100) / 900) * 100));
}
