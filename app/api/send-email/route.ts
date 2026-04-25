import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface AIContent {
  summary: string;
  recommendations: string[];
  lifestyle: string;
  nutrition: string;
  supplement: string;
}

interface EmailParams {
  name: string;
  score: number;
  scoreLabel: string;
  scoreColor: string;
  scoreDescription: string;
  date: string;
  aiContent: AIContent;
}

function buildEmailHTML({
  name,
  score,
  scoreLabel,
  scoreColor,
  scoreDescription,
  date,
  aiContent,
}: EmailParams): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your PRYSM Report</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <div style="background:#0a0f1e;padding:24px 20px;text-align:center;">
            <div style="font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.2em;text-transform:uppercase;margin-bottom:6px;">Nu Skin</div>
            <div style="font-size:20px;font-weight:bold;color:#ffffff;">PRYSM Antioxidant Report</div>
          </div>

          <!-- Score band -->
          <div style="padding:24px 20px;border-bottom:1px solid #f0f0f0;">
            <div style="font-size:42px;font-weight:bold;color:${scoreColor};line-height:1;text-align:center;">${score}</div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-top:4px;text-align:center;">score</div>
            <div style="margin-top:12px;">
              <div style="font-size:16px;font-weight:bold;color:#1a1a2e;margin-bottom:4px;">${name}</div>
              <div style="font-size:13px;color:#555;">
                Scored <strong style="color:${scoreColor};">${scoreLabel}</strong> — ${scoreDescription}
              </div>
              <div style="margin-top:10px;height:6px;background:#f0f0f0;border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${((score - 100) / 900) * 100}%;background:${scoreColor};border-radius:3px;"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:10px;color:#bbb;margin-top:3px;">
                <span>100 LOW</span><span>HIGH 1000</span>
              </div>
            </div>
          </div>

          <!-- AI Summary -->
          <div style="padding:20px;border-bottom:1px solid #f0f0f0;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:${scoreColor};margin-bottom:8px;">AI Health Analysis</div>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#333;">${aiContent.summary}</p>
          </div>

          <!-- Recommendations -->
          <div style="padding:20px;border-bottom:1px solid #f0f0f0;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#888;margin-bottom:12px;">Recommendations</div>
            ${aiContent.recommendations
              .map(
                (rec, i) => `
              <div style="display:flex;gap:10px;margin-bottom:8px;align-items:flex-start;">
  <div style="min-width:20px;width:20px;height:20px;border-radius:50%;background:${scoreColor};color:white;font-size:10px;font-weight:bold;text-align:center;line-height:20px;display:inline-block;margin-top:2px;margin-right:10px">
    ${i + 1}
  </div>
  <span style="font-size:13px;color:#333;line-height:1.6;">
    ${rec}
  </span>
</div>
            `,
              )
              .join("")}
          </div>

          <!-- Factors -->
          <div style="padding:20px;border-bottom:1px solid #f0f0f0;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#888;margin-bottom:12px;">Influencing Factors</div>
            ${[
              { emoji: "🥗", label: "Nutrition", text: aiContent.nutrition },
              { emoji: "☀️", label: "Lifestyle", text: aiContent.lifestyle },
              { emoji: "💊", label: "Supplement", text: aiContent.supplement },
            ]
              .map(
                (f) => `
              <div style="margin-bottom:12px;">
                <div style="font-size:13px;font-weight:bold;color:#1a1a2e;margin-bottom:3px;">${f.emoji} ${f.label}</div>
                <div style="font-size:12px;color:#555;line-height:1.6;">${f.text}</div>
              </div>
            `,
              )
              .join("")}
          </div>

          <!-- Footer -->
          <div style="padding:16px 20px;text-align:center;background:#f9f9f9;">
            <div style="font-size:11px;color:#aaa;">Nu Skin PRYSM Scanner — for informational purposes only, not medical advice.</div>
            <div style="font-size:11px;color:#bbb;margin-top:4px;">Generated on ${date}</div>
          </div>

        </div>
      </body>
    </html>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      score,
      scoreLabel,
      scoreColor,
      scoreDescription,
      date,
      aiContent,
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 },
      );
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return NextResponse.json({
        success: true,
        demo: true,
        message:
          "Set EMAIL_USER and EMAIL_PASS in .env.local to enable sending.",
      });
    }

    const pdfRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-pdf`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, score }),
      },
    );
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Nu Skin PRYSM Report <${emailUser}>`,
      to: email,
      subject: `Your PRYSM Antioxidant Score Report — ${name}`,
      html: buildEmailHTML({
        name,
        score,
        scoreLabel,
        scoreColor,
        scoreDescription,
        date,
        aiContent,
      }),
      text: [
        `Dear ${name},`,
        ``,
        `Your PRYSM antioxidant score is ${score} (${scoreLabel}).`,
        ``,
        aiContent.summary,
        ``,
        `Recommendations:`,
        ...aiContent.recommendations.map(
          (r: string, i: number) => `${i + 1}. ${r}`,
        ),
        ``,
        `Nutrition: ${aiContent.nutrition}`,
        `Lifestyle: ${aiContent.lifestyle}`,
        `Supplement: ${aiContent.supplement}`,
        ``,
        `This report was generated on ${date}.`,
        ``,
        `— Nu Skin PRYSM Scanner`,
      ].join("\n"),
      attachments: [
        {
          filename: `PRYSM-Report-${name}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Send email error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send email" },
      { status: 500 },
    );
  }
}
