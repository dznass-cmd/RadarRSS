import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Star,
  Coins,
  Heart,
  Globe
} from 'lucide-react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  onTriggerToast?: (toast: {
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  }) => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
  onTriggerToast,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);

  const binanceWallet = '0xbc1ce0b7d0e5bc3332502bb82cf34125e3062b86';

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(binanceWallet);
      setCopied(true);
      if (onTriggerToast) {
        onTriggerToast({
          title: 'Copied to Clipboard!',
          message: 'Binance deposit address copied successfully.',
          type: 'success',
        });
      }
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-[#0c0d12] border-neutral-800 text-neutral-100 shadow-amber-500/5'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
            isDark ? 'border-neutral-800/80 bg-neutral-950/40' : 'border-neutral-200 bg-neutral-50/60'
          }`}
        >
          <button
            onClick={onClose}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
              isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider">Donate</h2>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
          
          {/* Card 1: Monthly Development Goal */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark
                ? 'bg-neutral-900/70 border-neutral-800/80'
                : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <h3 className="font-extrabold text-sm sm:text-base leading-tight">
              November Radar RSS development goal
            </h3>
            <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
              November 2026
            </span>

            <p className="text-xs text-neutral-400 mt-2.5 leading-relaxed">
              Monthly support covers server capacity, AI provider tokens (Google Gemini), development tools, and testing devices.
            </p>

            {/* Goal Progress */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-black text-amber-400">68%</span>
                <span className="text-[10px] font-mono text-neutral-400">Goal: $250 / mo</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${
                isDark ? 'bg-neutral-800' : 'bg-neutral-200'
              }`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-1000 shadow-xs"
                  style={{ width: '68%' }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Support Radar RSS (Binance Wallet) */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark
                ? 'bg-neutral-900/70 border-neutral-800/80'
                : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center justify-between">
              <span>Support Radar RSS</span>
              <span className="text-[9px] font-mono text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                Binance / Web3
              </span>
            </h3>

            {/* Binance USDT/BNB Box */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all ${
                isDark
                  ? 'bg-neutral-950/80 border-neutral-800 hover:border-amber-500/40'
                  : 'bg-white border-neutral-200 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F3BA2F]/15 border border-[#F3BA2F]/30 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4 text-[#F3BA2F]" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-neutral-100 leading-none">
                      USDT / BNB (BEP20)
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                      Binance Smart Chain (BSC)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowQr(!showQr)}
                  title={showQr ? 'Hide QR Code' : 'Show QR Code'}
                  className={`p-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                    showQr
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : isDark
                      ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:text-black'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden xs:inline">{showQr ? 'Close QR' : 'QR'}</span>
                </button>
              </div>

              {/* QR Code Container */}
              {showQr && (
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white border border-neutral-700 animate-in fade-in duration-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${binanceWallet}`}
                    alt="Binance Wallet QR Code"
                    className="w-36 h-36 rounded-md shadow-sm"
                  />
                  <span className="text-[10px] font-mono text-neutral-800 mt-2 font-bold">
                    Scan with Binance App (BEP20)
                  </span>
                </div>
              )}

              {/* Address with Copy Button */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="font-mono text-[10.5px] text-neutral-300 truncate select-all">
                  {binanceWallet}
                </span>

                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all cursor-pointer shrink-0 ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-amber-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <span className="text-[9.5px] text-neutral-500 font-mono leading-tight">
                💡 Compatible with USDT, USDC, BNB, ETH on BEP-20, ERC-20, and Polygon networks.
              </span>
            </div>

            {/* GitHub Sponsors Link */}
            <a
              href="https://github.com/dznass-cmd/RadarRSS"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3 rounded-xl border flex items-center justify-between transition-all group ${
                isDark
                  ? 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                  : 'bg-white border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-200">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-xs text-neutral-100 group-hover:text-amber-400 transition-colors">
                    GitHub Repository & Star
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    github.com/dznass-cmd/RadarRSS
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 transition-colors" />
            </a>
          </div>

          {/* Card 3: Recent Supporters */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 ${
              isDark
                ? 'bg-neutral-900/70 border-neutral-800/80'
                : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Recent Supporters</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Thank you for your generosity! Every contribution keeps the project free and open-source.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {['ObviousNPC', 'Tarik', 'CyberRadar', 'DevCommunity', 'AnonSupporter', 'You? ❤️'].map(
                (name, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-colors ${
                      name.includes('You')
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : isDark
                        ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
                        : 'bg-white border-neutral-200 text-neutral-700'
                    }`}
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
