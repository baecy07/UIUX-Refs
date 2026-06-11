import {FormEvent, useState} from 'react';
import {Download, Plus, Settings, Trash2, Upload} from 'lucide-react';
import {DEFAULT_FEATURES} from '../constants';
import {updateSettings} from '../lib/apiClient';
import type {Game} from '../types';

interface SettingsPanelProps {
  games: Game[];
  features: string[];
  editUnlocked: boolean;
  adminPassword: string;
  onFeaturesChanged: (features: string[]) => Promise<void>;
  onMessage: (message: string, type?: 'success' | 'error') => void;
}

export default function SettingsPanel({games, features, editUnlocked, adminPassword, onFeaturesChanged, onMessage}: SettingsPanelProps) {
  const [draftFeatures, setDraftFeatures] = useState(features);
  const [newFeature, setNewFeature] = useState('');
  const [busy, setBusy] = useState(false);

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

  function handleAdd(event: FormEvent) {
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
      note: '스크린샷 원본/썸네일은 Supabase Storage에 있으며 DB에는 경로만 저장됩니다.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uiux-reference-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFeatures(file: File | undefined) {
    if (!file || !editUnlocked) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {features?: unknown};
      if (!Array.isArray(parsed.features) || !parsed.features.every((item) => typeof item === 'string')) {
        throw new Error('features 배열이 있는 JSON만 가져올 수 있습니다.');
      }
      const next = Array.from(new Set(parsed.features.map((item) => item.trim()).filter(Boolean)));
      setDraftFeatures(next);
      await saveFeatures(next);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '가져오기 실패', 'error');
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
        <p className="text-sm font-bold text-emerald-700">Settings</p>
        <h2 className="mt-1 text-2xl font-black text-stone-950">환경 설정</h2>
        <p className="mt-1 text-sm text-stone-500">기능 프리셋과 데이터 내보내기 도구를 관리합니다.</p>

        <div className="mt-6 rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-stone-900">기능 프리셋</h3>
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
          <form onSubmit={handleAdd} className="mt-4 flex gap-2">
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
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-black text-stone-900"><Download className="h-5 w-5" /> 데이터 내보내기</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">현재 게임 목록과 기능 프리셋을 JSON으로 저장합니다. 이미지 파일은 Storage 경로로만 관리됩니다.</p>
          <button type="button" onClick={exportJson} className="mt-4 w-full rounded-2xl border border-stone-300 bg-white px-4 py-2 font-bold text-stone-800 hover:bg-stone-50">
            JSON 내보내기
          </button>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-black text-stone-900"><Upload className="h-5 w-5" /> JSON 가져오기</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">현재는 안전하게 기능 프리셋만 가져옵니다. 대량 게임/스크린샷 마이그레이션은 별도 SQL/스크립트 사용을 권장합니다.</p>
          <label className={`mt-4 block rounded-2xl border border-stone-300 px-4 py-2 text-center font-bold ${editUnlocked ? 'cursor-pointer bg-white hover:bg-stone-50' : 'bg-stone-100 text-stone-400'}`}>
            프리셋 JSON 선택
            <input disabled={!editUnlocked} type="file" accept="application/json" className="hidden" onChange={(event) => void importFeatures(event.target.files?.[0])} />
          </label>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-black text-amber-950"><Settings className="h-5 w-5" /> 운영 가이드</h3>
          <p className="mt-2 text-sm leading-6 text-amber-900">불필요하게 큰 PNG는 업로드 전에 정리하고, 한 화면의 핵심 상태가 보이도록 제목/태그/메모를 함께 기록해주세요.</p>
        </div>
      </aside>
    </section>
  );
}
