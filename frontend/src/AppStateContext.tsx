import React, { createContext, useContext, useState, ReactNode } from 'react';
import API_BASE from './apiBase';

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

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

// Anime List state
interface AnimeListState {
  animeList: JikanAnime[];
  searchInput: string;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  addedIds: Set<number>;
  addedTitles: Set<string>;
  selectedGenres: number[];
  mode: 'top' | 'search';
}

// Recommend page state
interface RecommendState {
  prompt: string;
  response: string;
}

// Chat page state
interface ChatState {
  messages: ChatMessage[];
  characterContext: string;
}

interface HomeState {
  randomAnime: JikanAnime | null;
  recommendedAnime: JikanAnime[];
}

interface AppStateContextType {
  animeListState: AnimeListState;
  setAnimeListState: (state: Partial<AnimeListState>) => void;
  recommendState: RecommendState;
  setRecommendState: (state: Partial<RecommendState>) => void;
  chatState: ChatState;
  setChatState: (state: Partial<ChatState>) => void;
  homeState: HomeState;
  setHomeState: (state: Partial<HomeState>) => void;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [animeListState, setAnimeListStateRaw] = useState<AnimeListState>({
    animeList: [],
    searchInput: '',
    searchQuery: '',
    currentPage: 1,
    totalPages: 1,
    addedIds: new Set(),
    addedTitles: new Set(),
    selectedGenres: [],
    mode: 'top',
  });

  const [recommendState, setRecommendStateRaw] = useState<RecommendState>({
    prompt: '',
    response: '',
  });

  const [chatState, setChatStateRaw] = useState<ChatState>({
    messages: [{ role: 'bot', text: 'Hello! I am AniSensei. I can roleplay as any character, or just chat about anime with you. Who would you like me to be?' }],
    characterContext: '',
  });

  const [homeState, setHomeStateRaw] = useState<HomeState>({
    randomAnime: null,
    recommendedAnime: [],
  });

  const setAnimeListState = (partial: Partial<AnimeListState>) =>
    setAnimeListStateRaw(prev => ({ ...prev, ...partial }));

  const setRecommendState = (partial: Partial<RecommendState>) =>
    setRecommendStateRaw(prev => ({ ...prev, ...partial }));

  const setChatState = (partial: Partial<ChatState>) =>
    setChatStateRaw(prev => ({ ...prev, ...partial }));

  const setHomeState = (partial: Partial<HomeState>) =>
    setHomeStateRaw(prev => ({ ...prev, ...partial }));

  React.useEffect(() => {
    // Fetch initial watchlist to populate addedTitles
    fetch(`${API_BASE}/api/watchlist`)
      .then(res => res.json())
      .then((data: any[]) => {
        const titles = new Set<string>();
        data.forEach(item => {
          if (item.anime && item.anime.title) {
            titles.add(item.anime.title);
          }
        });
        setAnimeListState({ addedTitles: titles });
      })
      .catch(err => console.error('Failed to load watchlist for context:', err));
  }, []);

  return (
    <AppStateContext.Provider value={{ animeListState, setAnimeListState, recommendState, setRecommendState, chatState, setChatState, homeState, setHomeState }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
};
