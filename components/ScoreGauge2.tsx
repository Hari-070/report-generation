'use client';
import { ScoreInfo } from '@/lib/score';
import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number;
  scoreInfo: ScoreInfo;
  size?: number;
}

export default function ScoreGauge({ score, scoreInfo, size = 220 }: ScoreGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.37;
  const strokeWidth = size * 0.018;
  const dotStrokeWidth = size * 0.028;

  // 6 equal visual segments, 400 at top center
  // Arc: -130deg to +130deg from top (260deg total)
  // Each segment = 260/6 = 43.33deg
  const SEG = 260 / 5;
  const START = -156; // degrees from top

  const segments = [
    { color: '#ef4444', from: 0, to: 1 }, // red   100-200
    { color: '#f97316', from: 1, to: 2 }, // orange 200-300
    { color: '#eab308', from: 2, to: 3 }, // yellow 300-400
    { color: '#22c55e', from: 3, to: 4 }, // green  400-550
    { color: '#38bdf8', from: 4, to: 5 }, // blue   550-750
    { color: '#a855f7', from: 5, to: 6 }, // purple 750-1000
  ];

  const scoreRanges = [100, 200, 300, 400, 550, 750, 1000];

  // Convert score to visual angle (degrees from top, clockwise)
  const scoreToVisualAngle = (s: number): number => {
    const clamped = Math.max(100, Math.min(1000, s));
    // Find which segment it's in
    for (let i = 0; i < 6; i++) {
      if (clamped <= scoreRanges[i + 1]) {
        const t = (clamped - scoreRanges[i]) / (scoreRanges[i + 1] - scoreRanges[i]);
        return START + (i + t) * SEG;
      }
    }
    return START + 6 * SEG;
  };

  const polarToCart = (angleFromTop: number, r: number) => {
    const rad = ((angleFromTop - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (startAngle: number, endAngle: number, r: number) => {
    const s = polarToCart(startAngle, r);
    const e = polarToCart(endAngle, r);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  const indicatorAngle = scoreToVisualAngle(score);
  const indicatorPos = polarToCart(indicatorAngle, radius);

  // Scale labels at each boundary
  const labels = scoreRanges.map((s, i) => {
    const angle = START + i * SEG;
    const pos = polarToCart(angle, radius * 1.28);
    return { label: s.toString(), ...pos };
  });

  // Decorative smooth background rings
  const bgRings = [0.22, 0.27, 0.32, 0.37].map(f => ({
    r: size * f,
    opacity: 0.055 - f * 0.04,
  }));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Dark background */}
        <circle cx={cx} cy={cy} r={size * 0.48} fill="#0d1424" />

        {/* Smooth incomplete arc rings */}
        {bgRings.map((ring, i) => (
          <path
            key={i}
            d={arcPath(-150, 150, ring.r)}
            fill="none"
            stroke={`rgba(255,255,255,${(0.05 - i * 0.012).toFixed(3)})`}
            strokeWidth={size * 0.022}
            strokeLinecap="round"
          />
        ))}

        {/* Colored segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={arcPath(START + seg.from * SEG, START + seg.to * SEG, radius)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap={i === 0 || i === 5 ? 'round' : 'butt'}
            opacity={0.92}
          />
        ))}

        {/* Indicator glow */}
        <circle
          cx={indicatorPos.x}
          cy={indicatorPos.y}
          r={dotStrokeWidth * 1.5}
          fill={scoreInfo.hex}
          opacity={0.28}
        />
        {/* Indicator dot */}
        <circle
          cx={indicatorPos.x}
          cy={indicatorPos.y}
          r={dotStrokeWidth * 0.95}
          fill={scoreInfo.hex}
        />
        {/* White center */}
        <circle
          cx={indicatorPos.x}
          cy={indicatorPos.y}
          r={dotStrokeWidth * 0.4}
          fill="white"
          opacity={0.9}
        />
      </svg>

      {/* Score number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-display font-bold leading-none"
          style={{ fontSize: size * 0.22, color: 'white' }}
        >
          {score}
        </div>
        <div style={{ fontSize: size * 0.05, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em' }}>
          PRYSM
        </div>
      </div>

      {/* Scale labels */}
      {labels.map(({ label, x, y }) => (
        <div
          key={label}
          className="absolute pointer-events-none"
          style={{
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
            fontSize: size * 0.048,
            color: 'rgba(255,255,255,0.35)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}