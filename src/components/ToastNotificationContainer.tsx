import React, { useEffect, useState } from 'react';
import { ToastItem, AccentColor, NewsItem } from '../types';
import { getAccent } from '../utils/theme';
import { BellRing, Flame, X, ChevronRight } from 'lucide-react';
import { Language, getTranslation } from '../i18n/translations';

interface ToastNotificationContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onSelectArticle?: (article: NewsItem) => void;
  accentColor?: AccentColor;
  theme?: 'dark' | 'light';
  language?: Language;
}

export const ToastNotificationContainer: React.FC<ToastNotificationContainerProps> = ({
  toasts,
  onDismiss,
  onSelectArticle,
  accentColor,
  theme = 'dark',
  language = 'en',
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
          language={language}
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
  language?: Language;
  onDismiss: () => void;
  onSelectArticle?: (article: NewsItem) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({
  toast,
  acc,
  theme,
  language = 'en',
  onDismiss,
  onSelectArticle,
}) => {
  const t = getTranslation(language);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const DISMISS_MS = 7000;

  // Auto-dismiss with progress bar
  useEffect(() => {
    const start = Date.now();
    let animId: number;

    const tick = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, DISMISS_MS);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animId);
    };
  }, [onDismiss]);

  const handleClick = () => {
    if (toast.article && onSelectArticle) {
      onSelectArticle(toast.article);
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const isBreaking = toast.type === 'breaking' || toast.title.includes('URGENTE') || toast.title.includes('BREAKING');

  return (
    <div
      onClick={handleClick}
      style={{
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateX(100%) scale(0.95)' : 'translateX(0) scale(1)',
        transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
      }}
      className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl cursor-pointer group relative overflow-hidden backdrop-blur-md ${
        isBreaking
          ? theme === 'dark'
            ? `bg-neutral-900/95 border-red-500/80 text-white shadow-red-500/10`
            : `bg-white/95 border-red-500/80 text-neutral-900 shadow-xl`
          : theme === 'dark'
          ? `bg-neutral-900/95 border-neutral-700/80 text-white`
          : `bg-white/95 border-neutral-200 text-neutral-900`
      }`}>
      {/* Top Accent Line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isBreaking ? 'bg-gradient-to-r from-red-500 via-orange-500 to-amber-500' : acc.bg
        }`} />

      {/* Auto-dismiss progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-none"
        style={{
          width: `${progress}%`,
          backgroundColor: isBreaking ? '#ef4444' : '#f59e0b',
        }}
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
            }`}>
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
              }`}>
              {isBreaking ? t.toast.breakingTitle : t.toast.radarTitle}
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              {new Date().toLocaleTimeString(language === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
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
              <span>{t.toast.clickToRead}</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className={`absolute top-2.5 right-2.5 p-1 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'
          }`}
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
