import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoClient, ServerApiVersion } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL!, {
  serverApi: ServerApiVersion.v1,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await client.connect();
  const db = client.db("prysm");
  const reports = db.collection("reports");

  // Find all records without agentId
  const untagged = await reports.countDocuments({ agentId: { $exists: false } });

  // Tag them all with current agent's ID
  const result = await reports.updateMany(
    { agentId: { $exists: false } },
    { $set: { agentId: session.user.id } }
  );

  return NextResponse.json({
    message: `Migration complete`,
    found: untagged,
    updated: result.modifiedCount,
  });
}