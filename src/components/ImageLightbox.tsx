import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, X} from 'lucide-react';

export interface LightboxItem {
  id: string;
  imageUrl: string;
  alt: string;
}

interface ImageLightboxProps {
  items: LightboxItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({items, initialIndex, onClose}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const hasMultiple = items.length > 1;
  const current = items[currentIndex] ?? items[0];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'ArrowLeft') {
        showPrevious();
      }
      if (event.key === 'ArrowRight') {
        showNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  function showPrevious() {
    setCurrentIndex((value) => (value - 1 + items.length) % items.length);
  }

  function showNext() {
    setCurrentIndex((value) => (value + 1) % items.length);
  }

  if (!current) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full border border-white/70 bg-black/40 p-3 text-white backdrop-blur transition hover:bg-white hover:text-black"
        aria-label="닫기"
      >
        <X className="h-6 w-6" />
      </button>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/50 bg-black/40 p-2 text-white backdrop-blur transition hover:bg-white hover:text-black sm:left-5 sm:p-3"
            aria-label="이전 이미지"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/50 bg-black/40 p-2 text-white backdrop-blur transition hover:bg-white hover:text-black sm:right-5 sm:p-3"
            aria-label="다음 이미지"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <img
        key={current.id}
        src={current.imageUrl}
        alt={current.alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[94vh] max-w-[96vw] rounded-[18px] border border-white/15 object-contain shadow-2xl"
      />
    </div>
  );
}
