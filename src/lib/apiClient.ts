import type {Game, GameFormInput, ScreenshotMetadataInput} from '../types';

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: {error?: string} = {};

  try {
    payload = text ? (JSON.parse(text) as {error?: string}) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const details = payload.error || text || response.statusText || '알 수 없는 오류';
    throw new Error(`API 오류 ${response.status}: ${details}`);
  }

  return payload as T;
}

async function jsonRequest<T>(path: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function checkPassword(password: string) {
  return jsonRequest<{ok: boolean}>('/api/check-password', 'POST', {password});
}

export async function createGame(password: string, game: GameFormInput) {
  return jsonRequest<{game: Game}>('/api/games', 'POST', {password, game});
}

export async function updateGame(password: string, id: string, game: Partial<GameFormInput>) {
  return jsonRequest<{game: Game}>('/api/games', 'PATCH', {password, id, game});
}

export async function deleteGame(password: string, id: string) {
  return jsonRequest<{ok: boolean}>('/api/games', 'DELETE', {password, id});
}

export interface UploadScreenshotInput {
  password: string;
  image: Blob;
  thumbnail: Blob;
  fileName: string;
  gameId: string;
  feature: string;
  title: string;
  memo: string;
  tags: string[];
  orderIndex: number;
  width: number;
  height: number;
}

export async function uploadScreenshot(input: UploadScreenshotInput) {
  const formData = new FormData();
  formData.append('password', input.password);
  formData.append('image', input.image, imageFileName(input.fileName, 'display'));
  formData.append('thumbnail', input.thumbnail, imageFileName(input.fileName, 'thumb'));
  formData.append('game_id', input.gameId);
  formData.append('feature', input.feature);
  formData.append('title', input.title);
  formData.append('memo', input.memo);
  formData.append('tags', JSON.stringify(input.tags));
  formData.append('order_index', String(input.orderIndex));
  formData.append('width', String(input.width));
  formData.append('height', String(input.height));

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  return parseResponse<{screenshotId: string}>(response);
}

function imageFileName(originalName: string, suffix: string) {
  const base = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9가-힣_-]+/g, '-');
  return `${base || 'screenshot'}-${suffix}.webp`;
}

export async function updateScreenshot(password: string, id: string, metadata: ScreenshotMetadataInput) {
  return jsonRequest<{ok: boolean}>('/api/screenshots', 'PATCH', {password, id, screenshot: metadata});
}

export async function deleteScreenshot(password: string, id: string) {
  return jsonRequest<{ok: boolean}>('/api/screenshots', 'DELETE', {password, id});
}

export async function createFlow(
  password: string,
  input: {gameId: string; fromScreenId: string; toScreenId: string; action: string; orderIndex: number},
) {
  return jsonRequest<{ok: boolean}>('/api/flows', 'POST', {password, flow: input});
}

export async function updateFlow(password: string, id: string, input: {action: string; orderIndex: number}) {
  return jsonRequest<{ok: boolean}>('/api/flows', 'PATCH', {password, id, flow: input});
}

export async function deleteFlow(password: string, id: string) {
  return jsonRequest<{ok: boolean}>('/api/flows', 'DELETE', {password, id});
}

export async function updateSettings(password: string, features: string[]) {
  return jsonRequest<{ok: boolean}>('/api/settings', 'PATCH', {password, features});
}
