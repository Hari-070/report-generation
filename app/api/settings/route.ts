import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoClient, ServerApiVersion } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL!, {
  serverApi: ServerApiVersion.v1,
});

async function getAgentsCollection() {
  await client.connect();
  return client.db("prysm").collection("agents");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const agents = await getAgentsCollection();
  const agent = await agents.findOne({ userId: session.user.id });

  return NextResponse.json({
    gmailUser: agent?.gmailUser || '',
    gmailPass: agent?.gmailPass ? '••••••••' : '', // never return real password
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { gmailUser, gmailPass } = await req.json();

  const agents = await getAgentsCollection();
  await agents.updateOne(
    { userId: session.user.id },
    {
      $set: {
        userId: session.user.id,
        gmailUser,
        // Only update password if a new one was entered (not the masked ••••)
        ...(gmailPass && !gmailPass.includes('•') ? { gmailPass } : {}),
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}