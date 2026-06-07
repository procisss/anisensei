import React, { useEffect, useState } from 'react';
import { BookmarkCheck, Trash2, Tv, Star, Eye, Clock, CheckCircle2, Loader2, ListX, Play, ExternalLink, X, Check, BarChart3 } from 'lucide-react';
import API_BASE from '../apiBase';

interface WatchlistAnime {
  id: string;
  title: string;
  genre: string;
  description: string;
  rating: number | null;
  episodes: number | null;
  imageUrl: string | null;
}

interface WatchlistItem {
  id: string;
  status: string;
  progress: number;
  anime: WatchlistAnime;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  plan_to_watch: { label: 'Plan to Watch', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  watching: { label: 'Watching', icon: Eye, color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
};

export const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const [selectedAnimeEpisodes, setSelectedAnimeEpisodes] = useState<any[]>([]);
  const [loadingAnimeId, setLoadingAnimeId] = useState<string | null>(null);

  const handleAnimeClick = async (watchlistId: string, title: string) => {
    setLoadingAnimeId(watchlistId);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
      if (res.ok) {
        const searchData = await res.json();
        if (searchData.data && searchData.data.length > 0) {
          const anime = searchData.data[0];
          setSelectedAnime(anime);
          
          const epsRes = await fetch(`https://api.jikan.moe/v4/anime/${anime.mal_id}/episodes`);
          if (epsRes.ok) {
            const epsData = await epsRes.json();
            setSelectedAnimeEpisodes(epsData.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch anime details:', error);
    } finally {
      setLoadingAnimeId(null);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/watchlist`);
      const data = await res.json();
      setWatchlist(data);
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const removeFromWatchlist = async (id: string) => {
    setRemovingId(id);
    try {
      await fetch(`${API_BASE}/api/watchlist/${id}`, { method: 'DELETE' });
      setWatchlist(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to remove:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/watchlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      setWatchlist(prev => prev.map(item => item.id === id ? { ...item, status: updated.status } : item));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const updateProgress = async (id: string, newProgress: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/watchlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });
      const updated = await res.json();
      setWatchlist(prev => prev.map(item => item.id === id ? { ...item, progress: updated.progress } : item));
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const filtered = filter === 'all' ? watchlist : watchlist.filter(item => item.status === filter);

  const counts = {
    all: watchlist.length,
    plan_to_watch: watchlist.filter(i => i.status === 'plan_to_watch').length,
    watching: watchlist.filter(i => i.status === 'watching').length,
    completed: watchlist.filter(i => i.status === 'completed').length,
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gradient mb-2 flex items-center gap-3">
          <BookmarkCheck className="text-anime-primary" size={36} />
          My Watchlist
        </h2>
        <p className="text-slate-400 text-lg">Track and manage your anime watching progress.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { key: 'all', label: 'Total', count: counts.all, color: 'from-anime-primary/20 to-anime-secondary/20', border: 'border-anime-primary/30' },
          { key: 'plan_to_watch', label: 'Plan to Watch', count: counts.plan_to_watch, color: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30' },
          { key: 'watching', label: 'Watching', count: counts.watching, color: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-500/30' },
          { key: 'completed', label: 'Completed', count: counts.completed, color: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30' },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setFilter(stat.key)}
            className={`p-4 rounded-xl border transition-all duration-300 text-left ${
              filter === stat.key
                ? `bg-gradient-to-br ${stat.color} ${stat.border} shadow-lg`
                : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60'
            }`}
          >
            <p className="text-2xl font-bold text-slate-100">{stat.count}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-anime-primary border-t-transparent animate-spin"></div>
            <p className="text-slate-400">Loading watchlist...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <ListX size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">
            {watchlist.length === 0 ? 'Your watchlist is empty!' : 'No anime in this category.'}
          </p>
          {watchlist.length === 0 && (
            <p className="text-slate-500 text-sm">Go to the Anime List page to browse and add anime to your watchlist.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          {filtered.map((item) => {
            const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.plan_to_watch;

            return (
              <div 
                key={item.id} 
                onClick={() => handleAnimeClick(item.id, item.anime.title)}
                className="glass-panel flex items-center gap-4 p-3 group hover:border-anime-primary/30 transition-all duration-300 cursor-pointer relative"
              >
                {loadingAnimeId === item.id && (
                  <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                    <Loader2 className="animate-spin text-anime-primary" size={24} />
                  </div>
                )}
                {/* Image */}
                <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  {item.anime.imageUrl ? (
                    <img src={item.anime.imageUrl} alt={item.anime.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Tv size={20} className="text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-100 text-sm truncate">{item.anime.title}</h3>
                  <p className="text-[11px] text-anime-primary uppercase tracking-wider font-semibold truncate">{item.anime.genre}</p>
                  
                </div>

                {/* Status Selector */}
                <select
                  value={item.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border appearance-none cursor-pointer ${statusConf.bg} ${statusConf.color} bg-transparent focus:outline-none focus:ring-1 focus:ring-anime-primary`}
                >
                  <option value="plan_to_watch">Plan to Watch</option>
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                </select>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.id); }}
                  disabled={removingId === item.id}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Remove from watchlist"
                >
                  {removingId === item.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Screen Modal */}
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
                      disabled
                      className="w-full flex items-center justify-center gap-2 font-bold px-6 py-4 rounded-xl transition-all duration-300 text-lg bg-green-500/20 text-green-400 border border-green-500/30"
                    >
                      <Check size={20} /> In Your Watchlist
                    </button>
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

                {/* Episodes List */}
                {selectedAnimeEpisodes.length > 0 && (
                  <div className="mt-8 mb-8">
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><div className="w-1.5 h-6 bg-anime-primary rounded-full"></div>Episodes</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedAnimeEpisodes.map(ep => {
                        const watchlistItem = watchlist.find(w => w.anime.title === selectedAnime.title);
                        const isBookmarked = watchlistItem ? watchlistItem.progress >= ep.mal_id : false;
                        return (
                          <div key={ep.mal_id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-2 hover:bg-slate-800/60 transition-colors">
                            <div className="flex justify-between items-start">
                              <span className="text-slate-300 font-bold text-sm">Episode {ep.mal_id}</span>
                              {isBookmarked && <BookmarkCheck size={16} className="text-anime-primary" />}
                            </div>
                            <span className="text-slate-400 text-xs truncate" title={ep.title}>{ep.title}</span>
                            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-700/50">

                              <button 
                                onClick={() => {
                                  if (watchlistItem) {
                                    if (isBookmarked) {
                                      updateProgress(watchlistItem.id, ep.mal_id - 1);
                                    } else {
                                      updateProgress(watchlistItem.id, ep.mal_id);
                                    }
                                  }
                                }}
                                className={`flex-1 flex justify-center items-center gap-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                                  isBookmarked ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white border border-transparent'
                                }`}
                              >
                                {isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
