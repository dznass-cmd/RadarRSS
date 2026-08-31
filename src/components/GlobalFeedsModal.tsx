import React, { useState } from 'react';
import { X, Globe, Plus, Check, Search } from 'lucide-react';
import { GLOBAL_FEEDS_BY_COUNTRY, GlobalFeedItem } from '../data/globalFeeds';
import { RssFeed } from '../types';
import { Language, getTranslation } from '../i18n/translations';

interface GlobalFeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFeeds: RssFeed[];
  onAddFeed: (newFeed: Omit<RssFeed, 'status'>) => void;
  theme: 'dark' | 'light';
  language?: Language;
}

export const GlobalFeedsModal: React.FC<GlobalFeedsModalProps> = ({
  isOpen,
  onClose,
  activeFeeds,
  onAddFeed,
  theme,
  language = 'en',
}) => {
  const t = getTranslation(language);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedUrls, setAddedUrls] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // Extract unique countries
  const countries = Array.from(
    new Map(
      GLOBAL_FEEDS_BY_COUNTRY.map((f) => [f.countryCode, { code: f.countryCode, name: f.countryName, flag: f.flag }])
    ).values()
  );

  const existingUrls = new Set(activeFeeds.map((f) => f.url));

  const filteredFeeds = GLOBAL_FEEDS_BY_COUNTRY.filter((item) => {
    const matchesCountry = selectedCountry === 'ALL' || item.countryCode === selectedCountry;
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCountry && matchesSearch;
  });

  const handleAdd = (item: GlobalFeedItem) => {
    const newFeed: Omit<RssFeed, 'status'> = {
      id: `${item.countryCode.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: `${item.flag} ${item.title}`,
      url: item.url,
      category: item.category,
      icon: item.flag,
      active: true,
    };
    onAddFeed(newFeed);
    setAddedUrls((prev) => new Set(prev).add(item.url));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 ${
        theme === 'dark' ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
      }`}>

        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between gap-4 shrink-0 ${
          theme === 'dark' ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight uppercase flex items-center gap-2">
                {t.globalFeeds.title}
                <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500 text-black font-extrabold uppercase">
                  {GLOBAL_FEEDS_BY_COUNTRY.length} {t.globalFeeds.feedsCount}
                </span>
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                {t.globalFeeds.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-2xl border transition-colors cursor-pointer ${
              theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700' : 'hover:bg-neutral-200 border-neutral-300'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Country Filter Bar */}
        <div className={`p-4 border-b space-y-3 shrink-0 ${
          theme === 'dark' ? 'bg-neutral-900/90 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.globalFeeds.searchPlaceholder}
              className={`w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border outline-none ${
                theme === 'dark' ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500' : 'bg-white border-neutral-300 focus:border-orange-500'
              }`}
            />
          </div>

          {/* Country Chips Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCountry('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                selectedCountry === 'ALL'
                  ? 'bg-orange-500 text-black shadow-md'
                  : theme === 'dark' ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              🌐 {t.globalFeeds.allCountries} ({GLOBAL_FEEDS_BY_COUNTRY.length})
            </button>

            {countries.map((c) => {
              const count = GLOBAL_FEEDS_BY_COUNTRY.filter((f) => f.countryCode === c.code).length;
              const isSelected = selectedCountry === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 text-black shadow-md'
                      : theme === 'dark' ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feeds Directory List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFeeds.map((feed, idx) => {
              const isAlreadyAdded = existingUrls.has(feed.url) || addedUrls.has(feed.url);

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    theme === 'dark'
                      ? 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{feed.flag}</span>
                        <h4 className="font-black text-xs uppercase tracking-wider truncate">
                          {feed.title}
                        </h4>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0 ${
                        theme === 'dark' ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-600'
                      }`}>
                        {feed.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {feed.description}
                    </p>
                  </div>

                  <div className={`flex items-center justify-between pt-2 border-t ${
                    theme === 'dark' ? 'border-neutral-800/60' : 'border-neutral-200'
                  }`}>
                    <span className="text-[9px] font-mono text-neutral-500 truncate max-w-[180px]">
                      {feed.url}
                    </span>

                    <button
                      onClick={() => handleAdd(feed)}
                      disabled={isAlreadyAdded}
                      className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-orange-500 hover:bg-orange-400 text-black shadow-sm'
                      }`}
                    >
                      {isAlreadyAdded ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>{t.globalFeeds.added}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>{t.globalFeeds.addFeed}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
