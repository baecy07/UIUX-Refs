import {createClient} from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ADMIN_PASSWORD: string;
}

export const BUCKET = 'uiux-screenshots';

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  });
}

export function requireAdmin(env: Env, password: unknown) {
  if (!env.ADMIN_PASSWORD) {
    return false;
  }
  return typeof password === 'string' && password.length > 0 && password === env.ADMIN_PASSWORD;
}

export function getServiceClient(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function readJson(request: Request) {
  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
}

export function sanitizeFilePart(value: string) {
  return value.replace(/[^a-zA-Z0-9가-힣._-]+/g, '-').slice(0, 80) || 'screenshot';
}

export function toTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
