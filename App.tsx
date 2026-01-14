
import React, { useState } from 'react';
import { AppState, Trend, GroundingSource } from './types';
import { researchCurrentTrends, generateTrendVisualization } from './services/geminiService';

const Header = () => (
  <header className="bg-slate-900 border-b border-white/10 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">BrandVision <span className="text-indigo-400">Pro</span></h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Trend Intelligence & Visualization</p>
        </div>
      </div>
    </div>
  </header>
);

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setAppState(AppState.IDLE);
        setTrends([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!originalImage) return;
    
    setAppState(AppState.RESEARCHING);
    setError(null);

    try {
      const result = await researchCurrentTrends();
      if (result.trends.length === 0) {
        throw new Error("Could not identify specific trends at this moment.");
      }
      setTrends(result.trends);
      setSources(result.sources);
      setAppState(AppState.VISUALIZING);

      const updatedTrends = [...result.trends];
      for (let i = 0; i < updatedTrends.length; i++) {
        try {
          const imageUrl = await generateTrendVisualization(originalImage, updatedTrends[i].visualPrompt);
          updatedTrends[i] = { ...updatedTrends[i], imageUrl, loading: false };
          setTrends([...updatedTrends]);
        } catch (imgErr) {
          updatedTrends[i] = { ...updatedTrends[i], error: 'Visual fail', loading: false };
          setTrends([...updatedTrends]);
        }
      }
      setAppState(AppState.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Market analysis failed. Please check your connection and try again.");
      setAppState(AppState.IDLE);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Real-time Market Context Enabled
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-4 tracking-tight">
            Visualize Your Brand in <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Current Culture</span>
          </h2>
          <p className="text-slate-400 text-center max-w-2xl text-lg">
            Don't just mock up. Research what's winning in the last 30 days and see your product perfectly staged in those trending aesthetics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Upload Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 sticky top-24 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">1. Upload Product</h3>
              <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 transition-all min-h-[250px] bg-slate-800/50 flex flex-col items-center justify-center p-4">
                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                {originalImage ? (
                  <img src={originalImage} alt="Input" className="max-h-[300px] w-full object-contain rounded-lg shadow-lg" />
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-300">Drop brand asset here</p>
                  </div>
                )}
              </div>

              {originalImage && (
                <button 
                  onClick={startAnalysis}
                  disabled={appState !== AppState.IDLE}
                  className="w-full mt-8 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 group"
                >
                  {appState === AppState.IDLE ? (
                    <>
                      Discover & Visualize
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {appState === AppState.RESEARCHING ? 'Researching Trends...' : 'Applying Aesthetics...'}
                    </>
                  )}
                </button>
              )}
              {error && <p className="text-red-400 text-sm mt-4 text-center bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8 space-y-12">
            {appState === AppState.IDLE && !originalImage && (
              <div className="h-[500px] rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600">
                <p className="text-lg font-medium">Visualization results will appear after research</p>
              </div>
            )}

            {appState === AppState.RESEARCHING && (
               <div className="bg-slate-900/50 rounded-[2.5rem] border border-white/5 p-12 text-center space-y-6 animate-pulse">
                  <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                  <h3 className="text-2xl font-bold text-white">Scanning Global Trends...</h3>
                  <p className="text-slate-400 max-w-md mx-auto">We're using Google Search to identify the most impactful visual aesthetics from the last 30 days.</p>
               </div>
            )}

            {trends.map((trend, idx) => (
              <div key={trend.id} className="bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-8 md:p-12 space-y-6 flex flex-col justify-center">
                    <div>
                      <span className="text-indigo-400 text-xs font-black uppercase tracking-widest block mb-2">Trend Analysis 0{idx + 1}</span>
                      <h3 className="text-3xl font-black text-white leading-tight">{trend.title}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">The Story</h4>
                      <p className="text-slate-300 leading-relaxed text-lg italic">
                        "{trend.story}"
                      </p>
                    </div>

                    {sources.length > 0 && (
                      <div className="pt-4 border-t border-white/5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Verification Sources</h4>
                        <div className="flex flex-wrap gap-2">
                          {sources.slice(0, 3).map((source, sIdx) => (
                            <a 
                              key={sIdx}
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.827a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              {source.title.length > 20 ? source.title.substring(0, 20) + '...' : source.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-800 relative group overflow-hidden flex items-center justify-center min-h-[450px]">
                    {trend.loading && !trend.imageUrl ? (
                      <div className="flex flex-col items-center gap-4 p-8 text-center">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">Rendering Trend Aesthetic...</p>
                        <p className="text-[10px] text-slate-500 italic max-w-xs">Applying: {trend.visualPrompt.substring(0, 100)}...</p>
                      </div>
                    ) : trend.error ? (
                      <div className="p-8 text-center">
                        <p className="text-red-400 text-sm">{trend.error}</p>
                      </div>
                    ) : (
                      <>
                        <img src={trend.imageUrl} alt={trend.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex items-end">
                           <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = trend.imageUrl!;
                              link.download = `${trend.title.replace(/\s+/g, '-').toLowerCase()}.png`;
                              link.click();
                            }}
                            className="w-full py-3 bg-white text-slate-950 font-black rounded-xl text-sm shadow-2xl hover:bg-indigo-50 transition-colors"
                           >
                            Export 4K Asset
                           </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
            BrandVision Pro Intelligence System • Powered by Google Search Grounding & Gemini 2.5
          </p>
        </div>
      </footer>
    </div>
  );
}
