import {Gamepad2, Monitor, Smartphone} from 'lucide-react';
import {getPublicImageUrl} from '../lib/supabaseClient';
import type {Game} from '../types';

interface GameListProps {
  games: Game[];
  onSelectGame: (gameId: string) => void;
}

export default function GameList({games, onSelectGame}: GameListProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-stone-200 bg-white/85 p-6 shadow-sm">
        <p className="text-sm font-bold text-emerald-700">Game Library</p>
        <h2 className="mt-1 text-2xl font-black text-stone-950">게임 레퍼런스</h2>
        <p className="mt-1 text-sm text-stone-500">게임을 선택해 등록된 UI 스크린샷을 이미지 중심으로 확인합니다. 대표 이미지는 타이틀 화면을 우선 사용합니다.</p>
      </div>

      {games.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-stone-300 bg-white/75 p-12 text-center">
          <Gamepad2 className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-3 font-bold text-stone-800">등록된 게임이 없습니다.</p>
          <p className="mt-1 text-sm text-stone-500">설정에서 편집 잠금을 해제한 뒤 게임을 등록해주세요.</p>
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-2">
          {games.map((game) => {
            const coverPath = game.titleThumbPath || game.titleImagePath || game.coverThumbPath || game.coverImagePath;
            const coverUrl = getPublicImageUrl(coverPath);
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => onSelectGame(game.id)}
                className="group overflow-hidden rounded-[30px] border border-stone-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="flex h-[360px] items-center justify-center bg-[#050608] p-2 md:h-[430px]">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={game.name}
                      className="h-full w-full rounded-[22px] object-contain transition duration-300 group-hover:scale-[1.01] group-hover:brightness-110"
                    />
                  ) : (
                    <Gamepad2 className="h-16 w-16 text-stone-600" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-stone-950">{game.name}</h3>
                      <p className="mt-1 text-sm text-stone-500">{game.genre || '장르 미지정'}</p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600">{game.screenshotCount ?? 0}장</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
                      {game.platform === 'Mobile' ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                      {game.platform}
                    </span>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">{game.orientation}</span>
                    {(game.titleThumbPath || game.titleImagePath) && <span className="rounded-full bg-stone-950 px-2.5 py-1 text-white">타이틀 대표</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
