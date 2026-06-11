import {X} from 'lucide-react';

interface ImageLightboxProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

export default function ImageLightbox({imageUrl, alt, onClose}: ImageLightboxProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full border border-white/70 bg-black/30 p-3 text-white backdrop-blur transition hover:bg-white hover:text-black"
        aria-label="닫기"
      >
        <X className="h-6 w-6" />
      </button>
      <img src={imageUrl} alt={alt} className="max-h-[92vh] max-w-[94vw] rounded-[22px] border border-white/20 object-contain shadow-2xl" />
    </div>
  );
}
