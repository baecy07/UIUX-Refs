import {FormEvent, useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, Columns, Search} from 'lucide-react';
import {LAST_FEATURE_KEY, PAGE_SIZE} from '../constants';
import {fetchScreenshotsByFeature, getPublicImageUrl} from '../lib/supabaseClient';
import type {Game, Screenshot} from '../types';
import ImageLightbox from './ImageLightbox';

interface FeatureCompareProps {
  games: Game[];
  features: string[];
  onMessage: (message: string, type?: 'success' | 'error') => void;
}

export default function FeatureCompare({games, features, onMessage}: FeatureCompareProps) {
  const [feature, setFeature] = useState(() => sessionStorage.getItem(LAST_FEATURE_KEY) || features[2] || features[0] || '로비');
  const [gameId, setGameId] = useState('');
  const [platform, setPlatform] = useState('');
  const [orientation, setOrientation] = useState('');
  const [tag, setTag] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      sessionStorage.setItem(LAST_FEATURE_KEY, feature);
      const result = await fetchScreenshotsByFeature({feature, gameId, platform, orientation, tag, query, page, pageSize: PAGE_SIZE});
      setScreenshots(result.screenshots);
      setCount(result.count);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '비교 데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [feature, gameId, platform, orientation, tag, page]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    void load();
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <section className="space-y-8">
      <form onSubmit={handleSearch} className="rounded-[28px] border border-stone-200 bg-white/85 p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_1fr] lg:items-end">
          <div>
            <label className="text-sm font-black text-stone-800">분석 대상 인터랙션 기능 선택:</label>
            <select className="mt-3 w-full rounded-2xl border border-stone-300 bg-white px-4 py-4 text-base font-black text-stone-950" value={feature} onChange={(event) => { setPage(0); setFeature(event.target.value); }}>
              {features.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <p className="text-right text-sm font-bold text-stone-500">검색 결과: <span className="text-stone-950">{count}개</span>의 레퍼런스가 나열되었습니다.</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select className="rounded-xl border border-stone-300 px-3 py-2" value={gameId} onChange={(event) => { setPage(0); setGameId(event.target.value); }}>
            <option value="">전체 게임</option>
            {games.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}
          </select>
          <select className="rounded-xl border border-stone-300 px-3 py-2" value={platform} onChange={(event) => { setPage(0); setPlatform(event.target.value); }}>
            <option value="">전체 플랫폼</option>
            <option>Mobile</option>
            <option>PC</option>
            <option>Console</option>
            <option>Cross-platform</option>
          </select>
          <select className="rounded-xl border border-stone-300 px-3 py-2" value={orientation} onChange={(event) => { setPage(0); setOrientation(event.target.value); }}>
            <option value="">전체 방향</option>
            <option>Landscape</option>
            <option>Portrait</option>
          </select>
          <input className="rounded-xl border border-stone-300 px-3 py-2" value={tag} onChange={(event) => setTag(event.target.value)} onBlur={() => { setPage(0); void load(); }} placeholder="태그" />
          <div className="flex gap-2">
            <input className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="메모 검색" />
            <button className="rounded-xl bg-stone-900 px-3 text-white"><Search className="h-4 w-4" /></button>
          </div>
        </div>
      </form>

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
          <p className="mt-1 text-sm text-stone-500">필터를 줄이거나 설정에서 해당 기능의 스크린샷을 업로드해주세요.</p>
        </div>
      ) : (
        <div className="grid gap-10">
          {screenshots.map((screenshot, index) => (
            <button key={screenshot.id} type="button" onClick={() => setSelectedScreenshot(screenshot)} className="group text-left">
              <div className="inline-block max-w-full">
                <div className="bg-[#050608]">
                  <img
                    src={getPublicImageUrl(screenshot.thumbPath)}
                    alt={`${screenshot.game?.name || '게임'} ${screenshot.feature}`}
                    className="max-h-[560px] max-w-full object-contain transition duration-200 group-hover:brightness-110"
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
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedScreenshot && (
        <ImageLightbox
          imageUrl={getPublicImageUrl(selectedScreenshot.imagePath)}
          alt={`${selectedScreenshot.game?.name || '게임'} ${selectedScreenshot.feature}`}
          onClose={() => setSelectedScreenshot(null)}
        />
      )}
    </section>
  );
}
