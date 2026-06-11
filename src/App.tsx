import {useEffect, useMemo, useState} from 'react';
import {Columns, Gamepad2, Settings} from 'lucide-react';
import EditLock from './components/EditLock';
import FeatureCompare from './components/FeatureCompare';
import GameDetail from './components/GameDetail';
import GameList from './components/GameList';
import SettingsPanel from './components/SettingsPanel';
import {DEFAULT_FEATURES, EDIT_UNLOCK_KEY} from './constants';
import {fetchAppSettings, fetchGames, isSupabaseConfigured} from './lib/supabaseClient';
import type {Game, ViewMode} from './types';

type Toast = {message: string; type: 'success' | 'error'} | null;

export default function App() {
  const [view, setView] = useState<ViewMode>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [editUnlocked, setEditUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const selectedGame = useMemo(() => games.find((game) => game.id === selectedGameId) ?? null, [games, selectedGameId]);

  function showMessage(message: string, type: 'success' | 'error' = 'success') {
    setToast({message, type});
    window.setTimeout(() => setToast(null), 3600);
  }

  async function loadInitialData() {
    setLoading(true);
    try {
      const [gameData, settings] = await Promise.all([fetchGames(), fetchAppSettings()]);
      setGames(gameData);
      setFeatures(settings.features);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : '초기 데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    sessionStorage.removeItem(EDIT_UNLOCK_KEY);
    void loadInitialData();
  }, []);

  function handleUnlocked(password: string) {
    setAdminPassword(password);
    setEditUnlocked(true);
    sessionStorage.setItem(EDIT_UNLOCK_KEY, 'true');
  }

  function handleLocked() {
    setAdminPassword('');
    setEditUnlocked(false);
    sessionStorage.removeItem(EDIT_UNLOCK_KEY);
  }

  function openGame(gameId: string) {
    setSelectedGameId(gameId);
    setView('gameDetail');
  }

  async function handleUploaded(_gameId: string) {
    await loadInitialData();
  }

  async function handleFeaturesChanged(nextFeatures: string[]) {
    setFeatures(nextFeatures);
    await loadInitialData();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f7f3ea]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <button type="button" onClick={() => setView('games')} className="text-left">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">Internal Reference</p>
            <h1 className="text-2xl font-black text-stone-950">게임 UI/UX 레퍼런스 매니저</h1>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <NavButton active={view === 'games'} onClick={() => setView('games')} icon={<Gamepad2 className="h-4 w-4" />} label="게임별" />
            <NavButton active={view === 'featureCompare'} onClick={() => setView('featureCompare')} icon={<Columns className="h-4 w-4" />} label="기능별" />
            <NavButton active={view === 'settings'} onClick={() => setView('settings')} icon={<Settings className="h-4 w-4" />} label="설정" />
            <EditLock editUnlocked={editUnlocked} onUnlocked={handleUnlocked} onLocked={handleLocked} onMessage={showMessage} />
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed right-4 top-24 z-50 rounded-2xl px-4 py-3 text-sm font-bold shadow-xl ${toast.type === 'success' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'}`}>
          {toast.message}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        {!isSupabaseConfigured && (
          <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Supabase 환경변수가 아직 설정되지 않았습니다. Cloudflare Pages 환경 변수에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 입력한 뒤 다시 배포해주세요.
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white/80 p-10 text-center font-bold text-stone-500">초기 데이터를 불러오는 중...</div>
        ) : (
          <>
            {view === 'games' && <GameList games={games} onSelectGame={openGame} />}
            {view === 'gameDetail' && selectedGame && (
              <GameDetail
                game={selectedGame}
                features={features}
                onBack={() => setView('games')}
                onMessage={showMessage}
              />
            )}
            {view === 'gameDetail' && !selectedGame && <GameList games={games} onSelectGame={openGame} />}
            {view === 'featureCompare' && <FeatureCompare games={games} features={features} onMessage={showMessage} />}
            {view === 'settings' && (
              <SettingsPanel
                games={games}
                features={features}
                editUnlocked={editUnlocked}
                adminPassword={adminPassword}
                onRefreshGames={loadInitialData}
                onUploaded={handleUploaded}
                onFeaturesChanged={handleFeaturesChanged}
                onMessage={showMessage}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function NavButton({active, onClick, icon, label}: {active: boolean; onClick: () => void; icon: React.ReactNode; label: string}) {
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
