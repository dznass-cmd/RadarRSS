import React, { useEffect } from 'react';
import { ToastItem, AccentColor, NewsItem } from '../types';
import { getAccent } from '../utils/theme';
import { BellRing, Flame, X, ChevronRight, Volume2 } from 'lucide-react';

interface ToastNotificationContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onSelectArticle?: (article: NewsItem) => void;
  accentColor?: AccentColor;
  theme?: 'dark' | 'light';
}

export const ToastNotificationContainer: React.FC<ToastNotificationContainerProps> = ({
  toasts,
  onDismiss,
  onSelectArticle,
  accentColor,
  theme = 'dark',
}) => {
  if (!toasts || toasts.length === 0) return null;

  const acc = getAccent(accentColor);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          acc={acc}
          theme={theme}
          onDismiss={() => onDismiss(toast.id)}
          onSelectArticle={onSelectArticle}
        />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  acc: ReturnType<typeof getAccent>;
  theme: 'dark' | 'light';
  onDismiss: () => void;
  onSelectArticle?: (article: NewsItem) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({
  toast,
  acc,
  theme,
  onDismiss,
  onSelectArticle,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = () => {
    if (toast.article && onSelectArticle) {
      onSelectArticle(toast.article);
      onDismiss();
    }
  };

  const isBreaking = toast.type === 'breaking' || toast.title.includes('URGENTE');

  return (
    <div
      onClick={handleClick}
      className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl transition-all duration-300 transform animate-in slide-in-from-top-4 fade-in cursor-pointer group relative overflow-hidden backdrop-blur-md ${
        isBreaking
          ? theme === 'dark'
            ? `bg-neutral-900/95 border-red-500/80 text-white shadow-red-500/10`
            : `bg-white/95 border-red-500/80 text-neutral-900 shadow-xl`
          : theme === 'dark'
          ? `bg-neutral-900/95 border-neutral-700/80 text-white`
          : `bg-white/95 border-neutral-200 text-neutral-900`
      }`}
    >
      {/* Top Accent Line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isBreaking ? 'bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 animate-pulse' : acc.bg
        }`}
      />

      <div className="flex items-start gap-3">
        {/* Icon / Image */}
        {toast.imageUrl ? (
          <img
            src={toast.imageUrl}
            alt=""
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-neutral-700/50 mt-0.5"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isBreaking ? 'bg-red-500/20 text-red-500 border border-red-500/40' : `${acc.bgLight} ${acc.text}`
            }`}
          >
            {isBreaking ? (
              <Flame className="w-5 h-5 animate-pulse" />
            ) : (
              <BellRing className="w-5 h-5" />
            )}
          </div>
        )}

        {/* Text Body */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                isBreaking
                  ? 'bg-red-500 text-white font-extrabold animate-pulse'
                  : `${acc.bg} text-black font-extrabold`
              }`}
            >
              {isBreaking ? '⚡ NOTÍCIA URGENTE' : 'NOTIFICAÇÃO RADAR'}
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h4 className="font-extrabold text-xs leading-snug line-clamp-2 group-hover:underline">
            {toast.title}
          </h4>

          {toast.message && (
            <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed font-medium">
              {toast.message}
            </p>
          )}

          {toast.article && (
            <div className={`mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${acc.textDark}`}>
              <span>Clique para ler notícia completa</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
