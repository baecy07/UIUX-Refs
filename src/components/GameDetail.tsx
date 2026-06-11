import {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, ImageIcon, RefreshCw} from 'lucide-react';
import {fetchGameScreenshots, getPublicImageUrl} from '../lib/supabaseClient';
import type {Game, Screenshot} from '../types';
import ImageLightbox, {type LightboxItem} from './ImageLightbox';

interface GameDetailProps {
  game: Game;
  features: string[];
  onBack: () => void;
  onMessage: (message: string, type?: 'success' | 'error') => void;
}

const ALL_FEATURES = '__all__';

export default function GameDetail({game, features, onBack, onMessage}: GameDetailProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedFeature, setSelectedFeature] = useState(ALL_FEATURES);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
    setSelectedFeature(ALL_FEATURES);
    setSelectedIndex(null);
    void loadGameData();
  }, [game.id]);

  const sorted = useMemo(() => {
    const list = selectedFeature === ALL_FEATURES ? screenshots : screenshots.filter((item) => item.feature === selectedFeature);
    return [...list].sort((a, b) => {
      if (sortMode === 'recent') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return a.orderIndex - b.orderIndex || a.createdAt.localeCompare(b.createdAt);
    });
  }, [screenshots, selectedFeature, sortMode]);

  const grouped = useMemo(() => {
    if (selectedFeature !== ALL_FEATURES) {
      return [{feature: selectedFeature, items: sorted}];
    }

    const knownOrder = new Map(features.map((feature, index) => [feature, index]));
    const groups = new Map<string, Screenshot[]>();
    for (const screenshot of sorted) {
      groups.set(screenshot.feature, [...(groups.get(screenshot.feature) ?? []), screenshot]);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => (knownOrder.get(a) ?? 999) - (knownOrder.get(b) ?? 999) || a.localeCompare(b))
      .map(([feature, items]) => ({feature, items}));
  }, [features, selectedFeature, sorted]);

  const lightboxItems: LightboxItem[] = useMemo(() => sorted.map((screenshot) => ({
    id: screenshot.id,
    imageUrl: getPublicImageUrl(screenshot.imagePath),
    alt: `${game.name} ${screenshot.feature}`,
  })), [game.name, sorted]);

  function openScreenshot(screenshot: Screenshot) {
    const index = sorted.findIndex((item) => item.id === screenshot.id);
    setSelectedIndex(Math.max(0, index));
  }

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
              <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{game.genre || '장르 미입력'}</span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{screenshots.length}장</span>
            </div>
          </div>
          <button type="button" onClick={loadGameData} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50">
            <RefreshCw className="h-4 w-4" /> 새로고침
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-stone-200 bg-white/85 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <label className="block">
            <span className="text-sm font-black text-stone-800">기능 필터</span>
            <select className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-bold text-stone-800" value={selectedFeature} onChange={(event) => setSelectedFeature(event.target.value)}>
              <option value={ALL_FEATURES}>전체 기능</option>
              {features.map((feature) => <option key={feature} value={feature}>{feature}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-black text-stone-800">정렬</span>
            <select className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-bold text-stone-800" value={sortMode} onChange={(event) => setSortMode(event.target.value as 'order' | 'recent')}>
              <option value="order">정렬 순서</option>
              <option value="recent">최근 등록</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] bg-white/80 p-10 text-center font-bold text-stone-500">불러오는 중...</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-stone-300 bg-white/75 p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-3 font-bold text-stone-800">스크린샷이 없습니다.</p>
          <p className="mt-1 text-sm text-stone-500">설정에서 스크린샷을 업로드해주세요.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map((group) => (
            <section key={group.feature} className="space-y-4">
              {selectedFeature === ALL_FEATURES && (
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-stone-950">{group.feature}</h3>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600">{group.items.length}장</span>
                </div>
              )}
              <div className="grid gap-6 lg:grid-cols-2">
                {group.items.map((screenshot, index) => (
                  <button
                    key={screenshot.id}
                    type="button"
                    onClick={() => openScreenshot(screenshot)}
                    className="group text-left"
                  >
                    <div className="bg-[#050608]">
                      <img
                        src={getPublicImageUrl(screenshot.imagePath || screenshot.thumbPath)}
                        alt={`${game.name} ${screenshot.feature}`}
                        className="block h-auto max-h-[620px] w-full object-contain transition duration-200 group-hover:brightness-110"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-black text-stone-950">{game.name}</p>
                        <p className="text-sm font-bold text-stone-500">{screenshot.feature}</p>
                      </div>
                      <span className="rounded-md bg-stone-950 px-2 py-1 text-xs font-bold text-white">#{index + 1}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedIndex !== null && lightboxItems.length > 0 && (
        <ImageLightbox
          items={lightboxItems}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </section>
  );
}
