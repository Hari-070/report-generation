'use client';
import { useState } from 'react';

interface ScanRecord {
  score: number;
  scoreLabel: string;
  aiContent: { summary: string; recommendations: string[]; nutrition: string; lifestyle: string; supplement: string };
  scannedAt: string;
}

interface UserRecord {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  scoreLabel: string;
  createdAt: string;
  updatedAt: string;
  history: ScanRecord[];
}

const scoreColor = (label: string) => {
  const map: Record<string, string> = {
    'Very Low': '#ef4444',
    'Low': '#f97316',
    'Below Average': '#eab308',
    'Average': '#22c55e',
    'Good': '#38bdf8',
    'Excellent': '#a855f7',
  };
  return map[label] || '#888';
};

export default function AdminPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserRecord[]>([]);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSelected(null);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080c18', fontFamily: 'Georgia, serif' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Nu Skin</span>
        <span style={{ color: 'rgba(255,255,255,0.1)', marginLeft: 4, marginRight: 4 }}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', letterSpacing: '0.1em' }}>PRYSM Admin</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: 0, marginBottom: '6px' }}>
            Customer Records
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>
            Search by name, email, phone or UUID
          </p>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search name, email, phone, or UUID..."
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '14px 18px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'Georgia, serif',
            }}
          />
          <button
            onClick={search}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Results + Detail split */}
        {searched && (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: '20px' }}>
            
            {/* Results list */}
            <div>
              {results.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0', fontSize: '14px' }}>
                  No records found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {results.map(r => (
                    <div
                      key={r.uuid}
                      onClick={() => setSelected(r)}
                      style={{
                        background: selected?.uuid === r.uuid ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selected?.uuid === r.uuid ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '12px',
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>{r.name}</div>
                          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginBottom: '2px' }}>{r.email}</div>
                          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>{r.phone}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '22px', fontWeight: 'bold', color: scoreColor(r.scoreLabel), lineHeight: 1 }}>{r.score}</div>
                          <div style={{ fontSize: '10px', color: scoreColor(r.scoreLabel), marginTop: '2px' }}>{r.scoreLabel}</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
                            {r.history?.length || 1} scan{(r.history?.length || 1) > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selected && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', overflowY: 'auto', maxHeight: '80vh' }}>
                
                {/* User info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{selected.name}</h2>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '4px' }}>{selected.email} · {selected.phone}</div>
                    <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', marginTop: '4px', fontFamily: 'monospace' }}>{selected.uuid}</div>
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: scoreColor(selected.scoreLabel), textAlign: 'right' }}>
                    {selected.score}
                    <div style={{ fontSize: '11px', color: scoreColor(selected.scoreLabel) }}>{selected.scoreLabel}</div>
                  </div>
                </div>

                {/* Scan history */}
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
                  Scan History ({selected.history?.length || 0})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(selected.history || []).slice().reverse().map((scan, i) => (
                    <div
                      key={i}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}
                    >
                      {/* Scan header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ fontSize: '22px', fontWeight: 'bold', color: scoreColor(scan.scoreLabel) }}>{scan.score}</div>
                          <div style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: scoreColor(scan.scoreLabel) + '20', color: scoreColor(scan.scoreLabel) }}>
                            {scan.scoreLabel}
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                          {new Date(scan.scannedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      {/* Summary */}
                      {scan.aiContent?.summary && (
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                          {scan.aiContent.summary}
                        </p>
                      )}

                      {/* Recommendations */}
                      {scan.aiContent?.recommendations?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', marginBottom: '8px' }}>Recommendations</div>
                          {scan.aiContent.recommendations.map((rec, j) => (
                            <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                              <div style={{ minWidth: '16px', height: '16px', borderRadius: '50%', background: scoreColor(scan.scoreLabel) + '30', color: scoreColor(scan.scoreLabel), fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginTop: '1px' }}>{j + 1}</div>
                              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: 1.5 }}>{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}