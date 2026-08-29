import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Share2,
  Check,
  Languages,
  BookOpen,
  Type,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { NewsItem, AccentColor } from '../types';
import { getAccent } from '../utils/theme';
import { SafeImage } from './SafeImage';
import { summarizeBlockWithAi, translateWithAi } from '../services/apiAdapter';
import { shareArticle } from '../services/shareService';

interface ArticleReaderModalProps {
  article: NewsItem | null;
  onClose: () => void;
  onToggleBookmark: (item: NewsItem) => void;
  isBookmarked: boolean;
  theme: 'dark' | 'light';
  accentColor?: AccentColor;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  onClose,
  onToggleBookmark,
  isBookmarked,
  theme,
  accentColor,
}) => {
  const acc = getAccent(accentColor);
  const [isPlayingTts, setIsPlayingTts] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Focus Reader Mode States
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl' | '2xl'>('lg');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');

  useEffect(() => {
    // Reset state when article changes
    setAiSummary(null);
    setTranslatedText(null);
    setIsFocusMode(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
    }
  }, [article]);

  if (!article) return null;

  // Web Speech API Text-to-Speech
  const handleToggleTts = () => {
    if (!('speechSynthesis' in window)) {
      alert('A leitura em voz alta não é suportada por este navegador.');
      return;
    }

    if (isPlayingTts) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
    } else {
      const textToRead = `${article.title}. ${article.contentSnippet}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;

      utterance.onend = () => setIsPlayingTts(false);
      utterance.onerror = () => setIsPlayingTts(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingTts(true);
    }
  };

  // Generate AI Executive Summary with Gemini
  const handleGenerateAiSummary = async () => {
    try {
      setIsGeneratingAi(true);
      const data = await summarizeBlockWithAi([article], article.title);
      if (data.success && data.summary) {
        setAiSummary(data.summary);
      } else {
        alert(data.error || 'Erro ao gerar resumo');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao se conectar ao serviço da IA');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Gemini AI Translate
  const handleTranslate = async () => {
    try {
      setIsTranslating(true);
      const data = await translateWithAi(article.title, article.contentSnippet);
      if (data.success && data.translation) {
        setTranslatedText(data.translation);
      } else {
        alert(data.error || 'Erro ao traduzir notícia.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao se conectar para tradução.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Share / Copy Link
  const handleShare = async () => {
    const res = await shareArticle({
      title: article.title,
      text: article.contentSnippet,
      url: article.link,
      dialogTitle: 'Compartilhar Notícia - Radar RSS',
    });
    if (res.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const increaseFontSize = () => {
    if (fontSize === 'sm') setFontSize('base');
    else if (fontSize === 'base') setFontSize('lg');
    else if (fontSize === 'lg') setFontSize('xl');
    else if (fontSize === 'xl') setFontSize('2xl');
  };

  const decreaseFontSize = () => {
    if (fontSize === '2xl') setFontSize('xl');
    else if (fontSize === 'xl') setFontSize('lg');
    else if (fontSize === 'lg') setFontSize('base');
    else if (fontSize === 'base') setFontSize('sm');
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm leading-relaxed';
      case 'base': return 'text-base leading-relaxed';
      case 'lg': return 'text-lg leading-loose';
      case 'xl': return 'text-xl leading-loose';
      case '2xl': return 'text-2xl leading-loose';
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      case 'sans': return 'font-sans';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className={`relative w-full ${isFocusMode ? 'max-w-3xl h-[95vh]' : 'max-w-2xl max-h-[90vh]'} rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
        }`}>

        {/* Top Header Bar */}
        <div className={`p-4 border-b flex items-center justify-between gap-3 shrink-0 ${theme === 'dark' ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
          }`}>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${acc.bg} text-black tracking-wider shrink-0`}>
              {article.sourceName}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 hidden sm:flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              {article.pubDate}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Focus Reader Toggle */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              title={isFocusMode ? 'Sair do Modo Focado' : 'Ativar Modo Leitura Focado'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${isFocusMode
                  ? `${acc.bg} text-black ${acc.border} shadow-md`
                  : theme === 'dark' ? `bg-neutral-800 border-neutral-700 ${acc.textDark} hover:bg-neutral-700` : `bg-neutral-200 border-neutral-300 ${acc.textLight} hover:bg-neutral-300`
                }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden xs:inline">{isFocusMode ? 'Sair Foco' : 'Modo Foco'}</span>
            </button>

            {/* Font Size & Type Controls (visible in Focus Mode or toggleable) */}
            {isFocusMode && (
              <div className={`flex items-center p-0.5 rounded-xl border ${theme === 'dark' ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-200 border-neutral-300'
                }`}>
                <button
                  onClick={decreaseFontSize}
                  title="Diminuir fonte"
                  className={`p-1.5 ${acc.textHover} transition-colors`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold px-1 uppercase text-neutral-400">
                  {fontSize}
                </span>
                <button
                  onClick={increaseFontSize}
                  title="Aumentar fonte"
                  className={`p-1.5 ${acc.textHover} transition-colors`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-neutral-700 mx-1" />

                <button
                  onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : fontFamily === 'sans' ? 'mono' : 'serif')}
                  title="Alternar Fonte (Serif / Sans / Mono)"
                  className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${acc.textHover} transition-colors`}
                >
                  {fontFamily}
                </button>
              </div>
            )}

            {!isFocusMode && (
              <>
                <button
                  onClick={handleShare}
                  title="Copiar link"
                  className={`p-2 rounded-xl border transition-colors ${copied ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700' : 'hover:bg-neutral-200 border-neutral-300'
                    }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => onToggleBookmark(article)}
                  title="Salvar notícia"
                  className={`p-2 rounded-xl border transition-colors ${isBookmarked ? `${acc.bgLight} ${acc.borderLight} ${acc.textDark}` : theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700' : 'hover:bg-neutral-200 border-neutral-300'
                    }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? `${acc.fill}` : ''}`} />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700' : 'hover:bg-neutral-200 border-neutral-300'
                }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div className={`p-6 sm:p-10 overflow-y-auto space-y-6 flex-1 ${isFocusMode ? 'max-w-2xl mx-auto w-full' : ''}`}>

          {/* Focus Mode Indicator Banner */}
          {isFocusMode && (
            <div className={`flex items-center justify-between text-[11px] font-mono ${acc.textDark} ${acc.bgLight} px-4 py-2 rounded-2xl border ${acc.borderLight}`}>
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest">
                <BookOpen className={`w-4 h-4 ${acc.text}`} />
                Leitor Focado Ativo
              </span>
              <span className="text-neutral-400 text-[10px]">Livre de distrações</span>
            </div>
          )}

          {/* Article Image Banner */}
          {!isFocusMode && article.imageUrl && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800">
              <SafeImage
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                sourceName={article.sourceName}
              />
            </div>
          )}

          {/* Title & Author */}
          <div>
            <h2 className={`${isFocusMode ? 'text-2xl sm:text-3xl font-black' : 'text-xl sm:text-2xl font-black'} leading-tight mb-3 ${getFontFamilyClass()}`}>
              {article.title}
            </h2>
            {article.author && (
              <p className="text-xs text-neutral-400 font-mono">
                Por {article.author}
              </p>
            )}
          </div>

          {/* Interactive AI & Audio Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-b border-neutral-800 py-3">

            {/* Audio TTS Button */}
            <button
              onClick={handleToggleTts}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${isPlayingTts
                  ? `${acc.bg} text-black ${acc.border} animate-pulse`
                  : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                }`}
            >
              {isPlayingTts ? <VolumeX className="w-4 h-4 text-black" /> : <Volume2 className={`w-4 h-4 ${acc.textDark}`} />}
              <span>{isPlayingTts ? 'Parar Leitura' : 'Ouvir Notícia'}</span>
            </button>

            {/* AI Summary Button */}
            <button
              onClick={handleGenerateAiSummary}
              disabled={isGeneratingAi}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${acc.bg} text-black ${acc.bgHover} transition-all`}
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? 'Sintetizando...' : 'Resumo IA'}</span>
            </button>

            {/* AI Translate Button */}
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 transition-all"
            >
              <Languages className={`w-4 h-4 ${isTranslating ? 'animate-spin' : ''}`} />
              <span>{isTranslating ? 'Traduzindo...' : 'Traduzir'}</span>
            </button>
          </div>

          {/* AI Generated Summary Box */}
          {aiSummary && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${theme === 'dark' ? `${acc.bgLight} ${acc.borderLight} text-neutral-200` : `${acc.bgLight} ${acc.borderLight} text-neutral-900`
              }`}>
              <div className={`flex items-center gap-2 font-black uppercase ${acc.textDark} mb-2 tracking-wider`}>
                <Sparkles className="w-4 h-4" />
                <span>Resumo Executivo da IA (Gemini):</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{aiSummary}</div>
            </div>
          )}

          {/* Translation Box */}
          {translatedText && (
            <div className="p-4 rounded-2xl border border-neutral-700 bg-neutral-800/80 text-xs leading-relaxed">
              <div className={`font-black uppercase ${acc.textDark} mb-2 tracking-wider`}>
                Tradução em Português:
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{translatedText}</div>
            </div>
          )}

          {/* Article Snippet / Description formatted with Focus font and size */}
          <div className={`prose prose-invert max-w-none ${getFontSizeClass()} ${getFontFamilyClass()} ${theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'
            }`}>
            {article.contentSnippet}
          </div>

          {/* Source Link CTA Button */}
          <div className="pt-6">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black uppercase tracking-wider text-xs ${acc.bg} ${acc.bgHover} text-black shadow-xl transition-all`}
            >
              <span>Abrir matéria completa em {article.sourceName}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

