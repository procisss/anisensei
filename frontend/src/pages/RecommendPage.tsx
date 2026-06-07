import React from 'react';
import { Send, Sparkles, Loader2, Bot } from 'lucide-react';
import { useAppState } from '../AppStateContext';
import API_BASE from '../apiBase';

export const RecommendPage = () => {
  const { recommendState: s, setRecommendState: set } = useAppState();
  const [loading, setLoading] = React.useState(false);

  const handleRecommend = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt || s.prompt;
    if (!finalPrompt) return;
    
    if (overridePrompt) {
      set({ prompt: overridePrompt });
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      set({ response: data.result });
    } catch (error: any) {
      set({ response: error.message || "I'm sorry, I couldn't connect to the AI at the moment." });
    }
    setLoading(false);
  };

  const popularTags = [
    "Cyberpunk & Sci-Fi thrillers",
    "High stakes psychological games",
    "Cozy slice of life with romance",
    "Dark fantasy with an anti-hero",
    "Sports anime about underdogs",
    "Isekai but the MC is weak"
  ];

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gradient mb-4 flex items-center gap-3">
          <Sparkles className="text-anime-primary" size={36} />
          AI Anime Finder
        </h2>
        <p className="text-slate-300 text-lg">Describe what you're looking for, and I'll find the perfect anime for you.</p>
      </div>

      <div className="glass-panel p-6 mb-8 flex gap-4">
        <input
          type="text"
          value={s.prompt}
          onChange={(e) => set({ prompt: e.target.value })}
          placeholder="e.g. Anime like Solo Leveling but with magic..."
          className="glass-input flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleRecommend()}
        />
        <button onClick={() => handleRecommend()} disabled={loading} className="glass-button flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          <span>Ask Sensei</span>
        </button>
      </div>

      {s.response ? (
        <div className="glass-panel p-8 flex-1 overflow-auto">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-anime-primary to-anime-secondary flex items-center justify-center shrink-0">
              <Bot size={24} className="text-white" />
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-semibold text-slate-200">Sensei's Recommendations</h3>
              <div className="prose prose-invert prose-p:text-slate-300 prose-headings:text-slate-200 max-w-none whitespace-pre-wrap">
                {s.response}
              </div>
            </div>
          </div>
        </div>
      ) : !loading && (
        <div className="glass-panel p-8 flex-1 flex flex-col items-center justify-center text-center">
          <Bot size={48} className="text-anime-primary/40 mb-4" />
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Not sure what to ask?</h3>
          <p className="text-slate-400 mb-6">Try one of these popular recommendations:</p>
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
            {popularTags.map(tag => (
              <button 
                key={tag}
                onClick={() => handleRecommend(tag)}
                className="px-4 py-2 rounded-full border border-slate-700/50 bg-slate-800/30 text-sm text-slate-300 hover:bg-anime-primary/20 hover:border-anime-primary/40 hover:text-anime-primary transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
