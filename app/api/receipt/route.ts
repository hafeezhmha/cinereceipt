import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const year = searchParams.get('year');

    if (!username || !year) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Security: Prevent path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    // Use /tmp on Vercel, local receipts directory otherwise
    const isVercel = process.env.VERCEL === '1';
    const baseDir = isVercel ? '/tmp' : process.cwd();
    const filePath = path.join(baseDir, 'receipts', username, `${year}.json`);

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        try {
            const json = JSON.parse(data);
            return NextResponse.json(json);
        } catch (e) {
            return NextResponse.json({ error: 'Corrupt data' }, { status: 500 });
        }
    } else {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }
}
