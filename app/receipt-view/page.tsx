import Receipt from '@/components/Receipt';
import fs from 'fs';
import path from 'path';

export default async function ReceiptView({
    searchParams,
}: {
    searchParams: Promise<{ username: string; year: string }>;
}) {
    const { username, year } = await searchParams;

    // Use /tmp on Vercel, local receipts directory otherwise
    const isVercel = process.env.VERCEL === '1';
    const baseDir = isVercel ? '/tmp' : process.cwd();
    const filePath = path.join(baseDir, 'receipts', username, `${year}.json`);

    if (!fs.existsSync(filePath)) {
        return <div className="p-10 font-mono text-red-500">Receipt data not found for {username} ({year})</div>;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    return (
        <div className="flex items-start justify-center min-h-screen bg-transparent p-4">
            <Receipt data={data} />
        </div>
    );
}
