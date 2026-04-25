import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: NextRequest) {
  const { name, phone, email, score } = await req.json();

  const params = new URLSearchParams({ name, phone, email, score: score.toString() });
  const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report?${params.toString()}`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for AI content to finish loading
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