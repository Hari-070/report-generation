import { NextRequest, NextResponse } from "next/server";
import { getScoreInfo } from "@/lib/score";
import puppeteer from "puppeteer";
import { GoogleGenAI } from "@google/genai";
import { MongoClient, ServerApiVersion } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";

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
  console.log("the data is:", text);
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

const client = new MongoClient(process.env.MONGO_URL!, {
  serverApi: ServerApiVersion.v1,
});

async function getDb() {
  await client.connect();
  return client.db("prysm").collection("reports");
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const agentId = session.user.id; // every record tagged to this agent

    const body = await req.json();
    const {
      name,
      email,
      phone,
      score,
      scoreLabel,
      ts, // 1. add this
      action,
      aiContent: existingContent,
      ...rest
    } = body;

    const collection = await getDb();

    // 2. Add this block — early return if reload
    if (ts) {
      const existingTs = await collection.findOne({
        agentId,
        $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
        "history.ts": ts,
      });

      if (existingTs) {
        const scan = existingTs.history.find((h: any) => h.ts === ts);
        return NextResponse.json({
          aiContent: scan.aiContent,
          uuid: existingTs.uuid,
        });
      }
    }

    // Look for existing record by email or phone
    const existing = await collection.findOne({
      agentId, // scope to agent
      $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    });

    // Generate AI content
    const aiContent = await generateWithGemini(name, score, scoreLabel);

    if (existing) {
      await collection.updateOne(
        { _id: existing._id },
        {
          $set: { name, score, scoreLabel, aiContent, updatedAt: new Date() },
          $push: {
            history: {
              score,
              scoreLabel,
              aiContent,
              ts, // 3. add ts here
              scannedAt: new Date(),
            },
          } as any,
        },
      );
      return NextResponse.json({ aiContent, uuid: existing.uuid });
    }

    const uuid = uuidv4();
    await collection.insertOne({
      uuid,
      agentId, // tag with agentId
      name,
      email,
      phone,
      score,
      scoreLabel,
      aiContent,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [{ score, scoreLabel, aiContent, ts, scannedAt: new Date() }], // 3. add ts here too
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

const content = {
  summary:
    "Hari, your PRYSM score of 200 places you in the Orange category, indicating that your antioxidant defense system is currently at a lower level and requires urgent attention. This score suggests your body has limited protection against oxidative stress, making it vital to start prioritizing nutrient-dense habits immediately.",
  recommendations: [
    "Increase your daily intake of colorful fruits and vegetables to at least 7-9 servings to boost carotenoid levels.",
    "Incorporate healthy fats like avocado or olive oil into meals to significantly improve the absorption of fat-soluble antioxidants.",
    "Minimize exposure to environmental stressors such as cigarette smoke and excessive UV rays which deplete your current reserves.",
    "Establish a consistent 60-day routine with high-quality supplementation and then re-scan to track your improvement.",
    "Prioritize restorative sleep of 7-9 hours per night to allow your body to repair cellular damage more effectively.",
  ],
  lifestyle:
    "At the Orange level, it is critical to evaluate lifestyle factors like high stress or sedentary habits that may be contributing to increased oxidative damage. Small, immediate shifts toward moderate daily movement and better stress management can help create a more favorable environment for your antioxidant scores to rise.",
  nutrition:
    "Your primary focus should be on a 'rainbow diet' rich in deep reds, oranges, and dark greens, as these contain the specific carotenoids measured by the PRYSM scanner. Reducing processed sugars and refined grains is also essential, as these foods can promote inflammation and further lower your body's defensive capacity.",
  supplement:
    "Pharmanex LifePak Elements is an ideal solution for your current score because it provides a foundational boost of essential micronutrients and bioavailable antioxidants that your diet may be missing. By consistently taking these supplements, you provide your body with the concentrated nutrients necessary to move out of the Orange category and toward a more protective score range.",
};
