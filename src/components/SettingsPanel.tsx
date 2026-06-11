import {FormEvent, useEffect, useState} from 'react';
import {Download, Gamepad2, Plus, Settings, Trash2, Upload} from 'lucide-react';
import {DEFAULT_FEATURES, ORIENTATIONS, PLATFORMS} from '../constants';
import {createGame, deleteGame, updateGame, updateSettings} from '../lib/apiClient';
import type {Game, GameFormInput, Orientation, Platform} from '../types';
import ScreenshotUpload from './ScreenshotUpload';

interface SettingsPanelProps {
  games: Game[];
  features: string[];
  editUnlocked: boolean;
  adminPassword: string;
  onRefreshGames: () => Promise<void>;
  onUploaded: (gameId: string) => Promise<void>;
  onFeaturesChanged: (features: string[]) => Promise<void>;
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

type SettingsTab = 'upload' | 'games' | 'features' | 'export';

export default function SettingsPanel({
  games,
  features,
  editUnlocked,
  adminPassword,
  onRefreshGames,
  onUploaded,
  onFeaturesChanged,
  onMessage,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('upload');
  const [draftFeatures, setDraftFeatures] = useState(features);
  const [newFeature, setNewFeature] = useState('');
  const [form, setForm] = useState<GameFormInput>(EMPTY_FORM);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraftFeatures(features);
  }, [features]);

  function startEditGame(game: Game) {
    setEditingGame(game);
    setForm({
      name: game.name,
      platform: game.platform,
      genre: game.genre,
      orientation: game.orientation,
      description: game.description,
      sortOrder: game.sortOrder,
    });
  }

  function resetGameForm() {
    setEditingGame(null);
    setForm(EMPTY_FORM);
  }

  async function handleSaveGame(event: FormEvent) {
    event.preventDefault();
    if (!editUnlocked) {
      onMessage('편집 잠금을 해제해야 게임을 관리할 수 있습니다.', 'error');
      return;
    }
    if (!form.name.trim()) {
      onMessage('게임명을 입력해주세요.', 'error');
      return;
    }
    setBusy(true);
    try {
      if (editingGame) {
        await updateGame(adminPassword, editingGame.id, form);
        onMessage('게임 정보가 수정되었습니다.', 'success');
      } else {
        await createGame(adminPassword, form);
        onMessage('게임이 등록되었습니다.', 'success');
      }
      resetGameForm();
      await onRefreshGames();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '게임 저장 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteGame(game: Game) {
    if (!editUnlocked || !confirm(`"${game.name}" 게임과 연결된 스크린샷을 삭제할까요?`)) {
      return;
    }
    setBusy(true);
    try {
      await deleteGame(adminPassword, game.id);
      onMessage('게임이 삭제되었습니다.', 'success');
      await onRefreshGames();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '게임 삭제 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function saveFeatures(nextFeatures = draftFeatures) {
    if (!editUnlocked) {
      onMessage('편집 잠금을 해제해야 설정을 변경할 수 있습니다.', 'error');
      return;
    }
    setBusy(true);
    try {
      await updateSettings(adminPassword, nextFeatures);
      await onFeaturesChanged(nextFeatures);
      onMessage('기능 프리셋이 저장되었습니다.', 'success');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '설정 저장 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  function handleAddFeature(event: FormEvent) {
    event.preventDefault();
    const clean = newFeature.trim();
    if (!clean || draftFeatures.includes(clean)) {
      return;
    }
    setDraftFeatures([...draftFeatures, clean]);
    setNewFeature('');
  }

  function exportJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      games,
      features,
      note: '이미지는 Supabase Storage에 있고 DB에는 경로만 저장됩니다.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uiux-reference-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-stone-200 bg-white/85 p-5 shadow-sm">
        <p className="text-sm font-bold text-emerald-700">Settings</p>
        <h2 className="mt-1 text-2xl font-black text-stone-950">설정</h2>
        <p className="mt-1 text-sm text-stone-500">게임 등록, 스크린샷 업로드, 기능 프리셋을 이곳에서 관리합니다.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <TabButton active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} icon={<Upload className="h-4 w-4" />} label="스크린샷 업로드" />
          <TabButton active={activeTab === 'games'} onClick={() => setActiveTab('games')} icon={<Gamepad2 className="h-4 w-4" />} label="게임 관리" />
          <TabButton active={activeTab === 'features'} onClick={() => setActiveTab('features')} icon={<Settings className="h-4 w-4" />} label="기능 프리셋" />
          <TabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')} icon={<Download className="h-4 w-4" />} label="내보내기" />
        </div>
      </div>

      {activeTab === 'upload' && (
        <ScreenshotUpload
          games={games}
          features={features}
          editUnlocked={editUnlocked}
          adminPassword={adminPassword}
          onUploaded={onUploaded}
          onMessage={onMessage}
        />
      )}

      {activeTab === 'games' && (
        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <form onSubmit={handleSaveGame} className="space-y-3 rounded-[28px] border border-stone-200 bg-white/85 p-5 shadow-sm">
            <h3 className="text-xl font-black text-stone-950">{editingGame ? '게임 수정' : '게임 등록'}</h3>
            <input disabled={!editUnlocked} className="w-full rounded-xl border border-stone-300 px-3 py-2 disabled:bg-stone-100" value={form.name} onChange={(event) => setForm({...form, name: event.target.value})} placeholder="게임명" />
            <select disabled={!editUnlocked} className="w-full rounded-xl border border-stone-300 px-3 py-2 disabled:bg-stone-100" value={form.platform} onChange={(event) => setForm({...form, platform: event.target.value as Platform})}>
              {PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}
            </select>
            <input disabled={!editUnlocked} className="w-full rounded-xl border border-stone-300 px-3 py-2 disabled:bg-stone-100" value={form.genre} onChange={(event) => setForm({...form, genre: event.target.value})} placeholder="장르" />
            <select disabled={!editUnlocked} className="w-full rounded-xl border border-stone-300 px-3 py-2 disabled:bg-stone-100" value={form.orientation} onChange={(event) => setForm({...form, orientation: event.target.value as Orientation})}>
              {ORIENTATIONS.map((orientation) => <option key={orientation}>{orientation}</option>)}
            </select>
            <input disabled={!editUnlocked} className="w-full rounded-xl border border-stone-300 px-3 py-2 disabled:bg-stone-100" type="number" value={form.sortOrder} onChange={(event) => setForm({...form, sortOrder: Number(event.target.value)})} placeholder="정렬 순서" />
            <textarea disabled={!editUnlocked} className="min-h-24 w-full rounded-xl border border-stone-300 px-3 py-2 disabled:bg-stone-100" value={form.description} onChange={(event) => setForm({...form, description: event.target.value})} placeholder="설명" />
            <div className="flex gap-2">
              <button disabled={!editUnlocked || busy} className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-40">{editingGame ? '수정 저장' : '등록'}</button>
              {editingGame && <button type="button" onClick={resetGameForm} className="rounded-xl border border-stone-300 bg-white px-4 py-2 font-bold text-stone-700">취소</button>}
            </div>
          </form>

          <div className="rounded-[28px] border border-stone-200 bg-white/85 p-5 shadow-sm">
            <h3 className="text-xl font-black text-stone-950">등록된 게임</h3>
            <div className="mt-4 divide-y divide-stone-100">
              {games.map((game) => (
                <div key={game.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black text-stone-950">{game.name}</p>
                    <p className="text-sm text-stone-500">{game.platform} · {game.orientation} · {game.screenshotCount ?? 0}장</p>
                  </div>
                  {editUnlocked && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEditGame(game)} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-bold text-stone-700">수정</button>
                      <button type="button" onClick={() => void handleDeleteGame(game)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-700">삭제</button>
                    </div>
                  )}
                </div>
              ))}
              {games.length === 0 && <p className="py-8 text-center text-sm font-bold text-stone-500">등록된 게임이 없습니다.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="rounded-[28px] border border-stone-200 bg-white/85 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-stone-950">기능 프리셋</h3>
            <button
              type="button"
              onClick={() => {
                setDraftFeatures(DEFAULT_FEATURES);
                void saveFeatures(DEFAULT_FEATURES);
              }}
              disabled={!editUnlocked || busy}
              className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-bold text-stone-700 disabled:opacity-40"
            >
              기본값 복원
            </button>
          </div>
          <form onSubmit={handleAddFeature} className="mt-4 flex gap-2">
            <input disabled={!editUnlocked} className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2 disabled:bg-stone-100" value={newFeature} onChange={(event) => setNewFeature(event.target.value)} placeholder="새 기능명" />
            <button disabled={!editUnlocked} className="rounded-xl bg-stone-900 px-3 text-white disabled:opacity-40"><Plus className="h-4 w-4" /></button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {draftFeatures.map((feature) => (
              <span key={feature} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-stone-700 ring-1 ring-stone-200">
                {feature}
                {editUnlocked && (
                  <button type="button" onClick={() => setDraftFeatures(draftFeatures.filter((item) => item !== feature))} className="text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
          <button onClick={() => void saveFeatures()} disabled={!editUnlocked || busy} className="mt-4 rounded-2xl bg-emerald-700 px-4 py-2 font-black text-white disabled:opacity-40">
            프리셋 저장
          </button>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="rounded-[28px] border border-stone-200 bg-white/85 p-5 shadow-sm">
          <h3 className="text-xl font-black text-stone-950">데이터 내보내기</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">현재 게임 목록과 기능 프리셋을 JSON으로 저장합니다. 이미지 파일은 Storage 경로로만 관리됩니다.</p>
          <button type="button" onClick={exportJson} className="mt-4 rounded-2xl border border-stone-300 bg-white px-4 py-2 font-bold text-stone-800 hover:bg-stone-50">
            JSON 내보내기
          </button>
        </div>
      )}
    </section>
  );
}

function TabButton({active, onClick, icon, label}: {active: boolean; onClick: () => void; icon: React.ReactNode; label: string}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${active ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50'}`}
    >
      {icon}
      {label}
    </button>
  );
}
