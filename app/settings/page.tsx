'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [gmailUser, setGmailUser] = useState('');
  const [gmailPass, setGmailPass] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setGmailUser(data.gmailUser || '');
        setGmailPass(data.gmailPass ? '••••••••' : '');
        setFetching(false);
      });
  }, []);

  const save = async () => {
    setLoading(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gmailUser, gmailPass }),
    });
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080c18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', padding: '0 24px' }}>
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Email Settings</h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginBottom: '32px' }}>
          Emails to clients will be sent from your Gmail account.
        </p>

        {/* How to get App Password guide */}
        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '28px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
          <div style={{ color: '#a5b4fc', fontWeight: 'bold', marginBottom: '6px' }}>How to get a Gmail App Password:</div>
          <div>1. Go to <strong style={{ color: 'rgba(255,255,255,0.6)' }}>myaccount.google.com</strong></div>
          <div>2. Security → 2-Step Verification → enable it</div>
          <div>3. Search <strong style={{ color: 'rgba(255,255,255,0.6)' }}>"App Passwords"</strong> in the search bar</div>
          <div>4. Create one named "PRYSM" → copy the 16-char password</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Gmail Address
            </label>
            <input
              type="email"
              value={gmailUser}
              onChange={e => setGmailUser(e.target.value)}
              placeholder="you@gmail.com"
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              App Password
            </label>
            <input
              type="password"
              value={gmailPass}
              onChange={e => setGmailPass(e.target.value)}
              placeholder="16-character app password"
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={save}
            disabled={loading || fetching}
            style={{ marginTop: '8px', padding: '14px', background: saved ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}