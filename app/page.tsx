'use client';
import { useState } from 'react';
import Receipt from '@/components/Receipt';
import { ReceiptData } from '@/types';

export default function Home() {
  const [username, setUsername] = useState('');
  const [year, setYear] = useState('2024');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState('');
  const [showDNA, setShowDNA] = useState(false);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReceiptData(null);
    setLoadingStatus('Connecting to Letterboxd...');

    try {
      // Step 1: Trigger generation
      const startTime = Date.now();

      // Update status periodically to show it's working
      const statusInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed < 15) {
          setLoadingStatus('Fetching your watched films...');
        } else if (elapsed < 30) {
          setLoadingStatus('Analyzing directors and cast...');
        } else if (elapsed < 60) {
          setLoadingStatus('Crunching the numbers...');
        } else {
          setLoadingStatus('Almost there, this user has many films...');
        }
      }, 5000);

      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ username, year }),
        headers: { 'Content-Type': 'application/json' }
      });

      clearInterval(statusInterval);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      if (data.cached) {
        setLoadingStatus('Loading cached receipt...');
      } else {
        setLoadingStatus('Finalizing your receipt...');
      }

      // Step 2: Fetch the generated data
      const receiptRes = await fetch(`/api/receipt?username=${username}&year=${year}`);
      if (!receiptRes.ok) throw new Error('Receipt not found after generation');

      setLoadingStatus('Printing receipt...');
      const receiptJson = await receiptRes.json();

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      setReceiptData(receiptJson);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white py-16 px-6 flex flex-col items-center selection:bg-orange-500/30 overflow-x-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-b from-orange-500/10 to-transparent blur-3xl -z-10 pointer-events-none"></div>

      {/* Header */}
      <div className="text-center mb-16 space-y-4 max-w-2xl">
        <div className="inline-block px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-500 text-[11px] uppercase tracking-[0.25em] font-['var(--font-space-grotesk)'] font-bold mb-4 animate-pulse shadow-lg shadow-orange-500/20">
          <span className="inline-block mr-1">🎬</span> Powered by Letterboxd
        </div>
        <h1 className="text-6xl md:text-8xl font-['var(--font-space-grotesk)'] font-black tracking-tighter uppercase leading-[0.8] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Cine<span className="text-orange-500">Receipt</span>
        </h1>
        <p className="text-neutral-400 font-['var(--font-inter)'] font-medium text-lg leading-relaxed max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          Transform your year in cinema into a beautiful, shareable receipt.
          Visualize your movies, directors, actors, and viewing patterns.
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-lg relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-amber-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

        <form
          onSubmit={generate}
          className="relative bg-neutral-900/80 backdrop-blur-xl p-4 rounded-[2rem] flex flex-col gap-3 w-full border border-white/10"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="bg-white/5 px-6 py-5 flex-grow font-['var(--font-space-grotesk)'] font-semibold text-xl rounded-2xl outline-none placeholder:text-neutral-500 text-white focus:bg-white/10 focus:ring-2 focus:ring-orange-500/50 transition-all tracking-wide"
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              required
            />
            <div className="flex items-center gap-1 bg-white/5 px-3 py-3 rounded-2xl w-full sm:w-48 focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-orange-500/50 transition-all">
              <button
                type="button"
                onClick={() => setYear(String(Math.max(2011, parseInt(year) - 1)))}
                className="text-white hover:text-orange-500 transition-colors p-1.5 hover:scale-110 active:scale-95 flex-shrink-0"
                aria-label="Previous year"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <input
                className="bg-transparent flex-1 font-['var(--font-space-grotesk)'] font-bold text-xl text-center outline-none text-white w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={year}
                onChange={e => setYear(e.target.value)}
                type="number"
                min="2011"
                max={new Date().getFullYear()}
                required
              />
              <button
                type="button"
                onClick={() => setYear(String(Math.min(new Date().getFullYear(), parseInt(year) + 1)))}
                className="text-white hover:text-orange-500 transition-colors p-1.5 hover:scale-110 active:scale-95 flex-shrink-0"
                aria-label="Next year"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-['var(--font-space-grotesk)'] font-black text-lg py-5 rounded-2xl hover:from-orange-400 hover:to-amber-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 overflow-hidden relative shadow-2xl shadow-orange-500/30 tracking-wide"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
                <span className="text-xs font-bold animate-pulse">{loadingStatus}</span>
              </div>
            ) : (
              'GENERATE RECEIPT'
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="mt-8 bg-red-500/10 text-red-400 p-6 rounded-2xl max-w-md text-center border border-red-500/20 animate-in zoom-in-95 fade-in duration-300">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-sm font-['var(--font-space-grotesk)'] font-bold mb-2">{error}</p>
          <p className="text-xs text-red-300/80 font-['var(--font-inter)']">
            Make sure the username exists on Letterboxd and has logged films.
          </p>
        </div>
      )}

      {/* Result Section */}
      <div className="mt-20 w-full flex flex-col items-center">
        {receiptData ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 slide-in-from-bottom-12 duration-1000 ease-out">
            <div className="relative group">
              <div className="absolute -inset-6 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-700 animate-pulse"></div>
              <div className="relative transform hover:scale-[1.02] transition-transform duration-500 hover:rotate-1">
                <Receipt data={receiptData} />
              </div>
            </div>

            <div className="mt-12 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <button
                className="group relative bg-gradient-to-r from-orange-500 to-amber-500 text-black px-12 py-4 rounded-full font-black text-lg shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:from-orange-400 hover:to-amber-400 transition-all active:scale-95 flex items-center gap-3 mx-auto"
                onClick={() => window.open(`/api/export?username=${username}&year=${year}`, '_blank')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>DOWNLOAD IMAGE</span>
                <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              <p className="text-sm font-bold text-neutral-500 tracking-widest uppercase">Perfect for sharing on social media</p>

              {/* Cinematic DNA Reveal Button */}
              {receiptData?.ai_taste_profile && !showDNA && (
                <button
                  onClick={() => setShowDNA(true)}
                  className="group relative bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-full font-['var(--font-space-grotesk)'] font-black text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:from-purple-400 hover:to-pink-400 transition-all active:scale-95 flex items-center gap-3 mx-auto mt-6"
                >
                  <span>💭</span>
                  <span>What does your Letterboxd say about you?</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}

              <button
                onClick={() => { setReceiptData(null); setUsername(''); setYear('2024'); setShowDNA(false); }}
                className="text-xs text-neutral-600 hover:text-orange-500 transition-colors font-bold uppercase tracking-wider"
              >
                Generate Another →
              </button>
            </div>

            {/* Cinematic DNA Reveal */}
            {showDNA && receiptData?.ai_taste_profile && (
              <div className="mt-16 w-full max-w-3xl mx-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-1000">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition duration-700 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-purple-900/90 via-pink-900/90 to-purple-900/90 backdrop-blur-xl p-10 rounded-3xl border border-purple-500/30 shadow-2xl">
                    <div className="text-center mb-8">
                      <h2 className="text-4xl font-['var(--font-space-grotesk)'] font-black uppercase tracking-tight mb-3 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                        Your Cinematic DNA
                      </h2>
                      <p className="text-purple-300 font-['var(--font-inter)'] text-sm uppercase tracking-[0.2em]">
                        Based on {receiptData.reviews_count || receiptData.totals.films} {receiptData.reviews_count ? 'reviews' : 'films'} analyzed
                      </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                      <p className="text-lg font-['var(--font-inter)'] leading-relaxed text-purple-50">
                        {receiptData.ai_taste_profile}
                      </p>
                    </div>

                    <div className="mt-8 text-center">
                      <button
                        onClick={() => setShowDNA(false)}
                        className="text-purple-300 hover:text-white font-['var(--font-space-grotesk)'] font-bold text-sm uppercase tracking-wider transition-colors"
                      >
                        ← Hide Analysis
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : !loading && (
          <div className="text-neutral-700 text-center space-y-3 opacity-50">
            <div className="text-5xl animate-bounce">🎬</div>
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-neutral-600">Enter your Letterboxd username to begin</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-32 pb-8 text-neutral-600 font-mono text-[10px] uppercase tracking-widest text-center">
        &copy; {new Date().getFullYear()} Cine-Receipt &bull; Not Affiliated with Letterboxd
      </footer>
    </main>
  );
}

