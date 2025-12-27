import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, year } = body;

        if (!username || !year) {
            return NextResponse.json({ error: 'Missing username or year' }, { status: 400 });
        }

        // Sanitize username (alphanumeric, underscore, hyphen)
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
        }

        // Sanitize year
        const yearInt = parseInt(year);
        if (isNaN(yearInt) || yearInt < 2000 || yearInt > 2100) {
            return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
        }

        const cwd = process.cwd();
        const filePath = path.join(cwd, 'receipts', username, `${year}.json`);

        // Check cache
        if (fs.existsSync(filePath)) {
            return NextResponse.json({ status: 'ready', cached: true });
        }

        // Call Python serverless function
        // Use request origin to ensure correct URL on Vercel
        const requestUrl = new URL(request.url);
        const baseUrl = requestUrl.origin;

        console.log(`Calling Python API: ${baseUrl}/api/ingest`);

        try {
            const response = await fetch(`${baseUrl}/api/ingest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, year: yearInt }),
            });

            const contentType = response.headers.get('content-type');

            // Check if we got HTML instead of JSON (404/error page)
            if (contentType && !contentType.includes('application/json')) {
                throw new Error('Python API not available. Use "vercel dev" for local development or deploy to Vercel.');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Python function failed');
            }

            const data = await response.json();

            // Check for user-level errors
            if (data.error) {
                return NextResponse.json({
                    status: 'failed',
                    error: data.message || 'Failed to fetch data'
                }, { status: 400 });
            }

            // Save to cache
            const saveDir = path.join(cwd, 'receipts', username);
            if (!fs.existsSync(saveDir)) {
                fs.mkdirSync(saveDir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            console.log(`Success: Generated ${filePath}`);
            return NextResponse.json({ status: 'ready', cached: false });

        } catch (fetchErr: any) {
            console.error("Fetch error:", fetchErr);
            throw new Error(`Python API call failed: ${fetchErr.message}`);
        }

    } catch (error: any) {
        console.error("API Error context:", error);
        return NextResponse.json({ status: 'failed', error: error.message || 'Unknown error' }, { status: 500 });
    }
}
