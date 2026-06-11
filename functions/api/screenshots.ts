import {BUCKET, getServiceClient, json, requireAdmin, readJson, toTags, type Env} from '../_lib/supabase';

export const onRequestPatch: PagesFunction<Env> = async ({request, env}) => {
  const body = await readJson(request);
  if (!requireAdmin(env, body.password)) {
    return json({error: '관리자 비밀번호가 올바르지 않습니다.'}, {status: 401});
  }
  if (typeof body.id !== 'string') {
    return json({error: '스크린샷 id가 필요합니다.'}, {status: 400});
  }
  const screenshot = body.screenshot as Record<string, unknown> | undefined;
  const supabase = getServiceClient(env);
  const {error} = await supabase
    .from('screenshots')
    .update({
      title: screenshot?.title,
      feature: screenshot?.feature,
      memo: screenshot?.memo ?? '',
      tags: toTags(screenshot?.tags),
      order_index: Number(screenshot?.orderIndex || 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id);
  if (error) {
    return json({error: error.message}, {status: 400});
  }
  return json({ok: true});
};

export const onRequestDelete: PagesFunction<Env> = async ({request, env}) => {
  const body = await readJson(request);
  if (!requireAdmin(env, body.password)) {
    return json({error: '관리자 비밀번호가 올바르지 않습니다.'}, {status: 401});
  }
  if (typeof body.id !== 'string') {
    return json({error: '스크린샷 id가 필요합니다.'}, {status: 400});
  }
  const supabase = getServiceClient(env);
  const {data, error: findError} = await supabase.from('screenshots').select('game_id, image_path, thumb_path').eq('id', body.id).single();
  if (findError) {
    return json({error: findError.message}, {status: 404});
  }
  const {error} = await supabase.from('screenshots').delete().eq('id', body.id);
  if (error) {
    return json({error: error.message}, {status: 400});
  }
  await supabase.storage.from(BUCKET).remove([data.image_path, data.thumb_path].filter(Boolean));
  const {data: nextCover} = await supabase
    .from('screenshots')
    .select('image_path, thumb_path')
    .eq('game_id', data.game_id)
    .order('order_index', {ascending: true})
    .order('created_at', {ascending: true})
    .limit(1)
    .maybeSingle();
  await supabase
    .from('games')
    .update({
      cover_image_path: nextCover?.image_path ?? null,
      cover_thumb_path: nextCover?.thumb_path ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.game_id);
  return json({ok: true});
};
