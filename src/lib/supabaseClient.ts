import {createClient} from '@supabase/supabase-js';
import {DEFAULT_FEATURES, STORAGE_BUCKET} from '../constants';
import type {AppSettings, Game, Screenshot} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseAnonKey || 'anon-key', {
  auth: {
    persistSession: false,
  },
});

type DbGame = {
  id: string;
  name: string;
  platform: Game['platform'];
  genre: string | null;
  orientation: Game['orientation'];
  description: string | null;
  cover_image_path: string | null;
  cover_thumb_path: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  screenshots?: {count: number}[] | {count: number} | null;
};

type DbScreenshot = {
  id: string;
  game_id: string;
  feature: string;
  title: string;
  image_path: string;
  thumb_path: string;
  width: number | null;
  height: number | null;
  order_index: number | null;
  memo: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  games?: DbGame | null;
};

type DbSettings = {
  id: 'default';
  features: string[] | null;
  created_at: string;
  updated_at: string;
};

function countFromRelation(value: DbGame['screenshots']) {
  if (Array.isArray(value)) {
    return value[0]?.count ?? 0;
  }
  return value?.count ?? 0;
}

export function mapGame(row: DbGame): Game {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    genre: row.genre ?? '',
    orientation: row.orientation,
    description: row.description ?? '',
    coverImagePath: row.cover_image_path,
    coverThumbPath: row.cover_thumb_path,
    sortOrder: row.sort_order ?? 0,
    screenshotCount: countFromRelation(row.screenshots),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTitleImages(games: Game[], screenshots: DbScreenshot[]) {
  const byGameId = new Map<string, DbScreenshot>();
  for (const screenshot of screenshots) {
    if (!byGameId.has(screenshot.game_id)) {
      byGameId.set(screenshot.game_id, screenshot);
    }
  }

  return games.map((game) => {
    const titleScreen = byGameId.get(game.id);
    return {
      ...game,
      titleImagePath: titleScreen?.image_path ?? null,
      titleThumbPath: titleScreen?.thumb_path ?? null,
    };
  });
}

export function mapScreenshot(row: DbScreenshot): Screenshot {
  return {
    id: row.id,
    gameId: row.game_id,
    feature: row.feature,
    title: row.title,
    imagePath: row.image_path,
    thumbPath: row.thumb_path,
    width: row.width,
    height: row.height,
    orderIndex: row.order_index ?? 0,
    memo: row.memo ?? '',
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    game: row.games ? mapGame(row.games) : undefined,
  };
}

export function mapSettings(row: DbSettings | null): AppSettings {
  return {
    id: 'default',
    features: row?.features?.length ? row.features : DEFAULT_FEATURES,
    createdAt: row?.created_at ?? new Date().toISOString(),
    updatedAt: row?.updated_at ?? new Date().toISOString(),
  };
}

export function getPublicImageUrl(path: string | null | undefined) {
  if (!path || !isSupabaseConfigured) {
    return '';
  }
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function fetchGames() {
  if (!isSupabaseConfigured) {
    return [];
  }
  const {data, error} = await supabase
    .from('games')
    .select('*, screenshots(count)')
    .order('sort_order', {ascending: true})
    .order('name', {ascending: true});

  if (error) {
    throw error;
  }

  const games = (data ?? []).map((row) => mapGame(row as DbGame));
  if (games.length === 0) {
    return games;
  }

  const {data: titleScreens, error: titleError} = await supabase
    .from('screenshots')
    .select('*')
    .eq('feature', '타이틀')
    .in('game_id', games.map((game) => game.id))
    .order('order_index', {ascending: true})
    .order('created_at', {ascending: true});

  if (titleError) {
    throw titleError;
  }

  return applyTitleImages(games, (titleScreens ?? []) as DbScreenshot[]);
}

export async function fetchAppSettings() {
  if (!isSupabaseConfigured) {
    return mapSettings(null);
  }
  const {data, error} = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
  if (error) {
    throw error;
  }
  return mapSettings(data as DbSettings | null);
}

export async function fetchGameScreenshots(gameId: string) {
  const {data, error} = await supabase
    .from('screenshots')
    .select('*')
    .eq('game_id', gameId)
    .order('feature', {ascending: true})
    .order('order_index', {ascending: true})
    .order('created_at', {ascending: true});

  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => mapScreenshot(row as DbScreenshot));
}

export interface ScreenshotSearchFilters {
  feature: string;
  platform?: string;
  orientation?: string;
  gameId?: string;
  tag?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchScreenshotsByFeature(filters: ScreenshotSearchFilters) {
  const page = filters.page ?? 0;
  const pageSize = filters.pageSize ?? 40;
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const needsGameFilter = Boolean(filters.platform || filters.orientation);

  let query = supabase
    .from('screenshots')
    .select(needsGameFilter ? '*, games!inner(*)' : '*, games(*)', {count: 'exact'})
    .eq('feature', filters.feature)
    .order('created_at', {ascending: false})
    .range(from, to);

  if (filters.gameId) {
    query = query.eq('game_id', filters.gameId);
  }
  if (filters.platform) {
    query = query.eq('games.platform', filters.platform);
  }
  if (filters.orientation) {
    query = query.eq('games.orientation', filters.orientation);
  }
  if (filters.tag) {
    query = query.contains('tags', [filters.tag]);
  }
  if (filters.query) {
    const safeQuery = filters.query.replaceAll('%', '').replaceAll(',', ' ');
    query = query.or(`title.ilike.%${safeQuery}%,memo.ilike.%${safeQuery}%`);
  }

  const {data, error, count} = await query;
  if (error) {
    throw error;
  }

  return {
    screenshots: (data ?? []).map((row) => mapScreenshot(row as DbScreenshot)),
    count: count ?? 0,
  };
}
