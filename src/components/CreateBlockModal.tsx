import React, { useState, useEffect } from 'react';
import { X, Plus, LayoutGrid, Columns, List, MessageSquareText, Layers } from 'lucide-react';
import { DynamicBlock, BlockLayout, RssFeed } from '../types';
import { Language, getTranslation } from '../i18n/translations';

interface CreateBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBlock: (block: DynamicBlock) => void;
  initialBlock?: DynamicBlock | null;
  availableFeeds: RssFeed[];
  theme: 'dark' | 'light';
  language?: Language;
}

export const CreateBlockModal: React.FC<CreateBlockModalProps> = ({
  isOpen,
  onClose,
  onSaveBlock,
  initialBlock,
  availableFeeds,
  theme,
  language = 'en',
}) => {
  const t = getTranslation(language);
  const [title, setTitle] = useState<string>(initialBlock?.title || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialBlock?.categoryFilter || 'all');
  const [filterKeyword, setFilterKeyword] = useState<string>(initialBlock?.filterKeyword || '');
  const [layout, setLayout] = useState<BlockLayout>(initialBlock?.layout || 'grid');
  const [itemCount, setItemCount] = useState<number>(initialBlock?.itemCount || 6);
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(initialBlock?.autoRefreshSec || 120);

  const presets = language === 'pt' ? [
    {
      title: '⚡ Notícias do Brasil & Mundo',
      categoryFilter: 'brazil',
      layout: 'hero' as BlockLayout,
      itemCount: 5,
      accentColor: 'from-amber-500 to-red-600',
    },
    {
      title: '💻 Mundo Tech & Startups',
      categoryFilter: 'tech',
      layout: 'grid' as BlockLayout,
      itemCount: 6,
      accentColor: 'from-blue-600 to-cyan-500',
    },
    {
      title: '🤖 Inteligência Artificial & LLMs',
      categoryFilter: 'ai',
      filterKeyword: 'IA|AI|inteligência artificial|Gemini|ChatGPT|OpenAI',
      layout: 'compact' as BlockLayout,
      itemCount: 6,
      accentColor: 'from-purple-600 to-pink-500',
    },
    {
      title: '📈 Finanças & Mercado Global',
      categoryFilter: 'finance',
      layout: 'list' as BlockLayout,
      itemCount: 5,
      accentColor: 'from-emerald-600 to-teal-500',
    },
  ] : [
    {
      title: '⚡ Global Headlines & Breaking',
      categoryFilter: 'world',
      layout: 'hero' as BlockLayout,
      itemCount: 5,
      accentColor: 'from-amber-500 to-red-600',
    },
    {
      title: '💻 Technology & Dev News',
      categoryFilter: 'tech',
      layout: 'grid' as BlockLayout,
      itemCount: 6,
      accentColor: 'from-blue-600 to-cyan-500',
    },
    {
      title: '🤖 Artificial Intelligence & LLMs',
      categoryFilter: 'ai',
      filterKeyword: 'AI|artificial intelligence|Gemini|ChatGPT|OpenAI|LLM|Machine Learning',
      layout: 'compact' as BlockLayout,
      itemCount: 6,
      accentColor: 'from-purple-600 to-pink-500',
    },
    {
      title: '📈 Markets, Finance & Startups',
      categoryFilter: 'finance',
      layout: 'list' as BlockLayout,
      itemCount: 5,
      accentColor: 'from-emerald-600 to-teal-500',
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setTitle(initialBlock?.title || '');
      setCategoryFilter(initialBlock?.categoryFilter || 'all');
      setFilterKeyword(initialBlock?.filterKeyword || '');
      setLayout(initialBlock?.layout || 'grid');
      setItemCount(initialBlock?.itemCount || 6);
      setAutoRefreshSec(initialBlock?.autoRefreshSec || 120);
    }
  }, [initialBlock, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert(t.createBlock.validationTitle);
      return;
    }

    const newBlock: DynamicBlock = {
      id: initialBlock?.id || `block_${Date.now()}`,
      title: title.trim(),
      categoryFilter: categoryFilter === 'all' ? undefined : categoryFilter,
      filterKeyword: filterKeyword.trim() || undefined,
      layout,
      itemCount,
      autoRefreshSec,
      isPinned: initialBlock?.isPinned || false,
      accentColor: initialBlock?.accentColor || 'from-amber-500 to-red-500',
    };

    onSaveBlock(newBlock);
    onClose();
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setTitle(preset.title);
    setCategoryFilter(preset.categoryFilter);
    setFilterKeyword(preset.filterKeyword || '');
    setLayout(preset.layout);
    setItemCount(preset.itemCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
        }`}>

        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
          }`}>
          <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-500" />
            {initialBlock ? t.createBlock.titleEdit : t.createBlock.titleCreate}
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-neutral-800 cursor-pointer">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">

          {/* Quick Presets */}
          {!initialBlock && (
            <div className="mb-4">
              <label className="block text-xs font-black text-orange-500 uppercase tracking-widest mb-2">
                {t.createBlock.presets}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`p-3 rounded-2xl border text-left text-xs font-extrabold transition-all cursor-pointer ${theme === 'dark'
                        ? 'bg-neutral-950/60 border-neutral-800 hover:border-orange-500/50'
                        : 'bg-neutral-50 border-neutral-200 hover:border-orange-500/50'
                      }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
              {t.createBlock.blockTitle}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.createBlock.blockTitlePlaceholder}
              className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border outline-none ${theme === 'dark'
                  ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500'
                  : 'bg-neutral-50 border-neutral-200 focus:border-orange-500'
                }`}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
              {t.createBlock.category}
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border outline-none ${theme === 'dark'
                  ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500'
                  : 'bg-neutral-50 border-neutral-200 focus:border-orange-500'
                }`}
            >
              <option value="all">🌐 {t.createBlock.categories.all}</option>
              <option value="tech">💻 {t.createBlock.categories.tech}</option>
              <option value="world">🌍 {t.createBlock.categories.world}</option>
              <option value="ai">🤖 {t.createBlock.categories.ai}</option>
              <option value="finance">📈 {t.createBlock.categories.finance}</option>
              <option value="brazil">🇧🇷 {t.createBlock.categories.brazil}</option>
              <option value="sports">⚽ {t.createBlock.categories.sports}</option>
              <option value="entertainment">🎬 {t.createBlock.categories.entertainment}</option>
            </select>
          </div>

          {/* Filter Keyword */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              {t.createBlock.keywords}
            </label>
            <p className="text-[10px] font-mono text-neutral-400 mb-1.5">
              {language === 'pt' ? 'Use barras verticais para termos alternativos (ex: OpenAI|Gemini|DeepMind)' : 'Use vertical bars for alternative keywords (e.g. OpenAI|Gemini|DeepMind)'}
            </p>
            <input
              type="text"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              placeholder={t.createBlock.keywordsPlaceholder}
              className={`w-full px-4 py-3 text-xs font-mono rounded-2xl border outline-none ${theme === 'dark'
                  ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500'
                  : 'bg-neutral-50 border-neutral-200 focus:border-orange-500'
                }`}
            />
          </div>

          {/* Layout Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2">
              {t.createBlock.layout}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'hero', label: 'HERO', icon: Columns },
                { id: 'grid', label: 'GRID', icon: LayoutGrid },
                { id: 'list', label: 'LIST', icon: List },
                { id: 'compact', label: 'COMPACT', icon: MessageSquareText },
              ].map((l) => {
                const Icon = l.icon;
                const active = layout === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLayout(l.id as BlockLayout)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-[10px] font-black uppercase tracking-wider gap-1.5 transition-all cursor-pointer ${active
                        ? 'bg-orange-500 text-black border-orange-500'
                        : theme === 'dark'
                          ? 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{l.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Count & Refresh */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                {t.createBlock.itemCount}
              </label>
              <select
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border outline-none ${theme === 'dark'
                    ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500'
                    : 'bg-neutral-50 border-neutral-200 focus:border-orange-500'
                  }`}
              >
                <option value={3}>3 {t.nav.articles}</option>
                <option value={5}>5 {t.nav.articles}</option>
                <option value={8}>8 {t.nav.articles}</option>
                <option value={12}>12 {t.nav.articles}</option>
                <option value={16}>16 {t.nav.articles}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                {t.createBlock.autoRefresh}
              </label>
              <select
                value={autoRefreshSec}
                onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
                className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border outline-none ${theme === 'dark'
                    ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500'
                    : 'bg-neutral-50 border-neutral-200 focus:border-orange-500'
                  }`}
              >
                <option value={30}>30s</option>
                <option value={60}>1 min</option>
                <option value={120}>2 min</option>
                <option value={300}>5 min</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl font-black uppercase tracking-wider text-xs bg-orange-500 hover:bg-orange-400 text-black shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>{initialBlock ? t.createBlock.save : t.createBlock.save}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
