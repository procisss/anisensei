import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, BookOpen, List, MessageSquare } from 'lucide-react';
import { AppStateProvider } from './AppStateContext';

import { RecommendPage } from './pages/RecommendPage';
import { ChatPage } from './pages/ChatPage';
import { AnimeListsPage } from './pages/AnimeListsPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { HomePage } from './pages/HomePage';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-anime-primary/20 text-anime-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Navigation = () => {
  return (
    <nav className="w-64 glass-panel h-[calc(100vh-2rem)] m-4 flex flex-col fixed left-0 top-0">
      <Link to="/" className="p-6 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
          <Sparkles className="text-anime-primary" />
          AniSensei
        </h1>
      </Link>
      
      <div className="flex-1 px-4 space-y-2">
        <NavItem to="/" icon={Home} label="Home" />
        <NavItem to="/recommend" icon={Sparkles} label="AI Finder" />
        <NavItem to="/anime" icon={BookOpen} label="Anime List" />
        <NavItem to="/watchlist" icon={List} label="Watchlist" />
        <NavItem to="/chat" icon={MessageSquare} label="AI Chat" />
      </div>
      
    
    </nav>
  );
};

function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
      <div className="flex min-h-screen">
        <Navigation />
        <main className="flex-1 ml-72 p-4">
          <div className="glass-panel min-h-[calc(100vh-2rem)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-anime-primary via-anime-secondary to-anime-primary"></div>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/recommend" element={<RecommendPage />} />
              <Route path="/anime" element={<AnimeListsPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Routes>
          </div>
        </main>
      </div>
      </BrowserRouter>
    </AppStateProvider>
  );
}

export default App;
