import { ReceiptData } from '../types';

export default function Receipt({ data }: { data: ReceiptData }) {
    const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const maxMonthlyCount = Math.max(...Object.values(data.monthly_breakdown));

    return (
        <div id="receipt" className="bg-[#fcfaf7] text-neutral-900 font-['var(--font-jetbrains-mono)'] p-8 w-[420px] mx-auto shadow-2xl relative leading-tight border-4 border-neutral-900/10 rounded-lg">
            {/* Receipt Header */}
            <div className="text-center mb-6 space-y-2">
                <div className="text-xs text-neutral-400 uppercase tracking-[0.3em] font-['var(--font-jetbrains-mono)']">━━━━━━━━━━━━━━━━━━━━━━━</div>
                <h1 className="text-3xl font-['var(--font-space-grotesk)'] font-black tracking-tighter uppercase mb-1 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">CINE-RECEIPT</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-600 font-['var(--font-jetbrains-mono)'] font-semibold">@{data.username}</p>
                <div className="inline-flex items-center gap-2 mt-3 border-2 border-neutral-900 px-4 py-1.5 rounded-full shadow-sm bg-white">
                  <span className="text-xs text-neutral-500 font-['var(--font-space-grotesk)'] font-bold">YEAR</span>
                  <span className="text-xl font-['var(--font-space-grotesk)'] font-black">{data.year}</span>
                </div>
                <div className="text-xs text-neutral-400 uppercase tracking-[0.3em] font-['var(--font-jetbrains-mono)']">━━━━━━━━━━━━━━━━━━━━━━━</div>
            </div>

            {/* Totals Section with Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-3 text-center">
                    <div className="text-3xl font-['var(--font-space-grotesk)'] font-black text-orange-600">{data.totals.films}</div>
                    <div className="text-xs uppercase font-['var(--font-jetbrains-mono)'] font-bold text-neutral-600 mt-1">Films</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-3xl font-['var(--font-space-grotesk)'] font-black text-blue-600">{formatTime(data.totals.minutes)}</div>
                    <div className="text-xs uppercase font-['var(--font-jetbrains-mono)'] font-bold text-neutral-600 mt-1">Watch Time</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-3 text-center">
                    <div className="text-3xl font-['var(--font-space-grotesk)'] font-black text-purple-600">{data.totals.rewatches}</div>
                    <div className="text-xs uppercase font-['var(--font-jetbrains-mono)'] font-bold text-neutral-600 mt-1">Rewatches</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-lg p-3 text-center">
                    <div className="text-3xl font-['var(--font-space-grotesk)'] font-black text-amber-600">{data.totals.average_rating} ★</div>
                    <div className="text-xs uppercase font-['var(--font-jetbrains-mono)'] font-bold text-neutral-600 mt-1">Avg Rating</div>
                </div>
            </div>

            <div className="border-b-2 border-dashed border-neutral-300 my-5"></div>

            {/* Top Directors */}
            {data.top_directors.length > 0 && (
                <div className="mb-5">
                    <h3 className="font-['var(--font-space-grotesk)'] font-black text-sm uppercase mb-3 tracking-wider flex items-center gap-2">
                        <span className="text-orange-600">🎬</span> Top Directors
                    </h3>
                    <div className="space-y-2">
                        {data.top_directors.slice(0, 5).map((d, i) => (
                            <div key={i} className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2 border border-neutral-200">
                                <span className="text-xs font-['var(--font-inter)'] font-semibold uppercase truncate pr-2">
                                    <span className="text-orange-600 font-['var(--font-space-grotesk)'] font-black">{i + 1}.</span> {d.name}
                                </span>
                                <span className="text-xs font-['var(--font-space-grotesk)'] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{d.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border-b-2 border-dashed border-neutral-300 my-5"></div>

            {/* Top Actors */}
            {data.top_actors.length > 0 && (
                <div className="mb-5">
                    <h3 className="font-['var(--font-space-grotesk)'] font-black text-sm uppercase mb-3 tracking-wider flex items-center gap-2">
                        <span className="text-blue-600">🎭</span> Top Actors
                    </h3>
                    <div className="space-y-2">
                        {data.top_actors.slice(0, 5).map((a, i) => (
                            <div key={i} className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2 border border-neutral-200">
                                <span className="text-xs font-['var(--font-inter)'] font-semibold uppercase truncate pr-2">
                                    <span className="text-blue-600 font-['var(--font-space-grotesk)'] font-black">{i + 1}.</span> {a.name}
                                </span>
                                <span className="text-xs font-['var(--font-space-grotesk)'] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border-b-2 border-dashed border-neutral-300 my-5"></div>

            {/* Top Films */}
            {data.top_films.length > 0 && (
                <div className="mb-5">
                    <h3 className="font-['var(--font-space-grotesk)'] font-black text-sm uppercase mb-3 tracking-wider flex items-center gap-2">
                        <span className="text-amber-600">⭐</span> Highest Rated
                    </h3>
                    <div className="space-y-2">
                        {data.top_films.slice(0, 5).map((f, i) => (
                            <div key={i} className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2 border border-neutral-200">
                                <span className="text-xs font-['var(--font-inter)'] font-semibold uppercase truncate pr-2 max-w-[70%]">
                                    <span className="text-amber-600 font-['var(--font-space-grotesk)'] font-black">{i + 1}.</span> {f.title}
                                </span>
                                <span className="text-xs font-['var(--font-space-grotesk)'] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">{f.rating} ★</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border-b-2 border-dashed border-neutral-300 my-5"></div>

            {/* Monthly Breakdown with Bar Chart */}
            <div className="mb-5">
                <h3 className="font-['var(--font-space-grotesk)'] font-black text-sm uppercase mb-3 tracking-wider flex items-center gap-2">
                    <span className="text-purple-600">📊</span> Monthly Activity
                </h3>
                <div className="space-y-1.5">
                    {Object.entries(data.monthly_breakdown).map(([month, count]) => {
                        const percentage = maxMonthlyCount > 0 ? (count / maxMonthlyCount) * 100 : 0;
                        return (
                            <div key={month} className="flex items-center gap-2">
                                <span className="text-[10px] font-['var(--font-jetbrains-mono)'] font-bold uppercase text-neutral-500 w-8">{month.substring(0, 3)}</span>
                                <div className="flex-1 bg-neutral-200 rounded-full h-5 overflow-hidden relative">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                        style={{ width: `${Math.max(percentage, count > 0 ? 15 : 0)}%` }}
                                    >
                                        {count > 0 && <span className="text-[10px] font-['var(--font-space-grotesk)'] font-black text-white">{count}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-dashed border-neutral-300 mt-6 pt-5 text-center space-y-2">
                <div className="text-xs text-neutral-400 uppercase tracking-[0.3em] font-['var(--font-jetbrains-mono)']">━━━━━━━━━━━━━━━━━━━━━━━</div>
                <p className="font-['var(--font-space-grotesk)'] font-black text-xs tracking-wider text-neutral-600">THANK YOU FOR WATCHING</p>
                <p className="text-[10px] uppercase font-['var(--font-jetbrains-mono)'] font-bold text-neutral-400">Generated by Cine-Receipt</p>
                <p className="text-[10px] font-['var(--font-jetbrains-mono)'] text-neutral-300">{new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
}
