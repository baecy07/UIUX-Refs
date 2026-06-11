import {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, ArrowRight, ImageIcon, Plus, RefreshCw} from 'lucide-react';
import {fetchGameFlows, fetchGameScreenshots, getPublicImageUrl} from '../lib/supabaseClient';
import type {Flow, Game, Screenshot} from '../types';
import ScreenshotDetailModal from './ScreenshotDetailModal';

interface GameDetailProps {
  game: Game;
  games: Game[];
  features: string[];
  editUnlocked: boolean;
  adminPassword: string;
  onBack: () => void;
  onUpload: (gameId: string) => void;
  onMessage: (message: string, type?: 'success' | 'error') => void;
  onRefreshGames: () => Promise<void>;
}

export default function GameDetail({game, games, features, editUnlocked, adminPassword, onBack, onUpload, onMessage, onRefreshGames}: GameDetailProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFeature, setSelectedFeature] = useState('전체');
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortMode, setSortMode] = useState<'order' | 'recent'>('order');

  async function loadGameData() {
    setLoading(true);
    try {
      const [screenData, flowData] = await Promise.all([fetchGameScreenshots(game.id), fetchGameFlows(game.id)]);
      setScreenshots(screenData);
      setFlows(flowData);
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

  const flowOrdered = useMemo(() => {
    const ids = new Set(flows.flatMap((flow) => [flow.fromScreenId, flow.toScreenId]));
    const related = screenshots.filter((item) => ids.has(item.id));
    return related.length ? related.sort((a, b) => a.orderIndex - b.orderIndex) : screenshots.slice(0, 8);
  }, [flows, screenshots]);

  async function handleModalChanged() {
    await loadGameData();
    await onRefreshGames();
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-900">
              <ArrowLeft className="h-4 w-4" /> 게임 목록
            </button>
            <h2 className="mt-3 text-3xl font-black text-stone-950">{game.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{game.description || '설명이 아직 등록되지 않았습니다.'}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{game.platform}</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{game.orientation}</span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{game.genre || '장르 미지정'}</span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{screenshots.length}장</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadGameData} className="inline-flex items-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50">
              <RefreshCw className="h-4 w-4" /> 새로고침
            </button>
            {editUnlocked && (
              <button type="button" onClick={() => onUpload(game.id)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">
                <Plus className="h-4 w-4" /> 업로드
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white/85 p-4 shadow-sm">
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
        <div className="rounded-3xl bg-white/80 p-10 text-center font-bold text-stone-500">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/75 p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-3 font-bold text-stone-800">스크린샷이 없습니다.</p>
          <p className="mt-1 text-sm text-stone-500">편집 가능 상태에서 업로드를 시작해주세요.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((screenshot) => (
            <button key={screenshot.id} type="button" onClick={() => setSelectedScreenshot(screenshot)} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="aspect-video bg-stone-950">
                <img src={getPublicImageUrl(screenshot.thumbPath)} alt={screenshot.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <p className="text-xs font-black text-emerald-700">{screenshot.feature}</p>
                <h3 className="mt-1 line-clamp-2 font-black text-stone-950">{screenshot.title}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {screenshot.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-600">#{tag}</span>)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-stone-950">UI 플로우</h3>
            <p className="mt-1 text-sm text-stone-500">연결된 화면과 액션 라벨을 빠르게 확인합니다.</p>
          </div>
        </div>
        {flowOrdered.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm text-stone-500">아직 플로우를 구성할 스크린샷이 없습니다.</p>
        ) : (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {flowOrdered.map((screen, index) => {
              const nextFlow = flows.find((flow) => flow.fromScreenId === screen.id);
              return (
                <div key={screen.id} className="flex shrink-0 items-center gap-3">
                  <button type="button" onClick={() => setSelectedScreenshot(screen)} className="w-52 overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm">
                    <img src={getPublicImageUrl(screen.thumbPath)} alt={screen.title} className="h-28 w-full bg-stone-950 object-cover" />
                    <div className="p-3">
                      <p className="truncate text-sm font-black text-stone-900">{screen.title}</p>
                      <p className="truncate text-xs font-bold text-emerald-700">{screen.feature}</p>
                    </div>
                  </button>
                  {index < flowOrdered.length - 1 && (
                    <div className="flex flex-col items-center text-stone-500">
                      <ArrowRight className="h-5 w-5" />
                      <span className="mt-1 max-w-24 truncate text-xs font-bold">{nextFlow?.action || '다음'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedScreenshot && (
        <ScreenshotDetailModal
          screenshot={selectedScreenshot}
          screenshots={screenshots}
          flows={flows}
          games={games}
          features={features}
          editUnlocked={editUnlocked}
          adminPassword={adminPassword}
          onClose={() => setSelectedScreenshot(null)}
          onChanged={handleModalChanged}
          onMessage={onMessage}
        />
      )}
    </section>
  );
}
