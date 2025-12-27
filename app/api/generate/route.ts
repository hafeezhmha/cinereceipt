import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execPromise = util.promisify(exec);

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

        // Run Python Script with venv python
        const scriptPath = path.join(cwd, 'ingest.py');
        const pythonPath = path.join(cwd, 'venv', 'bin', 'python3');
        const pythonCmd = fs.existsSync(pythonPath) ? pythonPath : 'python3';

        console.log(`Running ingestion script: ${pythonCmd} ${scriptPath} ${username} ${year}`);

        try {
            const { stdout, stderr } = await execPromise(`${pythonCmd} ${scriptPath} ${username} ${year}`, {
                timeout: 300000, // 5 minute timeout (for users with 100+ films)
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                env: {
                    ...process.env,
                    GROQ_API_KEY: process.env.GROQ_API_KEY || ''
                }
            });
            if (stderr) console.warn("Script stderr:", stderr);
            console.log("Script stdout:", stdout);
        } catch (execErr: any) {
            console.error("Exec error:", execErr);

            // Check if it's a timeout
            if (execErr.killed || execErr.signal === 'SIGTERM') {
                throw new Error(`This is taking longer than expected. The user might have many films logged. Please try again - cached results load instantly!`);
            }

            throw new Error(`Python execution failed: ${execErr.message}`);
        }

        // Verify output
        if (fs.existsSync(filePath)) {
            // Check if the file contains an error
            const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (fileContent.error) {
                // Delete the error file
                fs.unlinkSync(filePath);
                return NextResponse.json({
                    status: 'failed',
                    error: fileContent.message || 'Failed to fetch data'
                }, { status: 400 });
            }

            console.log(`Success: Generated ${filePath}`);
            return NextResponse.json({ status: 'ready', cached: false });
        } else {
            console.error(`Error: File not found at ${filePath}`);
            return NextResponse.json({ status: 'failed', error: 'Output file not created' }, { status: 500 });
        }

    } catch (error: any) {
        console.error("API Error context:", error);
        return NextResponse.json({ status: 'failed', error: error.message || 'Unknown error' }, { status: 500 });
    }
}
