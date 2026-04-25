import { NextRequest, NextResponse } from "next/server";
import { getScoreInfo } from "@/lib/score";
import puppeteer from "puppeteer";
import { GoogleGenAI } from "@google/genai";
import { MongoClient, ServerApiVersion } from "mongodb";
import { v4 as uuidv4 } from "uuid";

interface AIContent {
  summary: string;
  recommendations: string[];
  lifestyle: string;
  nutrition: string;
  supplement: string;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // or your apiKey variable
});

async function generateWithGemini(
  name: string,
  score: number,
  scoreLabel: string,
): Promise<AIContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const scoreInfo = getScoreInfo(score);

  const prompt = `You are a health advisor for Nu Skin's PRYSM antioxidant scanner. 
Generate personalized health content for a client report.

Client: ${name}
PRYSM Score: ${score} (${scoreLabel} category — ${scoreInfo.description})
Score Range: ${scoreInfo.range} out of 1000

Generate a JSON response with exactly these fields (no markdown, just raw JSON):
{
  "summary": "A 2-3 sentence personalized health summary mentioning their score of ${score} and what it means for their antioxidant defense.",
  "recommendations": ["5 specific, actionable recommendations based on their score level"],
  "lifestyle": "2 sentences about lifestyle factors specific to their score level.",
  "nutrition": "2 sentences about nutrition recommendations specific to their score level.",
  "supplement": "2 sentences about how Pharmanex LifePak Elements supplements can help their specific situation."
}

For ${scoreLabel} scores (${scoreInfo.range}):
- Orange (100-299): focus on urgency, significant improvement needed
- Yellow (300-399): moderate improvement, good progress potential  
- Green (400-549): good foundation, optimize further
- Blue (550-749): excellent, maintain and optimize
- Purple (750-1000): outstanding, maintain exceptional health

Be warm, encouraging, and specific to the ${scoreLabel} category.`;

  const response: any = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

//   if (!response.ok) {
//     throw new Error(`Gemini API error:`);
//   }

  const text: any = response.text;
  console.log("the data is:" , text)
//   const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Parse JSON from response (strip markdown fences if present)
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const parsed = JSON.parse(cleaned);

  return {
    summary: parsed.summary || "",
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [],
    lifestyle: parsed.lifestyle || "",
    nutrition: parsed.nutrition || "",
    supplement: parsed.supplement || "",
  };
}

function generatePDFHTML(params: {
  name: string;
  phone: string;
  email: string;
  score: number;
  date: string;
  aiContent: AIContent;
}): string {
  const { name, phone, email, score, date, aiContent } = params;
  const scoreInfo = getScoreInfo(score);

  const progressPercent = Math.max(
    0,
    Math.min(100, ((score - 100) / 900) * 100),
  );

  const recs = aiContent.recommendations
    .map(
      (r, i) => `
    <div style="display:flex;gap:12px;align-items:flex-start;padding:10px;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.06);">
      <div style="width:22px;height:22px;border-radius:50%;background:${scoreInfo.hex}30;color:${scoreInfo.hex};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;flex-shrink:0;margin-top:2px;">${i + 1}</div>
      <span style="color:rgba(255,255,255,0.65);font-size:13px;line-height:1.5;">${r}</span>
    </div>
  `,
    )
    .join("");

  const factors = [
    { emoji: "🥗", n: 1, title: "Nutrition", text: aiContent.nutrition },
    { emoji: "☀️", n: 2, title: "Lifestyle", text: aiContent.lifestyle },
    {
      emoji: "🏃",
      n: 3,
      title: "Fitness",
      text: "Being in your optimal shape helps your body with nutrient distribution. People who have a higher Body Mass Index (BMI) tend to have lower scores.",
    },
    { emoji: "💊", n: 4, title: "Supplement", text: aiContent.supplement },
  ]
    .map(
      (f) => `
    <div style="display:flex;gap:16px;padding:14px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px;">
      <div style="width:52px;height:52px;border-radius:10px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">${f.emoji}</div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:22px;height:22px;border-radius:6px;background:rgba(255,255,255,0.08);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;">${f.n}</div>
          <span style="color:white;font-size:14px;font-weight:600;">${f.title}</span>
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.6;margin:0;">${f.text}</p>
      </div>
    </div>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'DM Sans', sans-serif;
    width: 800px;
    background: #080c18;
    color: #ffffff;
    min-height: 100vh;
    padding: 24px;
  }
  .header {
    text-align: center;
    padding: 40px 40px 24px;
    background: linear-gradient(180deg, ${scoreInfo.hex}18 0%, transparent 100%);
    border-bottom: 1px solid ${scoreInfo.hex}30;
  }
  .brand { display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:20px; }
  .brand-icon { width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#60a5fa,#a855f7);display:flex;align-items:center;justify-content:center; }
  .score-label { color:${scoreInfo.hex}aa;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px; }
  .client-name { font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:white;margin-bottom:4px; }
  .report-date { color:rgba(255,255,255,0.4);font-size:13px; }
  .section { padding: 24px 40px; }
  .score-badge { display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:50px;background:${scoreInfo.hex}20;color:${scoreInfo.hex};font-size:14px;font-weight:600;margin-bottom:10px; }
  .score-dot { width:8px;height:8px;border-radius:50%;background:${scoreInfo.hex}; }
  .score-desc { color:rgba(255,255,255,0.5);font-size:14px;text-align:center; }
  .progress-track { background:#111827;border-radius:12px;padding:16px;border:1px solid rgba(255,255,255,0.06);margin-top:16px; }
  .progress-labels { display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:8px; }
  .progress-bar-bg { height:10px;border-radius:5px;background:rgba(255,255,255,0.05);overflow:hidden;position:relative; }
  .progress-bar-fill { height:100%;border-radius:5px;background:linear-gradient(90deg,${scoreInfo.hex}88,${scoreInfo.hex});width:${progressPercent}%; }
  .contact-row { margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-size:11px;display:flex;gap:16px; }
  .ai-box { background:${scoreInfo.hex}0d;border:1px solid ${scoreInfo.hex}30;border-radius:14px;padding:20px;margin-bottom:24px; }
  .ai-tag { font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${scoreInfo.hex};font-weight:600;margin-bottom:12px; }
  .ai-text { color:rgba(255,255,255,0.7);font-size:13px;line-height:1.7; }
  .section-title { font-size:11px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.4);margin-bottom:14px; }
  .factors-title { font-size:15px;font-weight:600;color:white;margin-bottom:16px; }
  .footer { padding:20px 40px;text-align:center;border-top:1px solid ${scoreInfo.hex}20;background:${scoreInfo.hex}08; }
  .footer-text { font-size:11px;color:rgba(255,255,255,0.3);line-height:1.8; }
</style>
</head>
<body style="margin:0;padding:0;background:#080c18;">
<div style="
    background:#080c18;
    color:#ffffff;
    width:800px;
    min-height:1000px;
    padding:24px;
  ">
<div class="header">
  <div class="brand">
    <div class="brand-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
    </div>
    <div style="text-align:left;">
      <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:3px;text-transform:uppercase;">Nu Skin</div>
      <div style="font-size:13px;font-weight:600;">PRYSM Antioxidant Scan</div>
    </div>
  </div>
  <div class="score-label">PRYSM Score</div>
  <div class="client-name">${name}</div>
  <div class="report-date">${date}</div>
</div>

<div class="section" style="text-align:center;padding-bottom:16px;">
  <div style="font-family:'Playfair Display',serif;font-size:64px;font-weight:700;color:white;text-shadow:0 0 30px ${scoreInfo.hex}60;margin:16px 0 8px;">${score}</div>
  <div class="score-badge">
    <div class="score-dot"></div>
    You Scored ${scoreInfo.label}
  </div>
  <div class="score-desc">This score is associated with ${scoreInfo.description.toLowerCase()}</div>
  
  <div class="progress-track" style="margin-top:20px;">
    <div class="progress-labels"><span>100 • LOW</span><span>HIGH • 1000</span></div>
    <div class="progress-bar-bg">
      <div class="progress-bar-fill"></div>
    </div>
    ${phone || email ? `<div class="contact-row">${phone ? `<span>📞 ${phone}</span>` : ""}${email ? `<span>✉ ${email}</span>` : ""}</div>` : ""}
  </div>
</div>

<div class="section" style="padding-top:0;">
  <div class="ai-box">
    <div class="ai-tag">✦ AI Health Analysis</div>
    <div class="ai-text">${aiContent.summary}</div>
  </div>
  
  <div class="section-title">Recommendations</div>
  ${recs}
</div>

<div class="section" style="padding-top:0;">
  <div class="factors-title">Factors that May Influence Your Score</div>
  ${factors}
</div>

<div class="footer">
  <div class="footer-text">
    <strong style="color:rgba(255,255,255,0.5);">Nu Skin PRYSM Scanner</strong><br>
    This report is for informational purposes only and does not constitute medical advice.<br>
    Generated on ${date}
  </div>
</div>
</div>
</body>
</html>`;
}

const client = new MongoClient(process.env.MONGO_URL!, {
  serverApi: ServerApiVersion.v1,
});

async function getDb() {
  await client.connect();
  return client.db("prysm").collection("reports");
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
      action,
      aiContent: existingContent,
      ...rest
    } = body;

    // If action is 'pdf', generate the PDF HTML and return it

    if (action === "pdf" && existingContent) {
      const html = generatePDFHTML({
        name,
        score,
        date: rest.date || new Date().toLocaleDateString("en-IN"),
        phone: rest.phone || "",
        email: rest.email || "",
        aiContent: existingContent,
      });

      return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    const collection = await getDb();

    // Look for existing record by email or phone
    const existing = await collection.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    // Generate AI content
    // const aiContent = await generateWithGemini(name, score, scoreLabel);
    const aiContent = content;

    if (existing) {
      // Update existing record with latest scan
      await collection.updateOne(
        { _id: existing._id },
        {
          $set: { name, score, scoreLabel, aiContent, updatedAt: new Date() },
          $push: {
            history: {
              score,
              scoreLabel,
              aiContent,
              scannedAt: new Date(),
            },
          } as any,
        }
      );

      return NextResponse.json({ aiContent, uuid: existing.uuid });
    }

    // Create new record
    const uuid = uuidv4();
    await collection.insertOne({
      uuid,
      name,
      email,
      phone,
      score,
      scoreLabel,
      aiContent,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [{ score, scoreLabel, aiContent, scannedAt: new Date() }],
    });

    return NextResponse.json({ aiContent, uuid });
  } catch (err: any) {
    console.error("Generate report error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate report" },
      { status: 500 },
    );
  }
}


const content ={
  "summary": "Hari, your PRYSM score of 200 places you in the Orange category, indicating that your antioxidant defense system is currently at a lower level and requires urgent attention. This score suggests your body has limited protection against oxidative stress, making it vital to start prioritizing nutrient-dense habits immediately.",
  "recommendations": [
    "Increase your daily intake of colorful fruits and vegetables to at least 7-9 servings to boost carotenoid levels.",
    "Incorporate healthy fats like avocado or olive oil into meals to significantly improve the absorption of fat-soluble antioxidants.",
    "Minimize exposure to environmental stressors such as cigarette smoke and excessive UV rays which deplete your current reserves.",
    "Establish a consistent 60-day routine with high-quality supplementation and then re-scan to track your improvement.",
    "Prioritize restorative sleep of 7-9 hours per night to allow your body to repair cellular damage more effectively."
  ],
  "lifestyle": "At the Orange level, it is critical to evaluate lifestyle factors like high stress or sedentary habits that may be contributing to increased oxidative damage. Small, immediate shifts toward moderate daily movement and better stress management can help create a more favorable environment for your antioxidant scores to rise.",
  "nutrition": "Your primary focus should be on a 'rainbow diet' rich in deep reds, oranges, and dark greens, as these contain the specific carotenoids measured by the PRYSM scanner. Reducing processed sugars and refined grains is also essential, as these foods can promote inflammation and further lower your body's defensive capacity.",
  "supplement": "Pharmanex LifePak Elements is an ideal solution for your current score because it provides a foundational boost of essential micronutrients and bioavailable antioxidants that your diet may be missing. By consistently taking these supplements, you provide your body with the concentrated nutrients necessary to move out of the Orange category and toward a more protective score range."
}