import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Settings2,
  Bookmark,
  Volume2,
  ExternalLink,
  Pin,
  Trash2,
  LayoutGrid,
  List,
  Columns,
  Radio,
  Clock,
  MessageSquareText,
  X,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Smile,
  Frown,
  Minus
} from 'lucide-react';
import { DynamicBlock, NewsItem, BlockLayout, AccentColor } from '../types';
import { getAccent } from '../utils/theme';

interface DynamicBlockCardProps {
  block: DynamicBlock;
  items: NewsItem[];
  isLoading: boolean;
  onRefreshBlock: () => void;
  onSelectArticle: (item: NewsItem) => void;
  onToggleBookmark: (item: NewsItem) => void;
  onEditBlock: () => void;
  onDeleteBlock: () => void;
  onUpdateBlockLayout: (layout: BlockLayout) => void;
  onGenerateAISummary: () => void;
  isGeneratingAI: boolean;
  theme: 'dark' | 'light';
  accentColor?: AccentColor;
  bookmarkedIds: Set<string>;
  archivedIds?: Set<string>;
  onToggleArchive?: (item: NewsItem) => void;
}

export const DynamicBlockCard: React.FC<DynamicBlockCardProps> = ({
  block,
  items,
  isLoading,
  onRefreshBlock,
  onSelectArticle,
  onToggleBookmark,
  onEditBlock,
  onDeleteBlock,
  onUpdateBlockLayout,
  onGenerateAISummary,
  isGeneratingAI,
  theme,
  accentColor,
  bookmarkedIds,
  archivedIds = new Set(),
  onToggleArchive,
}) => {
  const [showSummary, setShowSummary] = useState<boolean>(!!block.aiSummary);
  const acc = getAccent(accentColor);

  const displayItems = items.slice(0, block.itemCount);

  // Helper for sentiment badge
  const renderSentiment = (sentiment?: string) => {
    if (sentiment === 'positive') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md" title="Sentimento Positivo">
          <Smile className="w-3 h-3" />
          <span>Positivo</span>
        </span>
      );
    }
    if (sentiment === 'negative') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md" title="Sentimento Negativo / Alerta">
          <Frown className="w-3 h-3" />
          <span>Alerta</span>
        </span>
      );
    }
    return null;
  };

  // Helper for relative time string
  const getRelativeTime = (timestamp: number) => {
    const diffMin = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  };

  return (
    <div className={`rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col h-full shadow-2xl ${
      theme === 'dark'
        ? `bg-neutral-800/90 border-neutral-700/80 text-neutral-100 ${acc.borderHover}`
        : `bg-white border-neutral-200 text-neutral-900 ${acc.borderHover} shadow-lg`
    }`}>
      
      {/* Block Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between gap-3 ${
        theme === 'dark' ? 'bg-neutral-900/60 border-neutral-700/80' : 'bg-neutral-50 border-neutral-200'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full ${acc.bg} shadow-xs shrink-0`} />
          <h2 className="font-extrabold text-sm uppercase tracking-wider truncate flex items-center gap-2">
            {block.title}
            {block.filterKeyword && (
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${acc.bgLight} ${acc.textDark} border ${acc.borderLight} truncate`}>
                {block.filterKeyword}
              </span>
            )}
          </h2>
          <span className="text-[10px] font-mono font-bold text-neutral-400 shrink-0">
            [{displayItems.length}]
          </span>
        </div>

        {/* Block Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Layout switcher buttons */}
          <div className={`hidden sm:flex items-center p-0.5 rounded-xl border text-xs ${
            theme === 'dark' ? 'bg-neutral-900 border-neutral-700 text-neutral-400' : 'bg-neutral-100 border-neutral-300 text-neutral-600'
          }`}>
            <button
              onClick={() => onUpdateBlockLayout('hero')}
              title="Destaque Hero"
              className={`p-1 rounded-lg transition-colors ${block.layout === 'hero' ? `${acc.bg} text-black font-extrabold` : 'hover:text-white'}`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateBlockLayout('grid')}
              title="Grade de Cards"
              className={`p-1 rounded-lg transition-colors ${block.layout === 'grid' ? `${acc.bg} text-black font-extrabold` : 'hover:text-white'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateBlockLayout('list')}
              title="Lista Detalhada"
              className={`p-1 rounded-lg transition-colors ${block.layout === 'list' ? `${acc.bg} text-black font-extrabold` : 'hover:text-white'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateBlockLayout('compact')}
              title="Lista Compacta"
              className={`p-1 rounded-lg transition-colors ${block.layout === 'compact' ? `${acc.bg} text-black font-extrabold` : 'hover:text-white'}`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Summarize Button */}
          <button
            onClick={onGenerateAISummary}
            disabled={isGeneratingAI || displayItems.length === 0}
            title="Sintetizar bloco com IA (Gemini)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${acc.bg} ${acc.bgHover} text-black transition-all shadow-xs`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isGeneratingAI ? '...' : 'SÍNTESE IA'}</span>
          </button>

          {/* Refresh Block */}
          <button
            onClick={onRefreshBlock}
            disabled={isLoading}
            title="Atualizar este bloco"
            className={`p-1.5 rounded-xl transition-colors ${
              theme === 'dark' ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? `animate-spin ${acc.text}` : ''}`} />
          </button>

          {/* Block Settings */}
          <button
            onClick={onEditBlock}
            title="Configurar este bloco"
            className={`p-1.5 rounded-xl transition-colors ${
              theme === 'dark' ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Delete Block */}
          <button
            onClick={onDeleteBlock}
            title="Excluir este bloco"
            className={`p-1.5 rounded-xl transition-colors text-red-400 hover:bg-red-500/10`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Digest Drawer Banner if generated */}
      {block.aiSummary && (
        <div className={`p-4 border-b transition-all text-xs ${
          theme === 'dark' ? 'bg-purple-950/30 border-purple-800/40 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
        }`}>
          <div className="flex items-center justify-between mb-2 font-bold text-purple-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              SÍNTESE INTELIGENTE DO BLOCO (GEMINI AI)
            </span>
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="text-purple-400 hover:text-purple-200 text-[11px] underline"
            >
              {showSummary ? 'Ocultar' : 'Ver Resumo'}
            </button>
          </div>
          {showSummary && (
            <div className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-xs">
              {block.aiSummary}
            </div>
          )}
        </div>
      )}

      {/* Block Body Content */}
      <div className="p-4 flex-1">
        {isLoading && displayItems.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span>Sincronizando feeds do bloco em tempo real...</span>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            Nenhuma notícia encontrada com os filtros configurados.
          </div>
        ) : (
          <>
            {/* HERO LAYOUT */}
            {block.layout === 'hero' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Featured Big Item */}
                <div 
                  onClick={() => onSelectArticle(displayItems[0])}
                  className={`md:col-span-7 group cursor-pointer rounded-2xl overflow-hidden border ${acc.borderLight} bg-neutral-900/80 ${acc.borderHover} transition-all p-4 flex flex-col justify-between`}
                >
                  <div>
                    {displayItems[0].imageUrl ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-neutral-950">
                        <img 
                          src={displayItems[0].imageUrl} 
                          alt={displayItems[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded ${acc.bg} text-black font-black text-[10px] uppercase tracking-wider`}>
                          {displayItems[0].sourceName}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded ${acc.bg} text-black font-black text-[10px] uppercase tracking-wider`}>
                          {displayItems[0].sourceName}
                        </span>
                        {renderSentiment(displayItems[0].sentiment)}
                      </div>
                    )}
                    <h3 className={`font-extrabold text-base leading-snug group-${acc.textHover} transition-colors mb-2`}>
                      {displayItems[0].title}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-3">
                      {displayItems[0].contentSnippet}
                    </p>
                  </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-700/50">
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {getRelativeTime(displayItems[0].timestamp)}
                        {archivedIds.has(displayItems[0].id) && (
                          <span className="ml-1 text-[9px] font-black text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                            LIDA / ARQUIVADA
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {onToggleArchive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleArchive(displayItems[0]);
                            }}
                            title={archivedIds.has(displayItems[0].id) ? "Desarquivar notícia" : "Arquivar notícia"}
                            className="p-1 hover:text-amber-400 transition-colors"
                          >
                            <X className={`w-3.5 h-3.5 ${archivedIds.has(displayItems[0].id) ? 'text-amber-400' : 'text-neutral-500'}`} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleBookmark(displayItems[0]);
                          }}
                          className={`p-1 ${acc.textHover} transition-colors`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.has(displayItems[0].id) ? `${acc.fill}` : ''}`} />
                        </button>
                      </div>
                    </div>
                </div>

                {/* Secondary List Column */}
                <div className="md:col-span-5 flex flex-col gap-2.5 justify-between">
                  {displayItems.slice(1).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectArticle(item)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                        theme === 'dark'
                          ? `bg-neutral-900/60 border-neutral-700/80 ${acc.borderHover}`
                          : `bg-neutral-50 border-neutral-200 ${acc.borderHover}`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase ${acc.text} tracking-wider`}>
                          {item.sourceName}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {getRelativeTime(item.timestamp)}
                        </span>
                      </div>
                      <h4 className={`font-bold text-xs leading-snug group-${acc.textHover} line-clamp-2`}>
                        {item.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GRID LAYOUT */}
            {block.layout === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectArticle(item)}
                    className={`rounded-2xl border p-3.5 flex flex-col justify-between group cursor-pointer transition-all ${
                      theme === 'dark'
                        ? `bg-neutral-900/70 border-neutral-700/80 ${acc.borderHover}`
                        : `bg-neutral-50/90 border-neutral-200 ${acc.borderHover}`
                    }`}
                  >
                    <div>
                      {item.imageUrl && (
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-neutral-950 mb-2.5">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-black ${acc.text} uppercase tracking-widest`}>
                          {item.sourceName}
                        </span>
                        {renderSentiment(item.sentiment)}
                      </div>
                      <h4 className={`font-bold text-xs sm:text-sm leading-snug group-${acc.textHover} transition-colors line-clamp-2 mb-1.5`}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mb-3">
                        {item.contentSnippet}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-2 border-t border-neutral-700/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {getRelativeTime(item.timestamp)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {onToggleArchive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleArchive(item);
                            }}
                            title={archivedIds.has(item.id) ? "Desarquivar notícia" : "Arquivar notícia"}
                            className="p-1 hover:text-amber-400 transition-colors"
                          >
                            <X className={`w-3.5 h-3.5 ${archivedIds.has(item.id) ? 'text-amber-400' : 'text-neutral-500'}`} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleBookmark(item);
                          }}
                          className={`p-1 ${acc.textHover} transition-colors`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.has(item.id) ? `${acc.fill}` : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LIST LAYOUT */}
            {block.layout === 'list' && (
              <div className="flex flex-col gap-2.5">
                {displayItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectArticle(item)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 group cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-amber-500/40'
                        : 'bg-zinc-50 border-zinc-200 hover:border-amber-500/40'
                    }`}
                  >
                    {item.imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-950 shrink-0 hidden sm:block">
                        <img 
                          src={item.imageUrl} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-amber-500">
                          {item.sourceName}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          • {getRelativeTime(item.timestamp)}
                        </span>
                        {renderSentiment(item.sentiment)}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm group-hover:text-amber-500 transition-colors truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {item.contentSnippet}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(item);
                      }}
                      className="p-1.5 hover:text-amber-500 shrink-0"
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarkedIds.has(item.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* COMPACT LAYOUT */}
            {block.layout === 'compact' && (
              <div className="divide-y divide-zinc-800/40">
                {displayItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectArticle(item)}
                    className="py-2 px-1 flex items-center justify-between gap-3 group cursor-pointer hover:bg-amber-500/5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-[10px] font-bold text-zinc-400 shrink-0">
                        [{item.sourceName}]
                      </span>
                      <h4 className="font-medium text-xs truncate group-hover:text-amber-500">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[10px] text-zinc-500">
                      <span>{getRelativeTime(item.timestamp)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(item);
                        }}
                        className="hover:text-amber-500"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.has(item.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TICKER LAYOUT */}
            {block.layout === 'ticker' && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                {displayItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectArticle(item)}
                    className={`w-64 p-3 rounded-xl border shrink-0 flex flex-col justify-between group cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'bg-zinc-950/70 border-zinc-800 hover:border-amber-500/40'
                        : 'bg-zinc-50 border-zinc-200 hover:border-amber-500/40'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-amber-500 block mb-1">
                        {item.sourceName}
                      </span>
                      <h4 className="font-bold text-xs line-clamp-2 group-hover:text-amber-500">
                        {item.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-2 block">
                      {getRelativeTime(item.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};
