import {FormEvent, useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, Columns, Search} from 'lucide-react';
import {LAST_FEATURE_KEY, PAGE_SIZE} from '../constants';
import {fetchScreenshotsByFeature, getPublicImageUrl} from '../lib/supabaseClient';
import type {Game, Screenshot} from '../types';

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
    <section className="space-y-5">
      <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
        <p className="text-sm font-bold text-emerald-700">Feature Compare</p>
        <h2 className="mt-1 text-2xl font-black text-stone-950">기능별 비교</h2>
        <p className="mt-1 text-sm text-stone-500">같은 기능 화면을 여러 게임에서 나란히 보고 패턴을 비교합니다.</p>
      </div>

      <form onSubmit={handleSearch} className="grid gap-3 rounded-3xl border border-stone-200 bg-white/85 p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
        <select className="rounded-xl border border-stone-300 px-3 py-2" value={feature} onChange={(event) => { setPage(0); setFeature(event.target.value); }}>
          {features.map((item) => <option key={item}>{item}</option>)}
        </select>
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
          <input className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목/메모 검색" />
          <button className="rounded-xl bg-stone-900 px-3 text-white"><Search className="h-4 w-4" /></button>
        </div>
      </form>

      <div className="flex items-center justify-between rounded-3xl border border-stone-200 bg-white/85 p-4 text-sm font-bold text-stone-600">
        <span>{count}개 결과</span>
        <div className="flex items-center gap-2">
          <button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded-xl border border-stone-300 bg-white p-2 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-xl border border-stone-300 bg-white p-2 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white/80 p-10 text-center font-bold text-stone-500">불러오는 중...</div>
      ) : screenshots.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/75 p-10 text-center">
          <Columns className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-3 font-bold text-stone-800">비교할 스크린샷이 없습니다.</p>
          <p className="mt-1 text-sm text-stone-500">필터를 줄이거나 해당 기능의 스크린샷을 업로드해주세요.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {screenshots.map((screenshot) => (
            <article key={screenshot.id} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
              <div className="aspect-video bg-stone-950">
                <img src={getPublicImageUrl(screenshot.thumbPath)} alt={screenshot.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <p className="text-xs font-black text-emerald-700">{screenshot.game?.name || 'Unknown Game'}</p>
                <h3 className="mt-1 line-clamp-2 font-black text-stone-950">{screenshot.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-stone-500">{screenshot.memo || '메모 없음'}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
