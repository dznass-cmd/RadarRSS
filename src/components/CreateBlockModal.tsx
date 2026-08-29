import React, { useState } from 'react';
import { X, Sparkles, Plus, LayoutGrid, Columns, List, MessageSquareText, Layers } from 'lucide-react';
import { DynamicBlock, BlockLayout, RssFeed } from '../types';

interface CreateBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBlock: (block: DynamicBlock) => void;
  initialBlock?: DynamicBlock | null;
  availableFeeds: RssFeed[];
  theme: 'dark' | 'light';
}

const PRESETS = [
  {
    title: '⚡ Notícias do Brasil',
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
    title: '📈 Finanças & Bolsa de Valores',
    categoryFilter: 'finance',
    layout: 'list' as BlockLayout,
    itemCount: 5,
    accentColor: 'from-emerald-600 to-teal-500',
  },
];

export const CreateBlockModal: React.FC<CreateBlockModalProps> = ({
  isOpen,
  onClose,
  onSaveBlock,
  initialBlock,
  availableFeeds,
  theme,
}) => {
  const [title, setTitle] = useState<string>(initialBlock?.title || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialBlock?.categoryFilter || 'all');
  const [filterKeyword, setFilterKeyword] = useState<string>(initialBlock?.filterKeyword || '');
  const [layout, setLayout] = useState<BlockLayout>(initialBlock?.layout || 'grid');
  const [itemCount, setItemCount] = useState<number>(initialBlock?.itemCount || 6);
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(initialBlock?.autoRefreshSec || 120);

  React.useEffect(() => {
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
      alert('Por favor informe um título para o bloco.');
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

  const applyPreset = (preset: typeof PRESETS[0]) => {
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
            {initialBlock ? 'Editar Bloco Dinâmico' : 'Criar Novo Bloco Dinâmico'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-neutral-800">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">

          {/* Quick Presets */}
          {!initialBlock && (
            <div className="mb-4">
              <label className="block text-xs font-black text-orange-500 uppercase tracking-widest mb-2">
                Atalhos Rápidos de Blocos
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`p-3 rounded-2xl border text-left text-xs font-extrabold transition-all ${theme === 'dark'
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
              Título do Bloco
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: 🤖 RADAR DE IA & INOVAÇÃO"
              className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border outline-none ${theme === 'dark'
                  ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500'
                  : 'bg-neutral-50 border-neutral-200 focus:border-orange-500'
                }`}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
              Categoria Principal do Feed
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border outline-none ${theme === 'dark'
                  ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500'
                  : 'bg-neutral-50 border-neutral-200 focus:border-orange-500'
                }`}
            >
              <option value="all">🌐 Todas as Categorias</option>
              <option value="tech">💻 Tecnologia & Dev</option>
              <option value="brazil">🇧🇷 Brasil & Notícias</option>
              <option value="ai">🤖 IA & Inovação</option>
              <option value="finance">📈 Economia & Negócios</option>
              <option value="sports">⚽ Esportes</option>
              <option value="entertainment">🎬 Cultura & Entretenimento</option>
            </select>
          </div>

          {/* Filter Keyword */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              Filtro por Palavras-Chave (Opcional)
            </label>
            <p className="text-[10px] font-mono text-neutral-400 mb-1.5">
              Use barras para termos alternativos (ex: <code className="text-orange-400">futebol|copa|seleção</code>)
            </p>
            <input
              type="text"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              placeholder="ex: inteligência artificial|ChatGPT|Gemini"
              className={`w-full px-4 py-3 text-xs font-mono rounded-2xl border outline-none ${theme === 'dark'
                  ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500'
                  : 'bg-neutral-50 border-neutral-200 focus:border-orange-500'
                }`}
            />
          </div>

          {/* Layout Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2">
              Estilo de Layout do Bloco
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'hero', label: 'DESTAQUE HERO', icon: Columns },
                { id: 'grid', label: 'GRADE CARDS', icon: LayoutGrid },
                { id: 'list', label: 'LISTA', icon: List },
                { id: 'compact', label: 'COMPACTA', icon: MessageSquareText },
              ].map((l) => {
                const Icon = l.icon;
                const active = layout === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLayout(l.id as BlockLayout)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-[10px] font-black uppercase tracking-wider gap-1.5 transition-all ${active
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
                Quantidade
              </label>
              <select
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border outline-none ${theme === 'dark'
                    ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500'
                    : 'bg-neutral-50 border-neutral-200 focus:border-orange-500'
                  }`}
              >
                <option value={3}>3 matérias</option>
                <option value={5}>5 matérias</option>
                <option value={8}>8 matérias</option>
                <option value={12}>12 matérias</option>
                <option value={16}>16 matérias</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Frequência
              </label>
              <select
                value={autoRefreshSec}
                onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
                className={`w-full px-4 py-3 text-xs font-bold rounded-2xl border outline-none ${theme === 'dark'
                    ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500'
                    : 'bg-neutral-50 border-neutral-200 focus:border-orange-500'
                  }`}
              >
                <option value={30}>30 segundos</option>
                <option value={60}>1 minuto</option>
                <option value={120}>2 minutos</option>
                <option value={300}>5 minutos</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl font-black uppercase tracking-wider text-xs bg-orange-500 hover:bg-orange-400 text-black shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>{initialBlock ? 'SALVAR ALTERAÇÕES' : 'CRIAR BLOCO DINÂMICO'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
