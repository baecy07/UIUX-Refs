import {BUCKET, getServiceClient, json, requireAdmin, readJson, type Env} from '../_lib/supabase';

export const onRequestPost: PagesFunction<Env> = async ({request, env}) => {
  const body = await readJson(request);
  if (!requireAdmin(env, body.password)) {
    return json({error: '관리자 비밀번호가 올바르지 않습니다.'}, {status: 401});
  }
  const game = body.game as Record<string, unknown> | undefined;
  if (!game || typeof game.name !== 'string' || !game.name.trim()) {
    return json({error: '게임명이 필요합니다.'}, {status: 400});
  }
  const supabase = getServiceClient(env);
  const {data, error} = await supabase
    .from('games')
    .insert({
      name: game.name,
      platform: game.platform || 'Mobile',
      genre: game.genre || '',
      orientation: game.orientation || 'Landscape',
      description: game.description || '',
      sort_order: Number(game.sortOrder || 0),
    })
    .select()
    .single();
  if (error) {
    return json({error: error.message}, {status: 400});
  }
  return json({game: data});
};

export const onRequestPatch: PagesFunction<Env> = async ({request, env}) => {
  const body = await readJson(request);
  if (!requireAdmin(env, body.password)) {
    return json({error: '관리자 비밀번호가 올바르지 않습니다.'}, {status: 401});
  }
  if (typeof body.id !== 'string') {
    return json({error: '게임 id가 필요합니다.'}, {status: 400});
  }
  const game = body.game as Record<string, unknown> | undefined;
  const supabase = getServiceClient(env);
  const {data, error} = await supabase
    .from('games')
    .update({
      name: game?.name,
      platform: game?.platform,
      genre: game?.genre,
      orientation: game?.orientation,
      description: game?.description,
      sort_order: Number(game?.sortOrder || 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select()
    .single();
  if (error) {
    return json({error: error.message}, {status: 400});
  }
  return json({game: data});
};

export const onRequestDelete: PagesFunction<Env> = async ({request, env}) => {
  const body = await readJson(request);
  if (!requireAdmin(env, body.password)) {
    return json({error: '관리자 비밀번호가 올바르지 않습니다.'}, {status: 401});
  }
  if (typeof body.id !== 'string') {
    return json({error: '게임 id가 필요합니다.'}, {status: 400});
  }
  const supabase = getServiceClient(env);
  const {data: screenshots} = await supabase.from('screenshots').select('image_path, thumb_path').eq('game_id', body.id);
  const storagePaths = (screenshots ?? []).flatMap((item) => [item.image_path, item.thumb_path]).filter(Boolean);
  if (storagePaths.length > 0) {
    await supabase.storage.from(BUCKET).remove(storagePaths);
  }
  const {error} = await supabase.from('games').delete().eq('id', body.id);
  if (error) {
    return json({error: error.message}, {status: 400});
  }
  return json({ok: true});
};
