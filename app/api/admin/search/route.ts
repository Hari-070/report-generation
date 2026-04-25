import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ServerApiVersion } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL!, {
  serverApi: ServerApiVersion.v1,
});

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";

  await client.connect();
  const collection = client.db("prysm").collection("reports");

  const results = await collection.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { uuid: query },
      { email: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
    ],
  }).sort({ updatedAt: -1 }).limit(20).toArray();

  return NextResponse.json(results);
}