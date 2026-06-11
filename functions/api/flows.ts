import {getServiceClient, json, requireAdmin, readJson, type Env} from '../_lib/supabase';

export const onRequestPost: PagesFunction<Env> = async ({request, env}) => {
  const body = await readJson(request);
  if (!requireAdmin(env, body.password)) {
    return json({error: '관리자 비밀번호가 올바르지 않습니다.'}, {status: 401});
  }
  const flow = body.flow as Record<string, unknown> | undefined;
  const supabase = getServiceClient(env);
  const {error} = await supabase.from('flows').insert({
    game_id: flow?.gameId,
    from_screen_id: flow?.fromScreenId,
    to_screen_id: flow?.toScreenId,
    action: flow?.action || '',
    order_index: Number(flow?.orderIndex || 0),
  });
  if (error) {
    return json({error: error.message}, {status: 400});
  }
  return json({ok: true});
};

export const onRequestPatch: PagesFunction<Env> = async ({request, env}) => {
  const body = await readJson(request);
  if (!requireAdmin(env, body.password)) {
    return json({error: '관리자 비밀번호가 올바르지 않습니다.'}, {status: 401});
  }
  const flow = body.flow as Record<string, unknown> | undefined;
  if (typeof body.id !== 'string') {
    return json({error: '플로우 id가 필요합니다.'}, {status: 400});
  }
  const supabase = getServiceClient(env);
  const {error} = await supabase.from('flows').update({
    action: flow?.action || '',
    order_index: Number(flow?.orderIndex || 0),
  }).eq('id', body.id);
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
    return json({error: '플로우 id가 필요합니다.'}, {status: 400});
  }
  const supabase = getServiceClient(env);
  const {error} = await supabase.from('flows').delete().eq('id', body.id);
  if (error) {
    return json({error: error.message}, {status: 400});
  }
  return json({ok: true});
};
