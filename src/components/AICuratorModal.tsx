import React, { useState } from 'react';
import { X, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { DynamicBlock } from '../types';
import { curateBlockWithAi } from '../services/apiAdapter';
import { Language, getTranslation } from '../i18n/translations';

interface AICuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlockCurated: (block: DynamicBlock) => void;
  theme: 'dark' | 'light';
  language?: Language;
}

export const AICuratorModal: React.FC<AICuratorModalProps> = ({
  isOpen,
  onClose,
  onBlockCurated,
  theme,
  language = 'en',
}) => {
  const t = getTranslation(language);
  const [prompt, setPrompt] = useState<string>('');
  const [isCurating, setIsCurating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCurate = async (textToUse?: string) => {
    const finalPrompt = textToUse || prompt;
    if (!finalPrompt.trim()) return;

    setIsCurating(true);
    setErrorMsg(null);

    try {
      const data = await curateBlockWithAi(finalPrompt);

      if (data.success && data.blockConfig) {
        const config = data.blockConfig;
        const newBlock: DynamicBlock = {
          id: `ai_block_${Date.now()}`,
          title: config.title || (language === 'pt' ? '🤖 Bloco Curado por IA' : '🤖 AI Curated Block'),
          categoryFilter: config.categoryFilter || 'all',
          filterKeyword: config.filterKeyword,
          layout: config.layout || 'grid',
          itemCount: config.itemCount || 6,
          autoRefreshSec: 120,
          isPinned: true,
          accentColor: 'from-purple-600 to-indigo-600',
        };
        onBlockCurated(newBlock);
        onClose();
      } else {
        setErrorMsg(data.error || t.aiCurator.errorMessage);
      }
    } catch (err: any) {
      setErrorMsg(t.aiCurator.networkError);
    } finally {
      setIsCurating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
        theme === 'dark' ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
      }`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          theme === 'dark' ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h3 className="font-black text-sm uppercase tracking-wider text-orange-500">
              {t.aiCurator.title} ({t.aiCurator.poweredBy})
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              theme === 'dark' ? 'hover:bg-neutral-800 border-neutral-700 text-neutral-300' : 'hover:bg-neutral-200 border-neutral-300 text-neutral-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-400 leading-relaxed font-sans">
            {t.aiCurator.subtitle}
          </p>

          <div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.aiCurator.placeholder}
              className={`w-full p-3.5 text-xs font-mono rounded-2xl border outline-none resize-none ${
                theme === 'dark' ? 'bg-neutral-950 border-neutral-800 focus:border-orange-500' : 'bg-neutral-50 border-neutral-200'
              }`}
            />
          </div>

          {/* Example Prompt Chips */}
          <div>
            <span className="block text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2">
              {t.aiCurator.exampleTitle}
            </span>
            <div className="space-y-1.5">
              {t.aiCurator.examples.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPrompt(ex);
                    handleCurate(ex);
                  }}
                  className={`w-full text-left p-2.5 rounded-2xl border text-[11px] font-bold transition-all flex items-center justify-between group cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-neutral-950/60 border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-800'
                      : 'bg-neutral-50 border-neutral-200 hover:border-orange-500/50'
                  }`}
                >
                  <span className="truncate">{ex}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 font-bold">
              {errorMsg}
            </p>
          )}

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              onClick={() => handleCurate()}
              disabled={isCurating || !prompt.trim()}
              className="w-full py-3.5 px-4 rounded-2xl font-black uppercase tracking-wider text-xs bg-orange-500 hover:bg-orange-400 text-black shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCurating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>{t.aiCurator.curating}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>{t.aiCurator.generateButton}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
