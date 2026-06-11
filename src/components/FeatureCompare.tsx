import {useEffect, useMemo, useState} from 'react';
import {ChevronLeft, ChevronRight, Columns} from 'lucide-react';
import {LAST_FEATURE_KEY, PAGE_SIZE} from '../constants';
import {fetchScreenshotsByFeature, getPublicImageUrl} from '../lib/supabaseClient';
import type {Game, Screenshot} from '../types';
import ImageLightbox, {type LightboxItem} from './ImageLightbox';

interface FeatureCompareProps {
  games: Game[];
  features: string[];
  onMessage: (message: string, type?: 'success' | 'error') => void;
}

export default function FeatureCompare({games, features, onMessage}: FeatureCompareProps) {
  const [feature, setFeature] = useState(() => sessionStorage.getItem(LAST_FEATURE_KEY) || features[2] || features[0] || '로비');
  const [gameId, setGameId] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      sessionStorage.setItem(LAST_FEATURE_KEY, feature);
      const result = await fetchScreenshotsByFeature({feature, gameId, page, pageSize: PAGE_SIZE});
      setScreenshots(result.screenshots);
      setCount(result.count);
      setSelectedIndex(null);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '기능별 데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [feature, gameId, page]);

  const lightboxItems: LightboxItem[] = useMemo(() => screenshots.map((screenshot) => ({
    id: screenshot.id,
    imageUrl: getPublicImageUrl(screenshot.imagePath),
    alt: `${screenshot.game?.name || '게임'} ${screenshot.feature}`,
  })), [screenshots]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <section className="space-y-8">
      <div className="rounded-[28px] border border-stone-200 bg-white/85 p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(220px,0.45fr)_1fr] lg:items-end">
          <div>
            <label className="text-sm font-black text-stone-800">분석 대상 기능 선택</label>
            <select
              className="mt-3 w-full rounded-2xl border border-stone-300 bg-white px-4 py-4 text-base font-black text-stone-950"
              value={feature}
              onChange={(event) => {
                setPage(0);
                setFeature(event.target.value);
              }}
            >
              {features.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-black text-stone-800">게임 선택</label>
            <select
              className="mt-3 w-full rounded-2xl border border-stone-300 bg-white px-4 py-4 text-base font-bold text-stone-800"
              value={gameId}
              onChange={(event) => {
                setPage(0);
                setGameId(event.target.value);
              }}
            >
              <option value="">전체 게임</option>
              {games.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}
            </select>
          </div>

          <p className="text-right text-sm font-bold text-stone-500">
            검색 결과: <span className="text-stone-950">{count}개</span>의 레퍼런스가 나열되었습니다.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm font-bold text-stone-600">
        <button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded-xl border border-stone-300 bg-white p-2 disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>{page + 1} / {totalPages}</span>
        <button disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-xl border border-stone-300 bg-white p-2 disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="rounded-[28px] bg-white/80 p-10 text-center font-bold text-stone-500">불러오는 중...</div>
      ) : screenshots.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-stone-300 bg-white/75 p-10 text-center">
          <Columns className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-3 font-bold text-stone-800">비교할 스크린샷이 없습니다.</p>
          <p className="mt-1 text-sm text-stone-500">설정에서 해당 기능의 스크린샷을 업로드해주세요.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {screenshots.map((screenshot, index) => (
            <button key={screenshot.id} type="button" onClick={() => setSelectedIndex(index)} className="group text-left">
              <div className="bg-[#050608]">
                <img
                  src={getPublicImageUrl(screenshot.imagePath || screenshot.thumbPath)}
                  alt={`${screenshot.game?.name || '게임'} ${screenshot.feature}`}
                  className="block h-auto max-h-[620px] w-full object-contain transition duration-200 group-hover:brightness-110"
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-stone-950">{screenshot.game?.name || 'Unknown Game'}</p>
                  <p className="text-sm font-bold text-stone-500">{screenshot.feature}</p>
                </div>
                <div className="flex items-center gap-2">
                  {screenshot.tags.slice(0, 2).map((item) => <span key={item} className="rounded-md bg-stone-100 px-2 py-1 text-xs font-bold text-stone-600">#{item}</span>)}
                  <span className="rounded-md bg-stone-950 px-2 py-1 text-xs font-bold text-white">#{index + 1}</span>
                </div>
              </div>
            </button>
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
