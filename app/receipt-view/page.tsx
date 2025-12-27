import Receipt from '@/components/Receipt';
import fs from 'fs';
import path from 'path';

export default async function ReceiptView({
    searchParams,
}: {
    searchParams: Promise<{ username: string; year: string }>;
}) {
    const { username, year } = await searchParams;
    const filePath = path.join(process.cwd(), 'receipts', username, `${year}.json`);

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
