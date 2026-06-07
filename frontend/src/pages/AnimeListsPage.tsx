import React, { useEffect, useCallback } from 'react';
import { Search, Star, Tv, Library, BookmarkPlus, Check, Loader2, ChevronLeft, ChevronRight, TrendingUp, X, Calendar, BarChart3, Play, ExternalLink, Filter } from 'lucide-react';
import { useAppState } from '../AppStateContext';
import API_BASE from '../apiBase';

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  score: number | null;
  episodes: number | null;
  images: { jpg: { large_image_url: string } };
  genres: { name: string }[];
  studios: { name: string }[];
  status: string;
  aired: { string: string } | null;
  rating: string | null;
  rank: number | null;
  type: string | null;
  source: string | null;
  duration: string | null;
  year: number | null;
  trailer: { url: string | null } | null;
  url: string | null;
}

const POPULAR_GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horror' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Supernatural' },
  { id: 41, name: 'Thriller' },
];

export const AnimeListsPage = () => {
  const { animeListState: s, setAnimeListState: set } = useAppState();
  const [selectedAnime, setSelectedAnime] = React.useState<JikanAnime | null>(null);
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [addingId, setAddingId] = React.useState<number | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAnime = useCallback(async (query: string, page: number, genres: number[]) => {
    set({ animeList: [] });
    try {
      let url = '';
      if (!query && genres.length === 0) {
        url = `https://api.jikan.moe/v4/top/anime?page=${page}&limit=24`;
        set({ mode: 'top' });
      } else {
        url = `https://api.jikan.moe/v4/anime?page=${page}&limit=24&sfw=true`;
        if (query) url += `&q=${encodeURIComponent(query)}`;
        if (genres.length > 0) url += `&genres=${genres.join(',')}`;
        if (!query) url += `&order_by=score&sort=desc`;
        set({ mode: 'search' });
      }
      
      const res = await fetch(url);
      const data = await res.json();
      set({ animeList: data.data || [], totalPages: data.pagination?.last_visible_page || 1 });
    } catch (error) {
      console.error('Failed to fetch anime:', error);
    }
  }, [set]);

  // Only fetch on first load if list is empty
  useEffect(() => {
    if (s.animeList.length === 0) {
      fetchAnime(s.searchQuery, s.currentPage, s.selectedGenres);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    set({ searchQuery: s.searchInput.trim(), currentPage: 1 });
    fetchAnime(s.searchInput.trim(), 1, s.selectedGenres);
  };

  const handleShowTop = () => {
    set({ searchInput: '', searchQuery: '', selectedGenres: [], currentPage: 1 });
    fetchAnime('', 1, []);
  };

  const handlePageChange = (page: number) => {
    set({ currentPage: page });
    fetchAnime(s.searchQuery, page, s.selectedGenres);
  };

  const toggleGenre = (genreId: number) => {
    const newGenres = s.selectedGenres.includes(genreId)
      ? s.selectedGenres.filter(id => id !== genreId)
      : [...s.selectedGenres, genreId];
    
    set({ selectedGenres: newGenres, currentPage: 1 });
    fetchAnime(s.searchQuery, 1, newGenres);
  };

  const addToWatchlist = async (anime: JikanAnime, status: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (addingId === anime.mal_id) return;

    setAddingId(anime.mal_id);
    const addedIdsCopy = new Set(s.addedIds);
    const addedTitlesCopy = new Set(s.addedTitles);

    try {
      const res = await fetch(`${API_BASE}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          malId: anime.mal_id,
          title: anime.title,
          genre: anime.genres.map(g => g.name).join(', ') || 'Unknown',
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
        addedTitlesCopy.add(anime.title);
        set({ addedIds: addedIdsCopy, addedTitles: addedTitlesCopy });
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

  const loading = s.animeList.length === 0;

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] px-4 py-2.5 rounded-lg shadow-xl border backdrop-blur-md animate-slide-in ${
          toast.type === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          <p className="font-medium text-sm">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gradient mb-2 flex items-center gap-3">
          <Library className="text-anime-primary" size={36} />
          Anime Database
        </h2>
        <p className="text-slate-400 text-lg">Browse top anime or search by title and genres.</p>
      </div>

      {/* Search Bar & Filters */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              value={s.searchInput}
              onChange={(e) => set({ searchInput: e.target.value })}
              placeholder="Search any anime... (e.g. Naruto, One Piece)"
              className="glass-input pl-12"
            />
          </div>
          <button 
            type="button" 
            onClick={() => setShowFilters(!showFilters)}
            className={`glass-button flex items-center gap-2 !bg-none border transition-colors ${showFilters || s.selectedGenres.length > 0 ? 'border-anime-primary text-anime-primary bg-anime-primary/10' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}
          >
            <Filter size={18} /> Genres {s.selectedGenres.length > 0 && `(${s.selectedGenres.length})`}
          </button>
          <button type="submit" className="glass-button flex items-center gap-2">
            <Search size={18} /> Search
          </button>
          {s.mode === 'search' && (
            <button type="button" onClick={handleShowTop} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2">
              <TrendingUp size={18} /> Top Anime
            </button>
          )}
        </form>

        {/* Genre Toggles */}
        {(showFilters || s.selectedGenres.length > 0) && (
          <div className="glass-panel p-4 animate-slide-in">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-anime-secondary" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Filter by Genre</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_GENRES.map(genre => {
                const isSelected = s.selectedGenres.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border ${
                      isSelected 
                        ? 'bg-anime-primary/20 text-anime-primary border-anime-primary/40 shadow-[0_0_10px_rgba(139,92,246,0.2)]' 
                        : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">
          {s.mode === 'top' ? `🔥 Top Anime — Page ${s.currentPage}` : `🔍 Search Results — Page ${s.currentPage}`}
        </p>
        <p className="text-sm text-slate-500">{s.animeList.length} results</p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-anime-primary border-t-transparent animate-spin"></div>
            <p className="text-slate-400">Loading anime...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8">
            {s.animeList.map((anime) => (
              <div
                key={anime.mal_id}
                onClick={() => setSelectedAnime(anime)}
                className="glass-panel group hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:border-anime-primary/40 hover:shadow-lg hover:shadow-anime-primary/10"
              >
                <div className="relative h-56 overflow-hidden">
                  <img src={anime.images.jpg.large_image_url} alt={anime.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                  {anime.score && (
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-white text-sm">{anime.score}</span>
                    </div>
                  )}
                  {anime.rank && (
                    <div className="absolute top-3 left-3 bg-anime-primary/80 backdrop-blur-md px-2 py-1 rounded-md">
                      <span className="font-bold text-white text-xs">#{anime.rank}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-slate-100 mb-1 h-12 line-clamp-2" title={anime.title}>{anime.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-2 h-4 overflow-hidden">
                    {anime.genres.slice(0, 3).map((g) => (
                      <span key={g.name} className="text-[9px] font-semibold uppercase tracking-wider text-anime-primary bg-anime-primary/10 px-1.5 py-0.5 rounded border border-anime-primary/20">
                        {g.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 flex-1 line-clamp-2 mb-3">{anime.synopsis || 'No description available.'}</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md shrink-0">
                      <Tv size={12} className="text-anime-secondary" />
                      <span>{anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}</span>
                    </div>
                    <div className="relative group/dropdown shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); if(!s.addedTitles.has(anime.title)) addToWatchlist(anime, 'plan_to_watch', e); }}
                        disabled={s.addedTitles.has(anime.title) || addingId === anime.mal_id}
                        className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-300 w-full justify-center ${
                          s.addedTitles.has(anime.title)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                            : addingId === anime.mal_id
                            ? 'bg-anime-primary/20 text-anime-primary border border-anime-primary/30 cursor-wait'
                            : 'bg-anime-primary/10 text-anime-primary border border-anime-primary/30 hover:bg-anime-primary/25'
                        }`}
                      >
                        {s.addedTitles.has(anime.title) ? <><Check size={14} /> Added</> : addingId === anime.mal_id ? <><Loader2 size={14} className="animate-spin" /> ...</> : <><BookmarkPlus size={14} /> Watchlist</>}
                      </button>
                      
                      {!s.addedTitles.has(anime.title) && (
                        <div className="absolute bottom-full right-0 mb-2 w-36 bg-slate-800 rounded-lg shadow-xl border border-slate-700 hidden group-hover/dropdown:block z-20 overflow-hidden">
                          <button onClick={(e) => addToWatchlist(anime, 'plan_to_watch', e)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">Plan to Watch</button>
                          <button onClick={(e) => addToWatchlist(anime, 'watching', e)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700/50">Watching</button>
                          <button onClick={(e) => addToWatchlist(anime, 'completed', e)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700/50">Completed</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 pb-8">
            <button onClick={() => handlePageChange(Math.max(1, s.currentPage - 1))} disabled={s.currentPage === 1} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={18} /> Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, s.totalPages) }, (_, i) => {
                let pageNum: number;
                if (s.totalPages <= 5) pageNum = i + 1;
                else if (s.currentPage <= 3) pageNum = i + 1;
                else if (s.currentPage >= s.totalPages - 2) pageNum = s.totalPages - 4 + i;
                else pageNum = s.currentPage - 2 + i;
                return (
                  <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${s.currentPage === pageNum ? 'bg-anime-primary text-white shadow-lg shadow-anime-primary/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button onClick={() => handlePageChange(Math.min(s.totalPages, s.currentPage + 1))} disabled={s.currentPage === s.totalPages} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Next <ChevronRight size={18} />
            </button>
          </div>
        </>
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
                      onClick={(e) => { e.stopPropagation(); if(!s.addedTitles.has(selectedAnime.title)) addToWatchlist(selectedAnime, 'plan_to_watch', e); }}
                      disabled={s.addedTitles.has(selectedAnime.title) || addingId === selectedAnime.mal_id}
                      className={`w-full flex items-center justify-center gap-2 font-bold px-6 py-4 rounded-xl transition-all duration-300 text-lg ${
                        s.addedTitles.has(selectedAnime.title)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : addingId === selectedAnime.mal_id
                          ? 'bg-anime-primary/20 text-anime-primary border border-anime-primary/30'
                          : 'bg-anime-primary hover:bg-anime-primary/90 text-white shadow-lg shadow-anime-primary/20 hover:shadow-anime-primary/40'
                      }`}
                    >
                      {s.addedTitles.has(selectedAnime.title) ? <><Check size={20} /> Added to Watchlist</> : addingId === selectedAnime.mal_id ? <><Loader2 size={20} className="animate-spin" /> Adding...</> : <><BookmarkPlus size={20} /> Add to Watchlist</>}
                    </button>
                    {!s.addedTitles.has(selectedAnime.title) && (
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
