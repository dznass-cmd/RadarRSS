import React, { useState, useEffect } from 'react';
import {
  Rss,
  RefreshCw,
  Plus,
  Bookmark,
  Settings,
  Sparkles,
  Search,
  Moon,
  Sun,
  ListPlus,
  Globe,
  Archive,
  Menu,
  X
} from 'lucide-react';
import { AppSettings } from '../types';
import { getAccent } from '../utils/theme';
import { getTranslation } from '../i18n/translations';

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
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
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
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const [countdown, setCountdown] = useState<number>(autoRefreshSec);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const acc = getAccent(settings.accentColor);
  const t = getTranslation(settings.language);

  const categoryTabs = [
    { id: 'all', label: t.nav.headlines },
    { id: 'tech', label: t.nav.tech },
    { id: 'finance', label: t.nav.finance },
    { id: 'games', label: t.nav.games },
    { id: 'saved', label: t.nav.saved },
  ];

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
    const next = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ ...settings, theme: next });
  };

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
      settings.theme === 'dark'
        ? 'bg-[#0a0b0e]/95 border-neutral-800/80 text-neutral-100 backdrop-blur-xl'
        : 'bg-white/95 border-neutral-200 text-neutral-900 backdrop-blur-xl shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Top Bar Row */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${acc.bg} text-black shadow-md font-black`}>
              <Rss className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`font-black text-base sm:text-xl tracking-tight uppercase flex items-center ${
                settings.theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'
              }`}>
                RADAR<span className={`${settings.theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} ml-1`}>RSS</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hidden xs:inline-block">
                v0.0.8-beta
              </span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className={`w-full pl-9 pr-8 py-1.5 text-xs font-medium rounded-xl border transition-all outline-none ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900/90 border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:border-amber-500/50'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-amber-500/50'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold transition-colors cursor-pointer ${
                  settings.theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                ✕
              </button>
            )}
          </div>

          {/* Desktop Category Tabs */}
          <nav className="hidden lg:flex items-center gap-5">
            {categoryTabs.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectCategory && onSelectCategory(tab.id)}
                  className={`relative py-1 text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                    isActive
                      ? 'text-amber-400'
                      : settings.theme === 'dark'
                        ? 'text-neutral-400 hover:text-neutral-200'
                        : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">

            {/* Refresh Button */}
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              title={`${t.nav.autoRefreshIn} ${countdown}s. ${t.nav.refresh}.`}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-mono font-bold border transition-all ${
                isRefreshing
                  ? `${acc.bgLight} ${acc.borderLight} ${acc.textDark}`
                  : settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:border-neutral-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? `animate-spin ${acc.text}` : ''}`} />
              <span className="text-[11px]">{isRefreshing ? '...' : `${countdown}s`}</span>
            </button>

            {/* AI Curator Button */}
            <button
              onClick={onOpenAICurator}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r ${acc.gradientFrom} ${acc.gradientTo} text-black shadow-md transition-all`}
              title={t.nav.aiCurator}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.nav.aiCurator}</span>
            </button>

            {/* Add Dynamic Block Button */}
            <button
              onClick={onOpenCreateBlock}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider ${acc.bg} ${acc.bgHover} text-black transition-all shadow-md`}
              title={t.nav.newBlock}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">{t.nav.newBlock}</span>
            </button>

            {/* Feeds Manager */}
            <button
              onClick={onOpenManageFeeds}
              title={t.nav.manageFeeds}
              className={`p-2 rounded-2xl border transition-all ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <ListPlus className="w-4 h-4" />
            </button>

            {/* Bookmarks Quick Toggle */}
            <button
              onClick={onToggleBookmarks}
              title={t.nav.bookmarks}
              className={`relative p-2 rounded-2xl border transition-all ${
                showBookmarksOnly
                  ? `${acc.bgLight} ${acc.borderLight} ${acc.textDark}`
                  : settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${showBookmarksOnly ? acc.fill : ''}`} />
              {bookmarkCount > 0 && (
                <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${acc.bg} text-[9px] font-black text-black`}>
                  {bookmarkCount}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title={t.nav.settings}
              className={`p-2 rounded-2xl border transition-all ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-2xl border lg:hidden transition-colors ${
                settings.theme === 'dark'
                  ? 'border-neutral-800 bg-neutral-900 text-neutral-300'
                  : 'border-neutral-300 bg-neutral-100 text-neutral-700'
              }`}
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Category Pills Bar */}
        <div className={`flex lg:hidden items-center gap-2 overflow-x-auto no-scrollbar stories-scroll-container py-2 border-t ${
          settings.theme === 'dark' ? 'border-neutral-800/40' : 'border-neutral-200'
        }`}>
          {categoryTabs.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectCategory && onSelectCategory(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-sm'
                    : settings.theme === 'dark'
                      ? 'bg-neutral-900/90 text-neutral-400 border border-neutral-800/80 hover:text-white'
                      : 'bg-neutral-200/90 text-neutral-600 border border-neutral-300/80 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-2.5 pt-0.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className={`w-full pl-8 pr-7 py-1 text-xs rounded-xl border transition-all outline-none ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-100 placeholder-neutral-500'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-900 placeholder-neutral-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Mobile Extra Drawer Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden p-3 border-t rounded-b-2xl mb-2 flex flex-wrap gap-2 text-xs transition-all ${
            settings.theme === 'dark'
              ? 'border-neutral-800 bg-[#0d0e12] text-neutral-100'
              : 'border-neutral-200 bg-neutral-100 text-neutral-900 shadow-md'
          }`}>
            <button
              onClick={() => {
                onOpenAICurator();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/40 font-bold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.nav.aiCurator}</span>
            </button>

            <button
              onClick={() => {
                onOpenGlobalFeeds();
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold cursor-pointer ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.nav.globalDirectory}</span>
            </button>

            <button
              onClick={() => {
                onToggleArchive();
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold cursor-pointer ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{t.nav.archive} ({archivedCount})</span>
            </button>

            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold cursor-pointer ${
                settings.theme === 'dark'
                  ? 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {settings.theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{settings.theme === 'dark' ? t.settings.themeLight : t.settings.themeDark}</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
