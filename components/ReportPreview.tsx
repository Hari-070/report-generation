'use client';

import { ScoreInfo, getProgressPercent } from '@/lib/score';
import ScoreGauge from './ScoreGauge';
import ScoreGauge2 from './ScoreGauge2';

interface AIContent {
  summary: string;
  recommendations: string[];
  lifestyle: string;
  nutrition: string;
  supplement: string;
}

interface ReportPreviewProps {
  name: string;
  phone: string;
  email: string;
  score: number;
  scoreInfo: ScoreInfo;
  date: string;
  aiContent: AIContent | null;
  loadingAI: boolean;
}

const FactorIcon = ({ n }: { n: number }) => (
  <div
    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
    style={{ background: 'rgba(255,255,255,0.08)' }}
  >
    {n}
  </div>
);

const Skeleton = ({ className }: { className: string }) => (
  <div className={`bg-white/5 animate-pulse rounded ${className}`} />
);

export default function ReportPreview({
  name, phone, email, score, scoreInfo, date, aiContent, loadingAI
}: ReportPreviewProps) {
  const progressPercent = getProgressPercent(score);

  return (
    <div
      id="report-preview"
      className="rounded-2xl overflow-hidden border border-white/10"
      style={{ background: '#0a0f1e' }}
    >
      {/* ───────────────────────── HEADER ───────────────────────── */}
      <div
        className="px-8 pt-10 pb-6 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${scoreInfo.hex}18 0%, transparent 100%)`,
          borderBottom: `1px solid ${scoreInfo.hex}20`,
        }}
      >
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-xs text-white/40 uppercase tracking-widest">Nu Skin</div>
            <div className="text-sm font-semibold text-white">PRYSM Antioxidant Scan</div>
          </div>
        </div>

        {/* Name & date */}
        <div
          className="text-xs uppercase tracking-widest mb-2"
          style={{ color: scoreInfo.hex + 'aa' }}
        >
          PRYSM Score
        </div>
        <div className="font-display text-2xl font-bold text-white mb-1">{name}</div>
        <div className="text-white/40 text-sm">{date}</div>

        {/* Decorative glow */}
        <div
          className="absolute inset-x-0 top-0 h-px opacity-60"
          style={{ background: `linear-gradient(90deg, transparent, ${scoreInfo.hex}, transparent)` }}
        />
      </div>

      {/* ───────────────────────── GAUGE ───────────────────────── */}
      <div className="flex flex-col items-center py-10 px-8">
        {/* <ScoreGauge score={score} scoreInfo={scoreInfo} size={240} /> */}
        <ScoreGauge2 score={score} scoreInfo={scoreInfo} size={300} />

        {/* Score color label */}
        <div className="mt-8 text-center space-y-2">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: scoreInfo.hex + '20', color: scoreInfo.hex }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: scoreInfo.hex }} />
            You Scored {scoreInfo.label}
          </div>
          <p className="text-white/50 text-sm max-w-sm mx-auto text-center">
            This score is associated with {scoreInfo.description.toLowerCase()}
          </p>
        </div>
      </div>

      {/* ───────────────────────── PROGRESS BAR ───────────────────────── */}
      <div className="px-8 pb-8">
        <div className="bg-[#111827] rounded-xl p-5 border border-white/5">
          <div className="flex justify-between text-xs text-white/30 mb-3">
            <span>100 • LOW</span>
            <span>HIGH • 1000</span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden bg-white/5">
            <div className="absolute inset-0 score-track opacity-40" />
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${scoreInfo.hex}88, ${scoreInfo.hex})`,
                boxShadow: `0 0 10px ${scoreInfo.hex}80`,
              }}
            />
            {/* Tick markers */}
            {[200, 300, 400, 550, 750].map(tick => (
              <div
                key={tick}
                className="absolute top-0 bottom-0 w-px bg-black/40"
                style={{ left: `${((tick - 100) / 900) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {[100, 200, 300, 400, 550, 750, 1000].map(n => (
              <span key={n} className="text-[10px] text-white/20">{n}</span>
            ))}
          </div>

          {/* Client details */}
          {(phone || email) && (
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 text-xs text-white/40">
              {phone && <span>📞 {phone}</span>}
              {email && <span>✉ {email}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────── AI SUMMARY ───────────────────────── */}
      <div className="px-8 pb-8">
        <div
          className="rounded-xl p-6 border"
          style={{ background: scoreInfo.hex + '0d', borderColor: scoreInfo.hex + '30' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: scoreInfo.hex + '30' }}
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" style={{ color: scoreInfo.hex }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            </div>
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: scoreInfo.hex }}>
              AI Health Analysis
            </span>
          </div>

          {loadingAI ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : (
            <p className="text-white/70 text-sm leading-relaxed">{aiContent?.summary}</p>
          )}
        </div>
      </div>

      {/* ───────────────────────── RECOMMENDATIONS ───────────────────────── */}
      <div className="px-8 pb-8">
        <h3 className="text-xs uppercase tracking-widest text-white/40 mb-4">Recommendations</h3>
        {loadingAI ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {aiContent?.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                  style={{ background: scoreInfo.hex + '30', color: scoreInfo.hex }}
                >
                  {i + 1}
                </div>
                <span className="text-white/60 text-sm">{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ───────────────────────── FACTORS ───────────────────────── */}
      <div className="px-8 pb-10">
        <h3 className="text-sm font-semibold text-white mb-5">
          Factors that May Influence Your Score
        </h3>

        <div className="space-y-4">
          {/* Nutrition */}
          <div className="flex gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🥗</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FactorIcon n={1} />
                <span className="font-semibold text-white text-sm">Nutrition</span>
              </div>
              {loadingAI ? (
                <div className="space-y-1.5 mt-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ) : (
                <p className="text-white/50 text-xs leading-relaxed mt-1">{aiContent?.nutrition}</p>
              )}
            </div>
          </div>

          {/* Lifestyle */}
          <div className="flex gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-900/50 to-amber-800/30 border border-amber-700/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">☀️</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FactorIcon n={2} />
                <span className="font-semibold text-white text-sm">Lifestyle</span>
              </div>
              {loadingAI ? (
                <div className="space-y-1.5 mt-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ) : (
                <p className="text-white/50 text-xs leading-relaxed mt-1">{aiContent?.lifestyle}</p>
              )}
            </div>
          </div>

          {/* Fitness */}
          <div className="flex gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏃</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FactorIcon n={3} />
                <span className="font-semibold text-white text-sm">Fitness</span>
              </div>
              <p className="text-white/50 text-xs leading-relaxed mt-1">
                Being in your optimal shape helps your body with nutrient distribution. People who have a higher Body Mass Index (BMI) tend to have lower scores.
              </p>
            </div>
          </div>

          {/* Supplement */}
          <div className="flex gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💊</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FactorIcon n={4} />
                <span className="font-semibold text-white text-sm">Supplement</span>
              </div>
              {loadingAI ? (
                <div className="space-y-1.5 mt-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ) : (
                <p className="text-white/50 text-xs leading-relaxed mt-1">{aiContent?.supplement}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <div
        className="px-8 py-6 text-center border-t"
        style={{ borderColor: scoreInfo.hex + '20', background: scoreInfo.hex + '08' }}
      >
        <div className="text-xs text-white/30 space-y-1">
          <div className="font-semibold text-white/50">Nu Skin PRYSM Scanner</div>
          <div>This report is for informational purposes only and does not constitute medical advice.</div>
          <div>Generated on {date}</div>
        </div>
      </div>
    </div>
  );
}
