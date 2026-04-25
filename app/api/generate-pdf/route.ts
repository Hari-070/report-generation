import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, phone, email, score } = await req.json();

  const params = new URLSearchParams({
    name,
    phone,
    email,
    score: score.toString(),
  });
  const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report?${params.toString()}`;

  let browser;

  if (process.env.VERCEL) {
    const chromium = await import("@sparticuz/chromium-min");
    const puppeteer = await import("puppeteer-core");
    browser = await puppeteer.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar",
      ),
      headless: true,
      defaultViewport: { width: 1280, height: 800 },
    });
  } else {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.default.launch({
      headless: true,
      defaultViewport: { width: 1280, height: 800 },
    });
  }

  const page = await browser.newPage();

  await page.goto(reportUrl, { waitUntil: "networkidle0", timeout: 30000 });

  await page.waitForSelector(".print-only", { timeout: 20000 });
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const pdf:any = await page.pdf({
    format: "A4",
    printBackground: false,
    margin: { top: "6mm", bottom: "6mm", left: "8mm", right: "8mm" },
  });

  await browser.close();

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="PRYSM-Report-${name}.pdf"`,
    },
  });
}
