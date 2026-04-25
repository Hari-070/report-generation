import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export async function POST(req: NextRequest) {
  const { name, phone, email, score } = await req.json();

  const params = new URLSearchParams({ name, phone, email, score: score.toString() });
  const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report?${params.toString()}`;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(
      // Chromium binary hosted remotely — Vercel downloads it at runtime
      'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
    ),
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  await page.waitForFunction(() => {
    const el = document.querySelector('.print-only');
    return el && el.textContent && el.textContent.length > 100;
  }, { timeout: 20000 });

  const pdf:any = await page.pdf({
    format: 'A4',
    printBackground: false,
    margin: { top: '12mm', bottom: '12mm', left: '14mm', right: '14mm' },
  });

  await browser.close();

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="PRYSM-Report-${name}.pdf"`,
    },
  });
}