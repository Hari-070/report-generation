import React from "react";

// Add this component at the top of the file
function PrintGauge({ score, scoreInfo }: { score: number; scoreInfo: any }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.37;
  const strokeWidth = size * 0.028;
  const SEG = 300 / 6;
  const START = -150;

  const segments = [
    { color: '#ef4444', from: 0, to: 1 },
    { color: '#f97316', from: 1, to: 2 },
    { color: '#eab308', from: 2, to: 3 },
    { color: '#22c55e', from: 3, to: 4 },
    { color: '#38bdf8', from: 4, to: 5 },
    { color: '#a855f7', from: 5, to: 6 },
  ];

  const scoreRanges = [100, 200, 300, 400, 550, 750, 1000];

  const scoreToAngle = (s: number) => {
    const clamped = Math.max(100, Math.min(1000, s));
    for (let i = 0; i < 6; i++) {
      if (clamped <= scoreRanges[i + 1]) {
        const t = (clamped - scoreRanges[i]) / (scoreRanges[i + 1] - scoreRanges[i]);
        return START + (i + t) * SEG;
      }
    }
    return START + 6 * SEG;
  };

  const polar = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arc = (a1: number, a2: number, r: number) => {
    const s = polar(a1, r);
    const e = polar(a2, r);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  const dot = polar(scoreToAngle(score), radius);
  const labels = scoreRanges.map((s, i) => ({ s, ...polar(START + i * SEG, radius * 1.3) }));

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Light background track */}
        <path d={arc(START, START + 6 * SEG, radius)} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} strokeLinecap="round" />

        {/* Colored segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={arc(START + seg.from * SEG, START + seg.to * SEG, radius)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap={i === 0 || i === 5 ? 'round' : 'butt'}
            opacity={0.9}
          />
        ))}

        {/* Indicator glow */}
        <circle cx={dot.x} cy={dot.y} r={strokeWidth * 1.5} fill={scoreInfo.hex} opacity={0.2} />
        {/* Indicator dot */}
        <circle cx={dot.x} cy={dot.y} r={strokeWidth * 0.95} fill={scoreInfo.hex} />
        <circle cx={dot.x} cy={dot.y} r={strokeWidth * 0.4} fill="white" opacity={0.9} />
      </svg>

      {/* Score in center */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: size * 0.2, fontWeight: 'bold', color: '#1a1a2e', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: size * 0.07, color: '#aaa', letterSpacing: '0.15em', marginTop: 2 }}>PRYSM</div>
      </div>

      {/* Scale labels */}
      {labels.map(({ s, x, y }) => (
        <div key={s} style={{
          position: 'absolute',
          left: x, top: y,
          transform: 'translate(-50%, -50%)',
          fontSize: size * 0.06,
          color: '#bbb',
          fontFamily: 'Arial, sans-serif',
        }}>{s}</div>
      ))}
    </div>
  );
}


export default function PrintReport({ name, phone, email, score, scoreInfo, date, aiContent }: any) {
  return (
    <div id="print-report" style={{ fontFamily: 'Georgia, serif', color: '#1a1a2e', fontSize: '11pt' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1a2e', paddingBottom: '8pt', marginBottom: '16pt' }}>
        <div>
          <div style={{ fontSize: '7pt', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#666', marginBottom: '2pt' }}>Nu Skin</div>
          <div style={{ fontSize: '16pt', fontWeight: 'bold', letterSpacing: '-0.02em' }}>PRYSM Antioxidant Report</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '9pt', color: '#555' }}>
          <div>{date}</div>
          {phone && <div>{phone}</div>}
          {email && <div>{email}</div>}
        </div>
      </div>

      {/* Score band */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20pt', marginBottom: '18pt' }}>
        {/* <div style={{ textAlign: 'center', minWidth: '70pt' }}>
          <div style={{ fontSize: '36pt', fontWeight: 'bold', color: scoreInfo.hex, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>score</div>
        </div> */}
        <PrintGauge score={score} scoreInfo={scoreInfo} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13pt', fontWeight: 'bold', marginBottom: '4pt' }}>{name}</div>
          <div style={{ fontSize: '9pt', color: '#555', marginBottom: '6pt' }}>
            Scored <strong style={{ color: scoreInfo.hex }}>{scoreInfo.label}</strong> — {scoreInfo.description}
          </div>
          {/* Progress bar */}
          <div style={{ height: '6pt', background: '#f0f0f0', borderRadius: '3pt', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((score - 100) / 900) * 100}%`, background: scoreInfo.hex, borderRadius: '3pt' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: '#aaa', marginTop: '2pt' }}>
            <span>100 LOW</span><span>HIGH 1000</span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div style={{ background: '#f8f9fa', border: `1px solid ${scoreInfo.hex}44`, borderLeft: `3pt solid ${scoreInfo.hex}`, padding: '10pt 12pt', marginBottom: '14pt', borderRadius: '0 4pt 4pt 0' }}>
        <div style={{ fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.12em', color: scoreInfo.hex, fontFamily: 'Arial, sans-serif', marginBottom: '4pt' }}>AI Health Analysis</div>
        <p style={{ margin: 0, fontSize: '9.5pt', lineHeight: 1.6, color: '#333' }}>{aiContent?.summary}</p>
      </div>

      {/* Two-column: Recommendations + Factors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14pt', marginBottom: '14pt' }}>
        {/* Recommendations */}
        <div>
          <div style={{ fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', fontFamily: 'Arial, sans-serif', marginBottom: '6pt' }}>Recommendations</div>
          {aiContent?.recommendations.map((rec: any, i: any) => (
            <div key={i} style={{ display: 'flex', gap: '6pt', marginBottom: '5pt', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '14pt', height: '14pt', borderRadius: '50%', background: scoreInfo.hex, color: 'white', fontSize: '7pt', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial', fontWeight: 'bold', marginTop: '1pt' }}>{i + 1}</div>
              <span style={{ fontSize: '9pt', color: '#333', lineHeight: 1.5 }}>{rec}</span>
            </div>
          ))}
        </div>

        {/* Factors */}
        <div>
          <div style={{ fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', fontFamily: 'Arial, sans-serif', marginBottom: '6pt' }}>Influencing Factors</div>
          {[
            { emoji: '🥗', label: 'Nutrition', text: aiContent?.nutrition },
            { emoji: '☀️', label: 'Lifestyle', text: aiContent?.lifestyle },
            { emoji: '🏃', label: 'Fitness', text: 'Higher BMI tends to lower antioxidant scores. Optimal fitness aids nutrient distribution.' },
            { emoji: '💊', label: 'Supplement', text: aiContent?.supplement },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: '6pt' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '1pt' }}>{f.emoji} {f.label}</div>
              <div style={{ fontSize: '8.5pt', color: '#555', lineHeight: 1.5 }}>{f.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '6pt', display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#aaa' }}>
        <span>Nu Skin PRYSM Scanner — for informational purposes only, not medical advice.</span>
        <span>Generated {date}</span>
      </div>
    </div>
  );
}