import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, List, MessageSquare, Dices, Tv, Star, Bot, Play, X, BarChart3, ExternalLink, BookmarkPlus, Check, Loader2 } from 'lucide-react';
import { useAppState } from '../AppStateContext';
import API_BASE from '../apiBase';

const features = [
  {
    icon: Sparkles,
    title: 'AI Anime Finder',
    description: 'Describe what you feel like watching in plain English. Our AI will find the perfect match from millions of titles.',
    to: '/recommend',
    gradient: 'from-violet-500 to-purple-600',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
  },
  {
    icon: BookOpen,
    title: 'Anime Database',
    description: 'Browse and search every anime on MyAnimeList. Click any title to view its full synopsis, score, studio, and more.',
    to: '/anime',
    gradient: 'from-pink-500 to-rose-600',
    border: 'border-pink-500/30',
    bg: 'bg-pink-500/10',
  },
  {
    icon: List,
    title: 'Watchlist',
    description: 'Save anime to your personal watchlist and track your progress — Plan to Watch, Watching, or Completed.',
    to: '/watchlist',
    gradient: 'from-blue-500 to-cyan-600',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
  },
  {
    icon: MessageSquare,
    title: 'AI Character Chat',
    description: 'Chat with AniSensei about any anime, or put the AI in character mode to roleplay as your favourite character.',
    to: '/chat',
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
];

const chatTeasers = [
  { name: 'Gojo Satoru', anime: 'Jujutsu Kaisen', quote: '"Ask me anything about jujutsu techniques..."', avatar: 'https://static.wikia.nocookie.net/jujutsu-kaisen/images/5/5a/Satoru_Gojo_arrives_on_the_battlefield_%28Anime%29.png/revision/latest?cb=20210226205256' },
  { name: 'Levi Ackerman', anime: 'Attack on Titan', quote: '"Tch. Need tactical advice? Make it quick."', avatar: 'https://media.tenor.com/-F1llo2Z2CIAAAAe/levi-ackerman.png' },
  { name: 'Makima', anime: 'Chainsaw Man', quote: '"Would you like to be my dog?"', avatar: 'https://a.storyblok.com/f/178900/640x360/f1620ef628/217283111bdc353ed6846e215f1b3ea21669148862_main.jpg/m/filters:quality(95)format(webp)' },
  { name: 'Luffy', anime: 'One Piece', quote: '"I\'m gonna be the King of the Pirates!"', avatar: 'https://cdn.myanimelist.net/images/characters/9/310307.jpg' },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const { setChatState, homeState: hs, setHomeState: setHs, animeListState: als, setAnimeListState: setAls } = useAppState();
  
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRandomAnime = async () => {
    setLoadingRandom(true);
    try {
      const res = await fetch('https://api.jikan.moe/v4/random/anime');
      
      if (res.status === 429) {
        showToast('Too many requests. Please wait a moment before rolling again.', 'error');
        setLoadingRandom(false);
        return;
      }
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      if (data && data.data) {
        setHs({ randomAnime: data.data });
      } else {
        throw new Error('Invalid data received from Jikan API');
      }
    } catch (e: any) {
      console.error('Failed to fetch random anime:', e);
      showToast(e.message || 'Failed to roll random anime. Try again later.', 'error');
    }
    setLoadingRandom(false);
  };

  useEffect(() => {
    // Only fetch if not already persisted
    if (!hs.randomAnime) {
      fetchRandomAnime();
    }
    
    if (hs.recommendedAnime.length === 0) {
      const fetchRecs = async () => {
        try {
          // Fetch current season instead of all-time top
          const res = await fetch('https://api.jikan.moe/v4/seasons/now?limit=5');
          const data = await res.json();
          setHs({ recommendedAnime: data.data || [] });
        } catch (e) {
          console.error('Failed to fetch recommendations:', e);
        }
      };
      fetchRecs();
    }
  }, []);

  const handleChatTeaserClick = (name: string, anime: string) => {
    setChatState({ characterContext: `${name} from ${anime}` });
    navigate('/chat');
  };

  const addToWatchlist = async (anime: any, status: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (addingId === anime.mal_id) return;

    setAddingId(anime.mal_id);
    const addedIdsCopy = new Set(als.addedIds);

    try {
      const res = await fetch(`${API_BASE}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          malId: anime.mal_id,
          title: anime.title,
          genre: anime.genres.map((g: any) => g.name).join(', ') || 'Unknown',
          description: anime.synopsis || '',
          rating: anime.score,
          episodes: anime.episodes,
          imageUrl: anime.images.jpg.large_image_url,
          status: status
        }),
      });

      const data = await res.json();

      if (res.ok || res.status === 409) {
        addedIdsCopy.add(anime.mal_id);
        setAls({ addedIds: addedIdsCopy });
        showToast(res.status === 409 ? 'Already in your watchlist!' : 'Added to watchlist!', 'success');
      } else {
        showToast(data.error || 'Failed to add. Is the backend running?', 'error');
      }
    } catch {
      showToast('Cannot connect to backend (port 5000).', 'error');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[70] px-4 py-2.5 rounded-lg shadow-xl border backdrop-blur-md animate-slide-in ${
          toast.type === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          <p className="font-medium text-sm">{toast.message}</p>
        </div>
      )}

      {/* Hero */}
      <div className="relative mb-14 text-center pt-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-anime-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-anime-secondary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-anime-primary/15 border border-anime-primary/30 text-anime-primary text-sm font-medium mb-6">
            <Sparkles size={14} />
            AI-Powered Anime Hub
          </div>

          <h1 className="text-6xl font-bold text-gradient mb-5 leading-tight">
            Welcome to<br />AniSensei
          </h1>

          <p className="text-slate-300 text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Discover, track, and dive deep into the world of anime — powered by artificial intelligence and the full MyAnimeList database.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/anime" className="glass-button flex items-center gap-2 px-8 py-3 text-base">
              <BookOpen size={20} /> Browse Anime
            </Link>
            <Link to="/recommend" className="flex items-center gap-2 px-8 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800/60 hover:border-anime-primary/40 transition-all duration-300 font-medium text-base">
              <Sparkles size={20} /> Ask AI
            </Link>
          </div>
        </div>
      </div>

      {/* New Row: Randomizer & AI Chat Teasers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Random Anime Generator */}
        <div className="glass-panel p-6 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Dices size={120} />
          </div>
          <div className="relative z-10 flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Dices className="text-anime-primary" /> Anime Randomizer
            </h2>
            <button 
              onClick={(e) => { e.stopPropagation(); fetchRandomAnime(); }}
              disabled={loadingRandom}
              className="bg-anime-primary/20 hover:bg-anime-primary/40 text-anime-primary font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loadingRandom ? <span className="animate-spin text-xl">↻</span> : <Dices size={18} />} Roll Again
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative z-10">
            {loadingRandom ? (
              <div className="flex flex-col items-center text-slate-400 gap-3">
                <span className="animate-spin text-3xl">↻</span>
                <p>Finding a random anime...</p>
              </div>
            ) : hs.randomAnime ? (
              <div 
                className="flex gap-5 w-full cursor-pointer hover:bg-slate-800/50 p-3 rounded-xl transition-colors border border-transparent hover:border-anime-primary/30"
                onClick={() => setSelectedAnime(hs.randomAnime)}
              >
                <img src={hs.randomAnime.images.jpg.large_image_url || (hs.randomAnime.images.jpg as any).image_url} alt={hs.randomAnime.title} className="w-32 h-48 object-cover rounded-xl shadow-lg border border-slate-700/50" />
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-lg font-bold text-white line-clamp-2 mb-1 group-hover:text-anime-primary transition-colors">{hs.randomAnime.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {hs.randomAnime.genres?.slice(0,3).map((g: any) => (
                      <span key={g.name} className="text-[10px] uppercase font-semibold text-anime-primary bg-anime-primary/10 px-2 py-0.5 rounded border border-anime-primary/20">{g.name}</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-3 mb-3">{hs.randomAnime.synopsis || 'No synopsis available.'}</p>
                  <div className="flex gap-3 text-xs text-slate-300 font-medium">
                    {hs.randomAnime.score && <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400" /> {hs.randomAnime.score}</span>}
                    {hs.randomAnime.episodes && <span className="flex items-center gap-1"><Tv size={14} className="text-blue-400" /> {hs.randomAnime.episodes} eps</span>}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Failed to load random anime.</p>
            )}
          </div>
        </div>

        {/* AI Character Chat Teasers */}
        <div className="glass-panel p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Bot size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Live AI Chat</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Click a character to jump straight into a roleplay chat with them!</p>
          
          <div className="space-y-3">
            {chatTeasers.map((teaser) => (
              <div 
                key={teaser.name}
                onClick={() => handleChatTeaserClick(teaser.name, teaser.anime)}
                className="group flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-anime-secondary/40 cursor-pointer transition-all duration-300"
              >
                <div className="relative">
                  <img src={teaser.avatar} alt={teaser.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 group-hover:border-anime-secondary transition-colors" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-anime-secondary transition-colors">{teaser.name}</h4>
                    <span className="text-[10px] text-slate-500 uppercase">{teaser.anime}</span>
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    <span className="animate-pulse inline-block w-1.5 h-1.5 bg-anime-secondary rounded-full mr-1.5 mb-0.5"></span>
                    {teaser.quote}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Seasonal Anime Showcase */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Star className="text-yellow-400" /> Must-Watch This Season
          </h2>
          <Link to="/anime" className="text-sm text-anime-primary hover:text-anime-secondary transition-colors font-medium">
            View full database →
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {hs.recommendedAnime.map((anime) => (
            <div 
              key={anime.mal_id} 
              onClick={() => setSelectedAnime(anime)}
              className="relative group overflow-hidden rounded-xl border border-slate-700/50 aspect-[3/4] cursor-pointer"
            >
              <img src={anime.images.jpg.large_image_url} alt={anime.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold text-sm h-10 line-clamp-2 mb-1 group-hover:text-anime-primary transition-colors" title={anime.title}>{anime.title}</h3>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-anime-primary font-semibold">{anime.genres?.[0]?.name || 'Anime'}</span>
                  {anime.score && <span className="text-yellow-400 font-bold flex items-center gap-1"><Star size={10} className="fill-yellow-400"/> {anime.score}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-slate-200 mb-6 text-center">Everything you need in one place</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, description, to, gradient, border }) => (
            <Link
              key={to}
              to={to}
              className={`glass-panel group p-6 flex items-start gap-5 hover:-translate-y-1 transition-all duration-300 hover:${border} hover:shadow-lg`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-1 group-hover:text-white transition-colors">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="glass-panel p-8 text-center bg-gradient-to-r from-anime-primary/10 via-transparent to-anime-secondary/10 border-anime-primary/20">
        <h3 className="text-2xl font-bold text-white mb-2">Ready to find your next anime?</h3>
        <p className="text-slate-400 mb-5">Tell AniSensei what you're in the mood for and let AI do the work.</p>
        <Link to="/recommend" className="glass-button inline-flex items-center gap-2 px-8 py-3 text-base">
          <Sparkles size={20} /> Start with AI Finder
        </Link>
      </div>

      {/* Full Screen Modal for Selected Anime */}
      {selectedAnime && (
        <>
          <div className="fixed inset-0 z-[60] bg-slate-950 overflow-y-auto pointer-events-auto animate-scale-in" onClick={() => setSelectedAnime(null)}>
            <button onClick={() => setSelectedAnime(null)} className="fixed top-4 right-4 md:top-8 md:right-8 z-[70] p-2 md:p-3 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shadow-xl backdrop-blur-md">
              <X size={24} />
            </button>
            <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 min-h-screen flex flex-col md:flex-row gap-8 items-start pt-16 md:pt-12" onClick={(e) => e.stopPropagation()}>
              <div className="w-full md:w-[300px] lg:w-[400px] shrink-0 sticky top-12">
                <img src={selectedAnime.images.jpg.large_image_url} alt={selectedAnime.title} className="w-full h-auto rounded-2xl shadow-2xl border border-slate-700/60 object-contain bg-slate-950" />
                
                <div className="mt-6 space-y-4">
                  <div className="relative group/dropdown">
                    <button
                      onClick={(e) => { e.stopPropagation(); if(!als.addedTitles.has(selectedAnime.title)) addToWatchlist(selectedAnime, 'plan_to_watch', e); }}
                      disabled={als.addedTitles.has(selectedAnime.title) || addingId === selectedAnime.mal_id}
                      className={`w-full flex items-center justify-center gap-2 font-bold px-6 py-4 rounded-xl transition-all duration-300 text-lg ${
                        als.addedTitles.has(selectedAnime.title)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : addingId === selectedAnime.mal_id
                          ? 'bg-anime-primary/20 text-anime-primary border border-anime-primary/30'
                          : 'bg-anime-primary hover:bg-anime-primary/90 text-white shadow-lg shadow-anime-primary/20 hover:shadow-anime-primary/40'
                      }`}
                    >
                      {als.addedTitles.has(selectedAnime.title) ? <><Check size={20} /> Added to Watchlist</> : addingId === selectedAnime.mal_id ? <><Loader2 size={20} className="animate-spin" /> Adding...</> : <><BookmarkPlus size={20} /> Add to Watchlist</>}
                    </button>
                    {!als.addedTitles.has(selectedAnime.title) && (
                      <div className="absolute bottom-full right-0 mb-2 w-full bg-slate-800 rounded-xl shadow-2xl border border-slate-700 hidden group-hover/dropdown:block z-20 overflow-hidden">
                        <button onClick={(e) => addToWatchlist(selectedAnime, 'plan_to_watch', e)} className="w-full text-left px-5 py-3 text-base font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors">Plan to Watch</button>
                        <button onClick={(e) => addToWatchlist(selectedAnime, 'watching', e)} className="w-full text-left px-5 py-3 text-base font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700/50">Watching</button>
                        <button onClick={(e) => addToWatchlist(selectedAnime, 'completed', e)} className="w-full text-left px-5 py-3 text-base font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700/50">Completed</button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    {selectedAnime.trailer?.url && (
                      <a href={selectedAnime.trailer.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-bold">
                        <Play size={18} /> Trailer
                      </a>
                    )}
                    {selectedAnime.url && (
                      <a href={selectedAnime.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-bold">
                        <ExternalLink size={18} /> MAL
                      </a>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-4">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Where to Watch</p>
                    <a href={`https://animesuge.cz/filter?keyword=${encodeURIComponent(selectedAnime.title)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700 hover:border-anime-primary/50 bg-slate-800/50 hover:bg-anime-primary/10 transition-all text-slate-300 hover:text-white font-medium group">
                      <span className="flex items-center gap-2"><Play size={16} className="text-anime-primary group-hover:scale-110 transition-transform" /> AnimeSuge</span>
                      <ExternalLink size={14} className="text-slate-500 group-hover:text-anime-primary transition-colors" />
                    </a>
                    <a href={`https://www.crunchyroll.com/search?q=${encodeURIComponent(selectedAnime.title)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700 hover:border-orange-500/50 bg-slate-800/50 hover:bg-orange-500/10 transition-all text-slate-300 hover:text-white font-medium group">
                      <span className="flex items-center gap-2"><Play size={16} className="text-orange-500 group-hover:scale-110 transition-transform" /> Crunchyroll</span>
                      <ExternalLink size={14} className="text-slate-500 group-hover:text-orange-500 transition-colors" />
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 text-white">
                <h3 className="text-3xl md:text-5xl font-bold mb-2">{selectedAnime.title}</h3>
                {selectedAnime.title_english && selectedAnime.title_english !== selectedAnime.title && (
                  <p className="text-slate-400 text-lg mb-4">{selectedAnime.title_english}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {selectedAnime.genres?.map((g: any) => (
                    <span key={g.name} className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded bg-anime-primary/20 text-anime-primary border border-anime-primary/30">{g.name}</span>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {selectedAnime.score && (
                    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 text-center backdrop-blur-sm">
                      <Star size={20} className="text-yellow-400 fill-yellow-400 mx-auto mb-2" />
                      <p className="text-xl font-bold text-white">{selectedAnime.score}</p>
                      <p className="text-xs text-slate-500 uppercase font-semibold mt-1">Score</p>
                    </div>
                  )}
                  {selectedAnime.rank && (
                    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 text-center backdrop-blur-sm">
                      <BarChart3 size={20} className="text-anime-primary mx-auto mb-2" />
                      <p className="text-xl font-bold text-white">#{selectedAnime.rank}</p>
                      <p className="text-xs text-slate-500 uppercase font-semibold mt-1">Rank</p>
                    </div>
                  )}
                  <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 text-center backdrop-blur-sm">
                    <Tv size={20} className="text-anime-secondary mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">{selectedAnime.episodes || '?'}</p>
                    <p className="text-xs text-slate-500 uppercase font-semibold mt-1">Episodes</p>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><div className="w-1.5 h-6 bg-anime-primary rounded-full"></div>Synopsis</h4>
                  <p className="text-base text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedAnime.synopsis || 'No synopsis available.'}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <h4 className="text-xl font-bold text-white mb-2 sm:col-span-2">Information</h4>
                  {selectedAnime.type && <div className="flex flex-col"><span className="text-slate-400 text-sm">Type</span> <span className="text-white font-medium">{selectedAnime.type}</span></div>}
                  {selectedAnime.status && <div className="flex flex-col"><span className="text-slate-400 text-sm">Status</span> <span className="text-white font-medium">{selectedAnime.status}</span></div>}
                  {selectedAnime.source && <div className="flex flex-col"><span className="text-slate-400 text-sm">Source</span> <span className="text-white font-medium">{selectedAnime.source}</span></div>}
                  {selectedAnime.duration && <div className="flex flex-col"><span className="text-slate-400 text-sm">Duration</span> <span className="text-white font-medium">{selectedAnime.duration}</span></div>}
                  {selectedAnime.year && <div className="flex flex-col"><span className="text-slate-400 text-sm">Year</span> <span className="text-white font-medium">{selectedAnime.year}</span></div>}
                  {selectedAnime.studios?.length > 0 && <div className="flex flex-col"><span className="text-slate-400 text-sm">Studio</span> <span className="text-white font-medium">{selectedAnime.studios.map((s: any) => s.name).join(', ')}</span></div>}
                  {selectedAnime.aired?.string && <div className="flex flex-col"><span className="text-slate-400 text-sm">Aired</span> <span className="text-white font-medium">{selectedAnime.aired.string}</span></div>}
                  {selectedAnime.rating && <div className="flex flex-col"><span className="text-slate-400 text-sm">Rating</span> <span className="text-white font-medium">{selectedAnime.rating}</span></div>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
