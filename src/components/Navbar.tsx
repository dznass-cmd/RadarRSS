import React, { useState, useEffect } from 'react';
import {
  Rss,
  RefreshCw,
  Plus,
  Bookmark,
  Settings,
  Sparkles,
  Search,
  Radio,
  Layers,
  Moon,
  Sun,
  ListPlus,
  Globe,
  Archive
} from 'lucide-react';
import { AppSettings } from '../types';
import { getAccent } from '../utils/theme';

interface NavbarProps {
  onRefreshAll: () => void;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  autoRefreshSec: number;
  onOpenCreateBlock: () => void;
  onOpenManageFeeds: () => void;
  onOpenGlobalFeeds: () => void;
  onOpenAICurator: () => void;
  onOpenSettings: () => void;
  onToggleBookmarks: () => void;
  showBookmarksOnly: boolean;
  bookmarkCount: number;
  onToggleArchive: () => void;
  showArchiveOnly: boolean;
  archivedCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  totalArticlesCount: number;
  newArticlesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefreshAll,
  isRefreshing,
  lastUpdated,
  autoRefreshSec,
  onOpenCreateBlock,
  onOpenManageFeeds,
  onOpenGlobalFeeds,
  onOpenAICurator,
  onOpenSettings,
  onToggleBookmarks,
  showBookmarksOnly,
  bookmarkCount,
  onToggleArchive,
  showArchiveOnly,
  archivedCount,
  searchQuery,
  onSearchChange,
  settings,
  onUpdateSettings,
  totalArticlesCount,
  newArticlesCount,
}) => {
  const [countdown, setCountdown] = useState<number>(autoRefreshSec);
  const acc = getAccent(settings.accentColor);

  // Countdown timer for next auto refresh
  useEffect(() => {
    if (autoRefreshSec <= 0) return;
    setCountdown(autoRefreshSec);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setTimeout(() => {
            onRefreshAll();
          }, 0);
          return autoRefreshSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshSec, onRefreshAll]);

  const toggleTheme = () => {
    onUpdateSettings({
      ...settings,
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
      settings.theme === 'dark'
        ? 'bg-zinc-950/90 border-zinc-800 text-zinc-100 backdrop-blur-md'
        : 'bg-white/90 border-zinc-200 text-zinc-900 backdrop-blur-md shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Live Badge */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-2xl ${acc.bg} text-black shadow-lg font-black`}>
              <Rss className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl tracking-tighter uppercase text-white">
                  Radar RSS<span className={acc.text}>.</span>
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${acc.bgLight} ${acc.textDark} border ${acc.borderLight}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${acc.bg} animate-pulse`} />
                  LIVE STREAM
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Real-Time Intelligence • {totalArticlesCount} Matérias
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="BUSCAR PALAVRAS-CHAVE, FONTES OU TÓPICOS..."
              className={`w-full pl-9 pr-4 py-2 text-xs font-medium uppercase tracking-wide rounded-2xl border transition-all outline-none ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-100 placeholder-neutral-500'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-neutral-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Actions & Refresh Timer */}
          <div className="flex items-center gap-2">

            {/* Auto Refresh Indicator / Manual Button */}
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              title={`Sincronizando em ${countdown}s. Clique para atualizar agora.`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-mono font-bold border transition-all ${
                isRefreshing
                  ? `${acc.bgLight} ${acc.borderLight} ${acc.textDark}`
                  : settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:border-neutral-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? `animate-spin ${acc.text}` : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing ? 'REFRESHING...' : `${countdown}S`}
              </span>
            </button>

            {/* Global RSS Recommendations Button */}
            <button
              onClick={onOpenGlobalFeeds}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${
                settings.theme === 'dark'
                  ? `bg-neutral-900 border-neutral-700 ${acc.textDark} hover:bg-neutral-800`
                  : `bg-neutral-100 border-neutral-300 ${acc.textLight} hover:bg-neutral-200`
              }`}
              title="Recomendações Globais de RSS por País"
            >
              <Globe className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden lg:inline">RSS Mundiais</span>
            </button>

            {/* AI Curator Button */}
            <button
              onClick={onOpenAICurator}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r ${acc.gradientFrom} ${acc.gradientTo} text-black shadow-md transition-all`}
              title="Solicitar à IA para criar um bloco sob medida"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Curadoria IA</span>
            </button>

            {/* Add Dynamic Block Button */}
            <button
              onClick={onOpenCreateBlock}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider ${acc.bg} ${acc.bgHover} text-black transition-all shadow-md`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">+ Novo Bloco</span>
            </button>

            {/* Feeds Manager */}
            <button
              onClick={onOpenManageFeeds}
              title="Gerenciar Feeds RSS"
              className={`p-2 rounded-2xl border transition-all ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <ListPlus className="w-4 h-4" />
            </button>

            {/* Archive Toggle (Clicked news) */}
            <button
              onClick={onToggleArchive}
              title="Notícias Arquivadas (Clicadas)"
              className={`relative p-2 rounded-2xl border transition-all ${
                showArchiveOnly
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                  : settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Archive className="w-4 h-4" />
              {archivedCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
                  {archivedCount}
                </span>
              )}
            </button>

            {/* Bookmarks Toggle */}
            <button
              onClick={onToggleBookmarks}
              title="Ver Matérias Salvas"
              className={`relative p-2 rounded-2xl border transition-all ${
                showBookmarksOnly
                  ? `${acc.bgLight} ${acc.borderLight} ${acc.textDark}`
                  : settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${acc.bg} text-[10px] font-black text-black`}>
                  {bookmarkCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Alternar Tema Claro/Escuro"
              className={`p-2 rounded-2xl border transition-all ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-700 text-orange-400 hover:bg-neutral-800'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="Configurações do Painel"
              className={`p-2 rounded-2xl border transition-all ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar em todas as notícias..."
              className={`w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border transition-all outline-none ${
                settings.theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>
        </div>

      </div>
    </header>
  );
};
