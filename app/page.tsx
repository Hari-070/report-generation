"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getScoreInfo } from "@/lib/score";
import { signOut, useSession } from "next-auth/react";

interface FormData {
  name: string;
  phone: string;
  email: string;
  score: string;
}

export default function HomePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    score: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // for the existing search
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);

  const scoreNum = parseInt(form.score) || 0;
  const scoreInfo = scoreNum >= 100 ? getScoreInfo(scoreNum) : null;

  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const score = parseInt(form.score);
    if (!form.name.trim()) return setError("Please enter the client name.");
    if (!form.email.trim() || !form.email.includes("@"))
      return setError("Please enter a valid email.");
    if (isNaN(score) || score < 100 || score > 1000)
      return setError("Score must be between 100 and 1000.");

    setLoading(true);
    try {
      const params = new URLSearchParams({
        name: form.name,
        phone: form.phone,
        email: form.email,
        score: form.score,
        ts: Date.now().toString(),
      });
      router.push(`/report?${params.toString()}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Add this function — debounced search on name field
  const searchUsers = async (value: string) => {
    setForm({ ...form, name: value });
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchingUser(true);
    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(value)}`,
      );
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchingUser(false);
    }
  };

  // Add this function — fill form when user selected
  const selectUser = (user: any) => {
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      score: "", // keep score empty — they need to enter new scan score
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-white fill-current"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-white/40 uppercase tracking-widest">
                Nu Skin
              </div>
              <div className="text-sm font-semibold text-white leading-tight">
                PRYSM Scanner
              </div>
            </div>
          </div>
          <div className="text-xs text-white/30">Report Generator v1.0</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
            {session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "12px",
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="space-y-6 animate-fade-up animate-fade-up-1">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white/60 tracking-wide">
                  Antioxidant Scan Report
                </span>
              </div>

              <h1 className="font-display text-4xl lg:text-5xl font-bold leading-tight">
                Generate Your{" "}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                  Health Report
                </span>
              </h1>

              <p className="text-white/50 text-lg leading-relaxed">
                Enter the client's scan results below to instantly generate an
                AI-powered antioxidant health report — ready to download or
                email.
              </p>

              {/* Score legend */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {[
                  { label: "Orange", color: "#f97316", range: "100–299" },
                  { label: "Yellow", color: "#eab308", range: "300–399" },
                  { label: "Green", color: "#22c55e", range: "400–549" },
                  { label: "Blue", color: "#38bdf8", range: "550–749" },
                  { label: "Purple", color: "#a855f7", range: "750+" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div
                      className="w-full h-1.5 rounded-full mb-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="text-[10px] text-white/40">
                      {item.range}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <div className="animate-fade-up animate-fade-up-2">
              <div className="relative">
                {/* Glow effect */}
                {scoreInfo && (
                  <div
                    className="absolute -inset-px rounded-2xl opacity-30 blur-xl transition-all duration-700"
                    style={{ background: scoreInfo.hex }}
                  />
                )}

                <div className="relative bg-[#0d1424] border border-white/10 rounded-2xl p-8 shadow-2xl">
                  <h2 className="text-lg font-semibold mb-6 text-white/90">
                    Client Details
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div style={{ position: "relative" }}>
                      <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                        Full Name *
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => searchUsers(e.target.value)}
                          onBlur={() =>
                            setTimeout(() => setShowSuggestions(false), 150)
                          }
                          onFocus={() =>
                            suggestions.length > 0 && setShowSuggestions(true)
                          }
                          placeholder="e.g. Poonkuzhali Anand"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                          required
                        />
                        {/* Search spinner */}
                        {searchingUser && (
                          <div
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                          >
                            <svg
                              className="w-4 h-4 animate-spin text-white/30"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Dropdown suggestions */}
                      {showSuggestions && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 50,
                            background: "#0d1424",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            marginTop: "6px",
                            overflow: "hidden",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                          }}
                        >
                          {suggestions.map((user) => (
                            <div
                              key={user.uuid}
                              onMouseDown={() => selectUser(user)}
                              style={{
                                padding: "12px 16px",
                                cursor: "pointer",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.05)",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(255,255,255,0.05)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      color: "white",
                                      fontSize: "14px",
                                      fontWeight: "600",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    {user.name}
                                  </div>
                                  <div
                                    style={{
                                      color: "rgba(255,255,255,0.3)",
                                      fontSize: "11px",
                                    }}
                                  >
                                    {user.email} · {user.phone}
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: "bold",
                                      color: "#38bdf8",
                                    }}
                                  >
                                    Last: {user.score}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "10px",
                                      color: "rgba(255,255,255,0.25)",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {user.history?.length || 1} scan
                                    {(user.history?.length || 1) !== 1
                                      ? "s"
                                      : ""}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {/* New user hint at bottom */}
                          <div
                            style={{
                              padding: "10px 16px",
                              color: "rgba(255,255,255,0.2)",
                              fontSize: "11px",
                              textAlign: "center",
                            }}
                          >
                            Not listed? Just continue typing to add as new
                            client
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
                        style={
                          form.phone
                            ? {
                                borderColor: "rgba(34,197,94,0.3)",
                                background: "rgba(34,197,94,0.04)",
                              }
                            : {}
                        }
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="client@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
                        style={
                          form.email
                            ? {
                                borderColor: "rgba(34,197,94,0.3)",
                                background: "rgba(34,197,94,0.04)",
                              }
                            : {}
                        }
                      />
                    </div>

                    {/* Score */}
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                        PRYSM Score (100–1000) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.score}
                          onChange={(e) =>
                            setForm({ ...form, score: e.target.value })
                          }
                          placeholder="e.g. 450"
                          min="100"
                          max="1000"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all pr-24"
                          required
                        />
                        {scoreInfo && (
                          <div
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              backgroundColor: scoreInfo.hex + "20",
                              color: scoreInfo.hex,
                            }}
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: scoreInfo.hex }}
                            />
                            {scoreInfo.label}
                          </div>
                        )}
                      </div>

                      {/* Score slider display */}
                      {scoreNum >= 100 && scoreNum <= 1000 && (
                        <div className="mt-3">
                          <div className="h-1.5 rounded-full score-track relative overflow-hidden">
                            <div
                              className="absolute inset-y-0 right-0 bg-[#0d1424] transition-all duration-300"
                              style={{
                                width: `${100 - ((scoreNum - 100) / 900) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-white/30 mt-1">
                            <span>100</span>
                            <span>1000</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-xl font-semibold text-white relative overflow-hidden group transition-all duration-300 disabled:opacity-50"
                      style={{
                        background: scoreInfo
                          ? `linear-gradient(135deg, ${scoreInfo.hex}cc, ${scoreInfo.hex}88)`
                          : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                        boxShadow: scoreInfo
                          ? `0 0 30px ${scoreInfo.hex}40`
                          : "0 0 30px rgba(59,130,246,0.3)",
                      }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <svg
                              className="w-4 h-4 animate-spin"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Preparing Report...
                          </>
                        ) : (
                          <>
                            Generate Report
                            <svg
                              viewBox="0 0 24 24"
                              className="w-4 h-4 fill-current"
                            >
                              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                            </svg>
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-white/20">
        Nu Skin PRYSM Antioxidant Report Generator • Powered by Google Gemini AI
      </footer>
    </div>
  );
}
