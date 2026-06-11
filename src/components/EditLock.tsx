import {FormEvent, useState} from 'react';
import {Lock, Unlock} from 'lucide-react';
import {checkPassword} from '../lib/apiClient';

interface EditLockProps {
  editUnlocked: boolean;
  onUnlocked: (password: string) => void;
  onLocked: () => void;
  onMessage: (message: string, type?: 'success' | 'error') => void;
}

export default function EditLock({editUnlocked, onUnlocked, onLocked, onMessage}: EditLockProps) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      onMessage('관리자 비밀번호를 입력해주세요.', 'error');
      return;
    }
    setBusy(true);
    try {
      const result = await checkPassword(password);
      if (!result.ok) {
        throw new Error('비밀번호가 올바르지 않습니다.');
      }
      onUnlocked(password);
      setPassword('');
      setOpen(false);
      onMessage('편집 잠금이 해제되었습니다.', 'success');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : '잠금 해제 실패', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (editUnlocked) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
          <Unlock className="h-4 w-4" />
          편집 가능
        </span>
        <button
          type="button"
          onClick={onLocked}
          className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          다시 잠금
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-800"
      >
        <Lock className="h-4 w-4" />
        보기 전용
      </button>
      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-12 z-30 w-72 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl"
        >
          <label className="text-sm font-bold text-stone-800" htmlFor="admin-password">
            편집 잠금 해제
          </label>
          <p className="mt-1 text-xs leading-5 text-stone-500">업로드, 수정, 삭제는 서버에서 비밀번호를 확인한 뒤에만 가능합니다.</p>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            placeholder="비밀번호 입력"
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-3 w-full rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? '확인 중...' : '잠금 해제'}
          </button>
        </form>
      )}
    </div>
  );
}
