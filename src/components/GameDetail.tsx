import {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, ImageIcon, RefreshCw} from 'lucide-react';
import {fetchGameScreenshots, getPublicImageUrl} from '../lib/supabaseClient';
import type {Game, Screenshot} from '../types';
import ImageLightbox from './ImageLightbox';

interface GameDetailProps {
  game: Game;
  features: string[];
  onBack: () => void;
  onMessage: (message: string, type?: 'success' | 'error') => void;
}

export default function GameDetail({game, features, onBack, onMessage}: GameDetailProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedFeature, setSelectedFeature] = useState('전체');
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortMode, setSortMode] = useState<'order' | 'recent'>('order');

  async function loadGameData() {
    setLoading(true);
    try {
      setScreenshots(await fetchGameScreenshots(game.id));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '게임 상세 데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGameData();
  }, [game.id]);

  const filtered = useMemo(() => {
    const list = selectedFeature === '전체' ? screenshots : screenshots.filter((item) => item.feature === selectedFeature);
    return [...list].sort((a, b) => {
      if (sortMode === 'recent') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return a.orderIndex - b.orderIndex || a.createdAt.localeCompare(b.createdAt);
    });
  }, [screenshots, selectedFeature, sortMode]);

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-stone-200 bg-white/85 p-6 shadow-sm">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-900">
          <ArrowLeft className="h-4 w-4" /> 게임 목록
        </button>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-black text-stone-950">{game.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{game.description || '설명이 아직 등록되지 않았습니다.'}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{game.platform}</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{game.orientation}</span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{game.genre || '장르 미지정'}</span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{screenshots.length}장</span>
            </div>
          </div>
          <button type="button" onClick={loadGameData} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50">
            <RefreshCw className="h-4 w-4" /> 새로고침
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-stone-200 bg-white/85 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {['전체', ...features].map((feature) => (
              <button
                key={feature}
                type="button"
                onClick={() => setSelectedFeature(feature)}
                className={`rounded-full px-3 py-1.5 text-sm font-bold ${selectedFeature === feature ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
              >
                {feature}
              </button>
            ))}
          </div>
          <select className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold" value={sortMode} onChange={(event) => setSortMode(event.target.value as 'order' | 'recent')}>
            <option value="order">정렬 순서</option>
            <option value="recent">최근 등록</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] bg-white/80 p-10 text-center font-bold text-stone-500">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-stone-300 bg-white/75 p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-3 font-bold text-stone-800">스크린샷이 없습니다.</p>
          <p className="mt-1 text-sm text-stone-500">설정에서 스크린샷을 업로드해주세요.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {filtered.map((screenshot, index) => (
            <button
              key={screenshot.id}
              type="button"
              onClick={() => setSelectedScreenshot(screenshot)}
              className="group text-left"
            >
              <div className="inline-block max-w-full">
                <div className="bg-[#050608] p-0">
                  <img
                    src={getPublicImageUrl(screenshot.thumbPath)}
                    alt={`${game.name} ${screenshot.feature}`}
                    className="max-h-[520px] max-w-full object-contain transition duration-200 group-hover:brightness-110"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-stone-950">{game.name}</p>
                    <p className="text-sm font-bold text-stone-500">{screenshot.feature}</p>
                  </div>
                  <span className="rounded-md bg-stone-950 px-2 py-1 text-xs font-bold text-white">#{index + 1}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedScreenshot && (
        <ImageLightbox
          imageUrl={getPublicImageUrl(selectedScreenshot.imagePath)}
          alt={`${game.name} ${selectedScreenshot.feature}`}
          onClose={() => setSelectedScreenshot(null)}
        />
      )}
    </section>
  );
}
