import {FormEvent, useEffect, useMemo, useState} from 'react';
import {ImagePlus, Trash2, UploadCloud} from 'lucide-react';
import {uploadScreenshot} from '../lib/apiClient';
import {parseTags, processScreenshotImage, type ProcessedImage} from '../lib/imageProcessor';
import type {Game} from '../types';

interface ScreenshotUploadProps {
  games: Game[];
  features: string[];
  defaultGameId?: string | null;
  editUnlocked: boolean;
  adminPassword: string;
  onUploaded: (gameId: string) => Promise<void>;
  onMessage: (message: string, type?: 'success' | 'error') => void;
}

interface UploadItem {
  id: string;
  processed: ProcessedImage;
}

export default function ScreenshotUpload({games, features, defaultGameId, editUnlocked, adminPassword, onUploaded, onMessage}: ScreenshotUploadProps) {
  const [gameId, setGameId] = useState(defaultGameId || games[0]?.id || '');
  const [feature, setFeature] = useState(features[2] || features[0] || '로비');
  const [memo, setMemo] = useState('');
  const [tags, setTags] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  const selectedGame = useMemo(() => games.find((game) => game.id === gameId), [games, gameId]);

  useEffect(() => {
    if (defaultGameId) {
      setGameId(defaultGameId);
    } else if (!gameId && games[0]) {
      setGameId(games[0].id);
    }
  }, [defaultGameId, games, gameId]);

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) {
      onMessage('이미지 파일만 업로드할 수 있습니다.', 'error');
      return;
    }

    setBusy(true);
    setProgress(`이미지 ${files.length}개 처리 중...`);
    try {
      const processedItems: UploadItem[] = [];
      for (const file of files) {
        const processed = await processScreenshotImage(file);
        processedItems.push({
          id: crypto.randomUUID(),
          processed,
        });
      }
      setItems((previous) => [...previous, ...processedItems]);
      onMessage(`${processedItems.length}개 이미지가 준비되었습니다.`, 'success');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '이미지 처리 실패', 'error');
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  function removeItem(id: string) {
    setItems((previous) => {
      const target = previous.find((item) => item.id === id);
      if (target) {
        releasePreviewUrls(target.processed);
      }
      return previous.filter((item) => item.id !== id);
    });
  }

  function clearItems() {
    for (const item of items) {
      releasePreviewUrls(item.processed);
    }
    setItems([]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editUnlocked) {
      onMessage('편집 잠금을 해제해야 업로드할 수 있습니다.', 'error');
      return;
    }
    if (!gameId || !selectedGame) {
      onMessage('게임을 선택해주세요.', 'error');
      return;
    }
    if (items.length === 0) {
      onMessage('업로드할 이미지를 선택해주세요.', 'error');
      return;
    }

    setBusy(true);
    try {
      const parsedTags = parseTags(tags);
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const title = `${selectedGame.name} - ${feature}${items.length > 1 ? ` (${index + 1})` : ''}`;
        setProgress(`${index + 1}/${items.length} 업로드 중...`);
        await uploadScreenshot({
          password: adminPassword,
          image: item.processed.image,
          thumbnail: item.processed.thumbnail,
          fileName: `screenshot-${index + 1}`,
          gameId,
          feature,
          title,
          memo,
          tags: parsedTags,
          orderIndex: orderIndex + index,
          width: item.processed.width,
          height: item.processed.height,
        });
      }
      onMessage(`${items.length}개 스크린샷이 업로드되었습니다.`, 'success');
      clearItems();
      setMemo('');
      setTags('');
      setProgress('');
      await onUploaded(gameId);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '업로드 실패', 'error');
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  if (!editUnlocked) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-8 text-center">
        <ImagePlus className="mx-auto h-10 w-10 text-stone-400" />
        <p className="mt-3 font-black text-stone-900">편집 잠금을 해제하면 업로드할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-stone-950">스크린샷 업로드</h3>
            <p className="mt-1 text-sm text-stone-500">여러 이미지를 한 번에 선택하거나 드래그할 수 있습니다.</p>
          </div>
          {items.length > 0 && (
            <button type="button" onClick={clearItems} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-bold text-stone-700">
              모두 비우기
            </button>
          )}
        </div>

        <label
          className="mt-5 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 p-8 text-center transition hover:bg-emerald-50"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void handleFiles(event.dataTransfer.files);
          }}
        >
          <UploadCloud className="h-12 w-12 text-emerald-700" />
          <p className="mt-3 font-black text-stone-900">이미지를 여러 개 드래그하거나 클릭해서 선택</p>
          <p className="mt-1 text-sm text-stone-500">업로드 전 표시용 이미지와 썸네일을 브라우저에서 압축합니다.</p>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => event.target.files && void handleFiles(event.target.files)} />
        </label>

        {progress && <p className="mt-4 rounded-2xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-700">{progress}</p>}

        {items.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="flex h-56 items-center justify-center bg-black">
                  <img src={item.processed.imagePreviewUrl} alt={`업로드 미리보기 ${index + 1}`} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-stone-900">#{index + 1}</p>
                    <p className="truncate text-xs text-stone-500">{item.processed.width} x {item.processed.height}</p>
                  </div>
                  <button type="button" onClick={() => removeItem(item.id)} className="rounded-xl p-2 text-red-600 hover:bg-red-50" aria-label="이미지 제거">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-3 rounded-3xl border border-stone-200 bg-white p-5">
        <select className="w-full rounded-xl border border-stone-300 px-3 py-2" value={gameId} onChange={(event) => setGameId(event.target.value)}>
          {games.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}
        </select>
        <select className="w-full rounded-xl border border-stone-300 px-3 py-2" value={feature} onChange={(event) => setFeature(event.target.value)}>
          {features.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input className="w-full rounded-xl border border-stone-300 px-3 py-2" type="number" value={orderIndex} onChange={(event) => setOrderIndex(Number(event.target.value))} placeholder="시작 정렬 순서" />
        <input className="w-full rounded-xl border border-stone-300 px-3 py-2" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="태그, 쉼표로 구분" />
        <textarea className="min-h-32 w-full rounded-xl border border-stone-300 px-3 py-2" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="메모" />
        <p className="rounded-2xl bg-stone-50 p-3 text-xs leading-5 text-stone-500">
          관리용 제목은 자동으로 `게임명 - 기능명 (번호)` 형식으로 저장되며, 화면에는 노출되지 않습니다.
        </p>
        <button disabled={busy || items.length === 0 || games.length === 0} className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white disabled:opacity-50">
          {busy ? '처리 중...' : `${items.length}개 업로드`}
        </button>
      </aside>
    </form>
  );
}

function releasePreviewUrls(processed: ProcessedImage) {
  URL.revokeObjectURL(processed.imagePreviewUrl);
  URL.revokeObjectURL(processed.thumbPreviewUrl);
}
