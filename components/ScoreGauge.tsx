'use client';

import { ScoreInfo, getScoreAngle } from '@/lib/score';
import { useEffect, useState } from 'react';


interface ScoreGaugeProps {
  score: number;
  scoreInfo: ScoreInfo;
  size?: number;
}

export default function ScoreGauge({ score, scoreInfo, size = 220 }: ScoreGaugeProps) {
  const [animated, setAnimated] = useState(false);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.045;

  // Generate rainbow arc segments
  const segments = [
    { color: '#f97316', start: -140, end: -56 },  // orange
    { color: '#eab308', start: -56, end: 28 },    // yellow
    { color: '#22c55e', start: 28, end: 84 },     // green
    { color: '#38bdf8', start: 84, end: 112 },    // blue
    { color: '#a855f7', start: 112, end: 140 },   // purple
  ];

  const polarToCartesian = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const arcPath = (startAngle: number, endAngle: number, r: number) => {
    const s = polarToCartesian(startAngle, r);
    const e = polarToCartesian(endAngle, r);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  // Indicator dot position
  const indicatorAngle = getScoreAngle(score);
  const indicatorPos = polarToCartesian(indicatorAngle, radius);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Concentric rings (decorative)
  const rings = [0.28, 0.32, 0.36].map(r => size * r);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-lg"
      >
        {/* Dark background circle */}
        <circle cx={cx} cy={cy} r={size * 0.45} fill="#0d1424" />

        {/* Decorative inner rings */}
        {rings.map((r, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        ))}

        {/* Background arc track */}
        <path
          d={arcPath(-140, 140, radius)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored arc segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={arcPath(seg.start, seg.end, radius)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            opacity={0.85}
          />
        ))}

        {/* Indicator glow */}
        <circle
          cx={indicatorPos.x}
          cy={indicatorPos.y}
          r={strokeWidth * 1.4}
          fill={scoreInfo.hex}
          opacity={0.3}
          style={{
            transition: 'all 1s ease',
            filter: `blur(4px)`,
          }}
        />

        {/* Indicator dot */}
        <circle
          cx={indicatorPos.x}
          cy={indicatorPos.y}
          r={strokeWidth * 0.9}
          fill="white"
          stroke={scoreInfo.hex}
          strokeWidth={strokeWidth * 0.3}
          style={{ transition: 'all 1s ease' }}
        />
      </svg>

      {/* Score number in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-display font-bold leading-none"
          style={{
            fontSize: size * 0.22,
            color: 'white',
            textShadow: `0 0 30px ${scoreInfo.hex}60`,
          }}
        >
          {score}
        </div>
        <div className="text-white/30 uppercase tracking-widest mt-1" style={{ fontSize: size * 0.05 }}>
          PRYSM
        </div>
      </div>

      {/* Scale labels */}
      {[
        { label: '400', angle: -35 },
        { label: '550', angle: 35 },
        { label: '300', angle: -90 },
        { label: '750', angle: 90 },
        { label: '200', angle: -120 },
        { label: '1000', angle: 140 },
      ].map(({ label, angle }) => {
        const pos = polarToCartesian(angle, radius * 1.28);
        return (
          <div
            key={label}
            className="absolute text-white/30 pointer-events-none"
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              fontSize: size * 0.048,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
