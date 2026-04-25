"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getScoreInfo, getProgressPercent } from "@/lib/score";
import ScoreGauge from "@/components/ScoreGauge";
import ReportPreview from "@/components/ReportPreview";
import html2pdf from "html2pdf.js";
import PrintReport from "@/components/PrintReport";

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

  const name = searchParams.get("name") || "";
  const phone = searchParams.get("phone") || "";
  const email = searchParams.get("email") || "";
  const score = parseInt(searchParams.get("score") || "0");

  const [aiContent, setAiContent] = useState<AIContent | null>(null);
  const [loadingAI, setLoadingAI] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [emailMessage, setEmailMessage] = useState("");

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
          body: JSON.stringify({ name, email, phone, score, scoreLabel: scoreInfo.label }),
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
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            New Report
          </button>

          <div className="flex items-center gap-3">
            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF || loadingAI}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm disabled:opacity-40"
            >
              {downloadingPDF ? (
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
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
              )}
              Download PDF
            </button>

            {/* Send Email */}
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || loadingAI || emailStatus === "success"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all text-sm disabled:opacity-40"
              style={{
                background:
                  emailStatus === "success"
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : `linear-gradient(135deg, ${scoreInfo.hex}cc, ${scoreInfo.hex}88)`,
                boxShadow: `0 0 20px ${scoreInfo.hex}30`,
              }}
            >
              {sendingEmail ? (
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
              ) : emailStatus === "success" ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              )}
              {emailStatus === "success" ? "Sent!" : "Send via Email"}
            </button>
          </div>
        </div>
      </header>

      {/* Email status banner */}
      {emailMessage && (
        <div
          className={`px-6 py-3 text-center text-sm ${
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
