import { NextResponse } from 'next/server';

/**
 * Proxy route for local Python API development
 * In production (Vercel), the Python serverless function handles /api/ingest directly
 * In development, this proxies to the local Python server on port 5328
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // In development, proxy to local Python server
        const pythonApiUrl = 'http://localhost:5328/api/ingest';

        const response = await fetch(pythonApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to connect to Python API', message: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    return NextResponse.json({
        message: "Letterboxd data ingestion API",
        method: "POST",
        body: { username: "string", year: "number" }
    });
}
