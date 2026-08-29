import React, { useState, useMemo } from 'react';
import { Newspaper } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackType?: 'default' | 'square';
  sourceName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  fallbackType = 'default',
  sourceName
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Normalize image URL: unescape HTML entities, upgrade http to https when possible
  const sanitizedSrc = useMemo(() => {
    if (!src) return '';
    let url = src.trim().replace(/&amp;/g, '&');
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }
    return url;
  }, [src]);

  // If there's no source image, or if it failed to load, show a beautiful fallback placeholder.
  if (error || !sanitizedSrc) {
    return (
      <div 
        className={`w-full h-full min-h-[inherit] bg-gradient-to-br from-neutral-800/40 via-neutral-900/60 to-neutral-950 flex flex-col items-center justify-center text-neutral-500 relative border border-neutral-800/30 select-none ${containerClassName}`}
      >
        <Newspaper className={fallbackType === 'square' ? 'w-5 h-5 opacity-40' : 'w-10 h-10 opacity-30 mb-2'} />
        {fallbackType !== 'square' && sourceName && (
          <span className="text-[10px] font-black tracking-widest text-neutral-400/40 uppercase font-mono">
            {sourceName}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${containerClassName}`}>
      {loading && (
        <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-neutral-700 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
      <img
        src={sanitizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
};
