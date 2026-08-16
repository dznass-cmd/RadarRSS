import React, { useState } from 'react';
import { X, Globe, Plus, Check, Search, Rss, Sparkles } from 'lucide-react';
import { GLOBAL_FEEDS_BY_COUNTRY, GlobalFeedItem } from '../data/globalFeeds';
import { RssFeed } from '../types';

interface GlobalFeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFeeds: RssFeed[];
  onAddFeed: (newFeed: Omit<RssFeed, 'status'>) => void;
  theme: 'dark' | 'light';
}

export const GlobalFeedsModal: React.FC<GlobalFeedsModalProps> = ({
  isOpen,
  onClose,
  activeFeeds,
  onAddFeed,
  theme,
}) => {
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
                Recomendações Globais de RSS
                <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500 text-black font-extrabold uppercase">
                  {GLOBAL_FEEDS_BY_COUNTRY.length} Feeds
                </span>
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                Explore e adicione fontes confiáveis de notícias de diversos países do mundo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-2xl border transition-colors ${
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
              placeholder="Buscar por país, veículo ou tema (ex: França, TechCrunch, Cinema)..."
              className={`w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border outline-none ${
                theme === 'dark' ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500' : 'bg-white border-neutral-300 focus:border-orange-500'
              }`}
            />
          </div>

          {/* Country Chips Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCountry('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedCountry === 'ALL'
                  ? 'bg-orange-500 text-black shadow-md'
                  : theme === 'dark' ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              🌐 Todos ({GLOBAL_FEEDS_BY_COUNTRY.length})
            </button>

            {countries.map((c) => {
              const count = GLOBAL_FEEDS_BY_COUNTRY.filter((f) => f.countryCode === c.code).length;
              const isSelected = selectedCountry === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-black shadow-md'
                      : theme === 'dark' ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-black/20 text-black' : 'bg-neutral-700 text-neutral-300'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed List Grid */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filteredFeeds.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 font-mono text-xs">
              Nenhum feed internacional encontrado para a busca selecionada.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFeeds.map((item) => {
                const isAlreadyInApp = existingUrls.has(item.url) || addedUrls.has(item.url);

                return (
                  <div
                    key={item.url}
                    className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                      theme === 'dark'
                        ? 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                        : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30">
                          <span>{item.flag}</span>
                          <span>{item.countryName}</span>
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">
                          {item.category}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm leading-tight mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 font-normal">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-neutral-800/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[180px]">
                        {item.url}
                      </span>

                      <button
                        onClick={() => handleAdd(item)}
                        disabled={isAlreadyInApp}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          isAlreadyInApp
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                            : 'bg-orange-500 hover:bg-orange-400 text-black shadow-md shadow-orange-500/20'
                        }`}
                      >
                        {isAlreadyInApp ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Adicionado</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Adicionar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
