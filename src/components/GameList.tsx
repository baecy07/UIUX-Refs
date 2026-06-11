import {FormEvent, useState} from 'react';
import {Edit2, Gamepad2, Monitor, Plus, Smartphone, Trash2} from 'lucide-react';
import {ORIENTATIONS, PLATFORMS} from '../constants';
import {createGame, deleteGame, updateGame} from '../lib/apiClient';
import {getPublicImageUrl} from '../lib/supabaseClient';
import type {Game, GameFormInput, Orientation, Platform} from '../types';

interface GameListProps {
  games: Game[];
  editUnlocked: boolean;
  adminPassword: string;
  onSelectGame: (gameId: string) => void;
  onRefresh: () => Promise<void>;
  onMessage: (message: string, type?: 'success' | 'error') => void;
}

const EMPTY_FORM: GameFormInput = {
  name: '',
  platform: 'Mobile',
  genre: '',
  orientation: 'Landscape',
  description: '',
  sortOrder: 0,
};

export default function GameList({games, editUnlocked, adminPassword, onSelectGame, onRefresh, onMessage}: GameListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);
  const [form, setForm] = useState<GameFormInput>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(game: Game) {
    setEditing(game);
    setForm({
      name: game.name,
      platform: game.platform,
      genre: game.genre,
      orientation: game.orientation,
      description: game.description,
      sortOrder: game.sortOrder,
    });
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      onMessage('게임명을 입력해주세요.', 'error');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await updateGame(adminPassword, editing.id, form);
        onMessage('게임 정보가 수정되었습니다.', 'success');
      } else {
        await createGame(adminPassword, form);
        onMessage('새 게임이 등록되었습니다.', 'success');
      }
      setFormOpen(false);
      await onRefresh();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '게임 저장 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(game: Game) {
    if (!confirm(`"${game.name}" 게임과 연결된 스크린샷/플로우를 삭제할까요?`)) {
      return;
    }
    setBusy(true);
    try {
      await deleteGame(adminPassword, game.id);
      onMessage('게임이 삭제되었습니다.', 'success');
      await onRefresh();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '게임 삭제 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">Game Library</p>
          <h2 className="mt-1 text-2xl font-black text-stone-950">게임 레퍼런스</h2>
          <p className="mt-1 text-sm text-stone-500">게임별 UI 스크린샷을 업로드하고 기능/플로우 단위로 탐색합니다.</p>
        </div>
        {editUnlocked && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" /> 게임 등록
          </button>
        )}
      </div>

      {formOpen && editUnlocked && (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 md:grid-cols-2">
          <input className="rounded-xl border border-stone-300 px-3 py-2" value={form.name} onChange={(event) => setForm({...form, name: event.target.value})} placeholder="게임명" />
          <select className="rounded-xl border border-stone-300 px-3 py-2" value={form.platform} onChange={(event) => setForm({...form, platform: event.target.value as Platform})}>
            {PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}
          </select>
          <input className="rounded-xl border border-stone-300 px-3 py-2" value={form.genre} onChange={(event) => setForm({...form, genre: event.target.value})} placeholder="장르" />
          <select className="rounded-xl border border-stone-300 px-3 py-2" value={form.orientation} onChange={(event) => setForm({...form, orientation: event.target.value as Orientation})}>
            {ORIENTATIONS.map((orientation) => <option key={orientation}>{orientation}</option>)}
          </select>
          <input className="rounded-xl border border-stone-300 px-3 py-2" type="number" value={form.sortOrder} onChange={(event) => setForm({...form, sortOrder: Number(event.target.value)})} placeholder="정렬 순서" />
          <textarea className="min-h-24 rounded-xl border border-stone-300 px-3 py-2 md:col-span-2" value={form.description} onChange={(event) => setForm({...form, description: event.target.value})} placeholder="설명" />
          <div className="flex gap-2 md:col-span-2">
            <button disabled={busy} className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-50">{editing ? '수정 저장' : '게임 등록'}</button>
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-stone-300 bg-white px-4 py-2 font-bold text-stone-700">취소</button>
          </div>
        </form>
      )}

      {games.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/75 p-10 text-center">
          <Gamepad2 className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-3 font-bold text-stone-800">등록된 게임이 없습니다.</p>
          <p className="mt-1 text-sm text-stone-500">편집 잠금을 해제한 뒤 첫 번째 게임 카탈로그를 만들어주세요.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => {
            const coverUrl = getPublicImageUrl(game.coverThumbPath || game.coverImagePath);
            return (
              <article key={game.id} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <button type="button" onClick={() => onSelectGame(game.id)} className="block w-full text-left">
                  <div className="flex aspect-video items-center justify-center bg-stone-900">
                    {coverUrl ? (
                      <img src={coverUrl} alt={game.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <Gamepad2 className="h-14 w-14 text-stone-600" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-stone-950">{game.name}</h3>
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
                    </div>
                  </div>
                </button>
                {editUnlocked && (
                  <div className="flex gap-2 border-t border-stone-100 p-3">
                    <button type="button" onClick={() => openEdit(game)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50">
                      <Edit2 className="h-4 w-4" /> 수정
                    </button>
                    <button type="button" onClick={() => handleDelete(game)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" /> 삭제
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
