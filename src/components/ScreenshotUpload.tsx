import {FormEvent, useEffect, useMemo, useState} from 'react';
import {ImagePlus, UploadCloud} from 'lucide-react';
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

export default function ScreenshotUpload({games, features, defaultGameId, editUnlocked, adminPassword, onUploaded, onMessage}: ScreenshotUploadProps) {
  const [gameId, setGameId] = useState(defaultGameId || games[0]?.id || '');
  const [feature, setFeature] = useState(features[2] || features[0] || '로비');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [tags, setTags] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [fileName, setFileName] = useState('screenshot');
  const [processed, setProcessed] = useState<ProcessedImage | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedGame = useMemo(() => games.find((game) => game.id === gameId), [games, gameId]);

  useEffect(() => {
    if (defaultGameId) {
      setGameId(defaultGameId);
    } else if (!gameId && games[0]) {
      setGameId(games[0].id);
    }
  }, [defaultGameId, games, gameId]);

  useEffect(() => {
    if (!title.trim() && selectedGame) {
      setTitle(`${selectedGame.name} - ${feature}`);
    }
  }, [selectedGame, feature, title]);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      onMessage('이미지 파일만 업로드할 수 있습니다.', 'error');
      return;
    }
    setBusy(true);
    try {
      if (processed) {
        releasePreviewUrls(processed);
      }
      const result = await processScreenshotImage(file);
      setProcessed(result);
      setFileName('screenshot');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '이미지 처리 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editUnlocked) {
      onMessage('편집 잠금을 해제해야 업로드할 수 있습니다.', 'error');
      return;
    }
    if (!processed || !gameId || !title.trim()) {
      onMessage('게임, 관리용 제목, 이미지가 필요합니다.', 'error');
      return;
    }
    setBusy(true);
    try {
      await uploadScreenshot({
        password: adminPassword,
        image: processed.image,
        thumbnail: processed.thumbnail,
        fileName,
        gameId,
        feature,
        title: title.trim(),
        memo,
        tags: parseTags(tags),
        orderIndex,
        width: processed.width,
        height: processed.height,
      });
      onMessage('스크린샷이 업로드되었습니다.', 'success');
      setProcessed(null);
      setMemo('');
      setTags('');
      await onUploaded(gameId);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '업로드 실패', 'error');
    } finally {
      setBusy(false);
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
        <h3 className="text-xl font-black text-stone-950">스크린샷 업로드</h3>
        <label
          className="mt-5 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 p-8 text-center transition hover:bg-emerald-50"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void handleFile(event.dataTransfer.files[0]);
          }}
        >
          <UploadCloud className="h-12 w-12 text-emerald-700" />
          <p className="mt-3 font-black text-stone-900">이미지를 드래그하거나 클릭해서 선택</p>
          <p className="mt-1 text-sm text-stone-500">업로드 전 표시용/썸네일 이미지를 브라우저에서 압축합니다.</p>
          <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0])} />
        </label>
        {processed && (
          <div className="mt-5 rounded-2xl bg-black p-3">
            <img src={processed.imagePreviewUrl} alt="업로드 미리보기" className="max-h-[440px] w-full object-contain" />
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
        <input className="w-full rounded-xl border border-stone-300 px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="관리용 제목(화면에는 표시되지 않음)" />
        <input className="w-full rounded-xl border border-stone-300 px-3 py-2" type="number" value={orderIndex} onChange={(event) => setOrderIndex(Number(event.target.value))} placeholder="정렬 순서" />
        <input className="w-full rounded-xl border border-stone-300 px-3 py-2" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="태그, 쉼표로 구분" />
        <textarea className="min-h-32 w-full rounded-xl border border-stone-300 px-3 py-2" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="메모" />
        <button disabled={busy || !processed || games.length === 0} className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white disabled:opacity-50">
          {busy ? '처리 중...' : '업로드'}
        </button>
      </aside>
    </form>
  );
}

function releasePreviewUrls(processed: ProcessedImage) {
  URL.revokeObjectURL(processed.imagePreviewUrl);
  URL.revokeObjectURL(processed.thumbPreviewUrl);
}
