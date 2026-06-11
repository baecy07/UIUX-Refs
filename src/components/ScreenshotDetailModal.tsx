import {FormEvent, useMemo, useState} from 'react';
import {ArrowRight, Link2, Save, Trash2, X} from 'lucide-react';
import {createFlow, deleteFlow, deleteScreenshot, updateScreenshot} from '../lib/apiClient';
import {getPublicImageUrl} from '../lib/supabaseClient';
import {parseTags, tagsToInput} from '../lib/imageProcessor';
import type {Flow, Game, Screenshot} from '../types';

interface ScreenshotDetailModalProps {
  screenshot: Screenshot;
  screenshots: Screenshot[];
  flows: Flow[];
  games: Game[];
  features: string[];
  editUnlocked: boolean;
  adminPassword: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onMessage: (message: string, type?: 'success' | 'error') => void;
}

export default function ScreenshotDetailModal({
  screenshot,
  screenshots,
  flows,
  games,
  features,
  editUnlocked,
  adminPassword,
  onClose,
  onChanged,
  onMessage,
}: ScreenshotDetailModalProps) {
  const [title, setTitle] = useState(screenshot.title);
  const [feature, setFeature] = useState(screenshot.feature);
  const [memo, setMemo] = useState(screenshot.memo);
  const [tags, setTags] = useState(tagsToInput(screenshot.tags));
  const [orderIndex, setOrderIndex] = useState(screenshot.orderIndex);
  const [targetScreenId, setTargetScreenId] = useState('');
  const [flowAction, setFlowAction] = useState('');
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deleteTitle, setDeleteTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const game = games.find((item) => item.id === screenshot.gameId);
  const incoming = useMemo(() => flows.filter((flow) => flow.toScreenId === screenshot.id), [flows, screenshot.id]);
  const outgoing = useMemo(() => flows.filter((flow) => flow.fromScreenId === screenshot.id), [flows, screenshot.id]);
  const screenById = useMemo(() => new Map(screenshots.map((item) => [item.id, item])), [screenshots]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await updateScreenshot(adminPassword, screenshot.id, {
        title: title.trim(),
        feature,
        memo,
        tags: parseTags(tags),
        orderIndex,
      });
      onMessage('스크린샷 정보가 저장되었습니다.', 'success');
      await onChanged();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '저장 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateFlow(event: FormEvent) {
    event.preventDefault();
    if (!targetScreenId || targetScreenId === screenshot.id) {
      onMessage('연결할 다음 화면을 선택해주세요.', 'error');
      return;
    }
    setBusy(true);
    try {
      await createFlow(adminPassword, {
        gameId: screenshot.gameId,
        fromScreenId: screenshot.id,
        toScreenId: targetScreenId,
        action: flowAction.trim(),
        orderIndex: outgoing.length,
      });
      setTargetScreenId('');
      setFlowAction('');
      onMessage('플로우 연결이 추가되었습니다.', 'success');
      await onChanged();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '플로우 저장 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteFlow(id: string) {
    if (!confirm('이 플로우 연결을 삭제할까요?')) {
      return;
    }
    setBusy(true);
    try {
      await deleteFlow(adminPassword, id);
      onMessage('플로우 연결이 삭제되었습니다.', 'success');
      await onChanged();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '플로우 삭제 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteScreenshot() {
    if (!deleteArmed) {
      if (confirm('이 스크린샷을 삭제할까요? 연결된 플로우도 함께 삭제됩니다.')) {
        setDeleteArmed(true);
      }
      return;
    }
    if (deleteTitle !== screenshot.title) {
      onMessage('스크린샷 제목을 정확히 입력해야 삭제할 수 있습니다.', 'error');
      return;
    }
    setBusy(true);
    try {
      await deleteScreenshot(adminPassword, screenshot.id);
      onMessage('스크린샷이 삭제되었습니다.', 'success');
      await onChanged();
      onClose();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '스크린샷 삭제 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <div className="relative bg-stone-950 p-4">
          <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-stone-900 shadow">
            <X className="h-5 w-5" />
          </button>
          <div className="flex min-h-[56vh] items-center justify-center">
            <img src={getPublicImageUrl(screenshot.imagePath)} alt={screenshot.title} className="max-h-[82vh] max-w-full rounded-2xl object-contain" />
          </div>
        </div>
        <aside className="max-h-[90vh] overflow-y-auto p-5 scrollbar-thin">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">{game?.name || 'Unknown Game'}</p>
          <h2 className="mt-2 text-2xl font-black text-stone-950">{screenshot.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{screenshot.feature}</span>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{screenshot.width ?? '-'} x {screenshot.height ?? '-'}</span>
            {screenshot.tags.map((tag) => <span key={tag} className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">#{tag}</span>)}
          </div>
          {screenshot.memo && <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">{screenshot.memo}</p>}

          <div className="mt-6 space-y-4">
            <FlowList title="이전 화면" flows={incoming} screenById={screenById} direction="incoming" onDelete={editUnlocked ? handleDeleteFlow : undefined} />
            <FlowList title="다음 화면" flows={outgoing} screenById={screenById} direction="outgoing" onDelete={editUnlocked ? handleDeleteFlow : undefined} />
          </div>

          {editUnlocked && (
            <>
              <form onSubmit={handleSave} className="mt-6 space-y-3 rounded-3xl border border-stone-200 bg-stone-50 p-4">
                <h3 className="font-black text-stone-900">메타데이터 편집</h3>
                <input className="w-full rounded-xl border border-stone-300 px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} />
                <select className="w-full rounded-xl border border-stone-300 px-3 py-2" value={feature} onChange={(event) => setFeature(event.target.value)}>
                  {features.map((item) => <option key={item}>{item}</option>)}
                </select>
                <input className="w-full rounded-xl border border-stone-300 px-3 py-2" type="number" value={orderIndex} onChange={(event) => setOrderIndex(Number(event.target.value))} />
                <input className="w-full rounded-xl border border-stone-300 px-3 py-2" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="태그, 쉼표로 구분" />
                <textarea className="min-h-24 w-full rounded-xl border border-stone-300 px-3 py-2" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="메모" />
                <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-50">
                  <Save className="h-4 w-4" /> 저장
                </button>
              </form>

              <form onSubmit={handleCreateFlow} className="mt-4 space-y-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="font-black text-stone-900">다음 화면 연결</h3>
                <select className="w-full rounded-xl border border-stone-300 px-3 py-2" value={targetScreenId} onChange={(event) => setTargetScreenId(event.target.value)}>
                  <option value="">연결할 화면 선택</option>
                  {screenshots.filter((item) => item.id !== screenshot.id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <input className="w-full rounded-xl border border-stone-300 px-3 py-2" value={flowAction} onChange={(event) => setFlowAction(event.target.value)} placeholder="예: 버튼 탭, 구매 완료, 뒤로가기" />
                <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2 font-bold text-white disabled:opacity-50">
                  <Link2 className="h-4 w-4" /> 플로우 추가
                </button>
              </form>

              <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-4">
                <h3 className="font-black text-red-900">삭제</h3>
                {deleteArmed && (
                  <input className="mt-3 w-full rounded-xl border border-red-300 px-3 py-2" value={deleteTitle} onChange={(event) => setDeleteTitle(event.target.value)} placeholder={`제목 입력: ${screenshot.title}`} />
                )}
                <button type="button" onClick={handleDeleteScreenshot} disabled={busy} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2 font-bold text-white disabled:opacity-50">
                  <Trash2 className="h-4 w-4" /> {deleteArmed ? '최종 삭제' : '스크린샷 삭제'}
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function FlowList({
  title,
  flows,
  screenById,
  direction,
  onDelete,
}: {
  title: string;
  flows: Flow[];
  screenById: Map<string, Screenshot>;
  direction: 'incoming' | 'outgoing';
  onDelete?: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-black text-stone-900">{title}</h3>
      {flows.length === 0 ? (
        <p className="mt-2 rounded-2xl bg-stone-50 p-3 text-sm text-stone-500">연결된 화면이 없습니다.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {flows.map((flow) => {
            const linked = screenById.get(direction === 'incoming' ? flow.fromScreenId : flow.toScreenId);
            return (
              <div key={flow.id} className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-3 text-sm">
                <ArrowRight className="h-4 w-4 shrink-0 text-emerald-700" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-stone-800">{linked?.title || '삭제된 화면'}</p>
                  <p className="truncate text-xs text-stone-500">{flow.action || '액션 미지정'}</p>
                </div>
                {onDelete && (
                  <button type="button" onClick={() => onDelete(flow.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
