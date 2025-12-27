import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const year = searchParams.get('year');

    if (!username || !year) {
        return new NextResponse('Missing params', { status: 400 });
    }

    try {
        console.log(`Exporting receipt for ${username} (${year})...`);
        const browser = await chromium.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Determine URL
        const host = request.headers.get('host');
        const protocol = (host?.includes('localhost') || host?.includes('127.0.0.1')) ? 'http' : 'https';
        const url = `${protocol}://${host}/receipt-view?username=${username}&year=${year}`;

        console.log(`Navigating to ${url} for export...`);
        await page.goto(url, { waitUntil: 'networkidle' });

        // Locate receipt
        // We'll select the component div.
        // in Receipt.tsx, the outer div has id='receipt' or similar class.
        // I checked Receipt.tsx, it has id="receipt".

        const element = await page.$('#receipt');
        if (!element) {
            console.error('Receipt element not found');
            await browser.close();
            return new NextResponse('Receipt generation failed (element not found)', { status: 500 });
        }

        const buffer = await element.screenshot({ type: 'png' });
        await browser.close();

        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="letterboxd-${username}-${year}.png"`
            }
        });
    } catch (e: any) {
        console.error('Export error:', e);
        return new NextResponse(`Export failed: ${e.message}`, { status: 500 });
    }
}
