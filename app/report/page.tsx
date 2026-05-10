"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getScoreInfo, getProgressPercent } from "@/lib/score";
import ScoreGauge from "@/components/ScoreGauge";
import ReportPreview from "@/components/ReportPreview";
import html2pdf from "html2pdf.js";
import PrintReport from "@/components/PrintReport";
import { Settings, LogOut, ArrowLeft, Download, Mail, Check, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

interface AIContent {
  summary: string;
  recommendations: string[];
  lifestyle: string;
  nutrition: string;
  supplement: string;
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const name = searchParams.get("name") || "";
  const phone = searchParams.get("phone") || "";
  const email = searchParams.get("email") || "";
  const score = parseInt(searchParams.get("score") || "0");
  const ts = searchParams.get('ts') || '';

  const [aiContent, setAiContent] = useState<AIContent | null>(null);
  const [loadingAI, setLoadingAI] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [emailMessage, setEmailMessage] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close on outside click:
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scoreInfo = getScoreInfo(score);
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Fetch AI content on mount
  useEffect(() => {
    if (!name || !score) {
      router.push("/");
      return;
    }

    async function fetchAI() {
      try {
        const res = await fetch("/api/generate-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, score, scoreLabel: scoreInfo.label, ts }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        console.log(data);
        setAiContent(data.aiContent);
      } catch (err) {
        console.error(err);
        // Fallback content
        setAiContent({
          summary: `Your PRYSM score of ${score} places you in the ${scoreInfo.label} category, indicating ${scoreInfo.description.toLowerCase()}. This reflects your current antioxidant defense levels against free radical damage.`,
          recommendations: [
            "Increase daily intake of colorful fruits and vegetables",
            "Consider adding antioxidant-rich superfoods to your diet",
            "Maintain a consistent exercise routine",
            "Reduce exposure to environmental pollutants",
            "Consider quality antioxidant supplementation",
          ],
          lifestyle:
            "Your lifestyle choices significantly impact antioxidant levels. Prioritize stress management, adequate sleep of 7-8 hours, and avoid smoking and excessive alcohol consumption.",
          nutrition:
            "Focus on a diet rich in berries, leafy greens, nuts, and deeply colored vegetables. These foods are packed with phytonutrients that support your body's antioxidant defense system.",
          supplement:
            "Pharmanex® LifePak® Elements is a comprehensive multivitamin and mineral supplement thoughtfully formulated to support antioxidant health and fill common nutritional gaps.",
        });
      } finally {
        setLoadingAI(false);
      }
    }

    fetchAI();
  }, []);

  const handleDownloadPDF = async () => {
    setTimeout(() => {
      console.log(document.getElementById("report-preview"), "the elemet");
      window.print();
    }, 100);
    // setDownloadingPDF(true);

    // try {
    //   const res = await fetch("/api/generate-report", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       name,
    //       score,
    //       email,
    //       phone,
    //       scoreLabel: scoreInfo.label,
    //       scoreColor: scoreInfo.hex,
    //       scoreDescription: scoreInfo.description,
    //       date: today,
    //       aiContent,
    //       action: "pdf",
    //     }),
    //   });

    //   const html = await res.text();

    //   // Create hidden container
    //   const container = document.createElement("div");
    //   container.innerHTML = html;
    //   document.body.appendChild(container);

    //   await html2pdf()
    //     .from(container) // 🔥 VERY IMPORTANT
    //     .set({
    //       margin: 0,
    //       filename: `PRYSM-Report-${name}.pdf`,
    //       html2canvas: {
    //         scale: 2,
    //         backgroundColor: "#080c18", // fallback
    //         useCORS: true,
    //       },
    //       jsPDF: {
    //         unit: "mm",
    //         format: "a4",
    //         orientation: "portrait",
    //       },
    //     })
    //     .save();

    //   document.body.removeChild(container);
    // } catch (err) {
    //   console.error(err);
    //   window.print(); // last fallback
    // } finally {
    //   setDownloadingPDF(false);
    // }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailStatus("idle");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          score,
          scoreLabel: scoreInfo.label,
          scoreColor: scoreInfo.hex,
          scoreDescription: scoreInfo.description,
          date: today,
          aiContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatus("success");
        setEmailMessage(`Report sent to ${email}`);
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (err: any) {
      setEmailStatus("error");
      setEmailMessage(err.message || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  if (!name || !score) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="screen-only border-b border-white/5 px-6 py-4 sticky top-0 z-50 bg-[#080c18]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          {/* Left — Back button */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            New Report
          </button>

          {/* Right — Actions */}
          <div className="flex items-center gap-2">

            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF || loadingAI}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm disabled:opacity-40"
            >
              {downloadingPDF
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />
              }
              Download PDF
            </button>

            {/* Send Email */}
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || loadingAI || emailStatus === "success"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all text-sm disabled:opacity-40"
              style={{
                background: emailStatus === "success"
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : `linear-gradient(135deg, ${scoreInfo.hex}cc, ${scoreInfo.hex}88)`,
                boxShadow: `0 0 20px ${scoreInfo.hex}30`,
              }}
            >
              {sendingEmail
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : emailStatus === "success"
                  ? <Check className="w-4 h-4" />
                  : <Mail className="w-4 h-4" />
              }
              {emailStatus === "success" ? "Sent!" : "Send via Email"}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Profile Dropdown */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="rounded-full border-2 border-white/10 hover:border-white/30 transition-all overflow-hidden w-8 h-8 flex-shrink-0"
            >
              {session?.user?.image
                ? <img src={"https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {session?.user?.name?.[0] ?? "A"}
                  </div>
              }
            </button>

            {profileOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '220px',
                  background: '#0d1424',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  zIndex: 100,
                }}
              >
                {/* User info */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        {session?.user?.image
                          ? <img src={"https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #60a5fa, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                              {session?.user?.name?.[0] ?? "A"}
                            </div>
                        }
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {session?.user?.name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {session?.user?.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0' }} />

                  {/* Settings */}
                  <button
                    onClick={() => { router.push('/settings'); setProfileOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Settings size={14} />
                    Settings
                  </button>

                  {/* Separator */}
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                  {/* Sign out */}
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', background: 'none', border: 'none', color: 'rgba(239,68,68,0.6)', fontSize: '13px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
            </div>
            )}
          </div>

          </div>
        </div>
      </header>

      {/* Email status banner */}
      {emailMessage && (
        <div
          className={`screen-only px-6 py-3 text-center text-sm ${
            emailStatus === "success"
              ? "bg-green-500/10 text-green-400 border-b border-green-500/20"
              : "bg-red-500/10 text-red-400 border-b border-red-500/20"
          }`}
        >
          {emailStatus === "success" ? "✓" : "✗"} {emailMessage}
        </div>
      )}

      {/* Loading state */}
      {loadingAI && (
        <div className="fixed inset-0 z-40 bg-[#080c18]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin"
                style={{ color: scoreInfo.hex }}
              />
              <div className="absolute inset-2 rounded-full border border-white/10" />
            </div>
            <div className="text-white/70 text-sm">
              Generating AI health insights...
            </div>
            <div className="text-white/30 text-xs">Using Google Gemini</div>
          </div>
        </div>
      )}

      {/* Report preview */}
      <div ref={reportRef} className="max-w-5xl mx-auto px-6 py-10">
        <div className="screen-only">
          <ReportPreview
          name={name}
          phone={phone}
          email={email}
          score={score}
          scoreInfo={scoreInfo}
          date={today}
          aiContent={aiContent}
          loadingAI={loadingAI}
        />
        </div>

        <div className="print-only">
          <h1 style={{color:'black'}}>PRINT TEST</h1>
          <PrintReport
            name={name}
            phone={phone}
            email={email}
            score={score}
            scoreInfo={scoreInfo}
            date={today}
            aiContent={aiContent}
          />
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white/50">Loading...</div>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
