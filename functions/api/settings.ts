import {getServiceClient, json, requireAdmin, readJson, type Env} from '../_lib/supabase';

export const onRequestPatch: PagesFunction<Env> = async ({request, env}) => {
  const body = await readJson(request);
  if (!requireAdmin(env, body.password)) {
    return json({error: '관리자 비밀번호가 올바르지 않습니다.'}, {status: 401});
  }
  if (!Array.isArray(body.features) || !body.features.every((item) => typeof item === 'string')) {
    return json({error: 'features 배열이 필요합니다.'}, {status: 400});
  }
  const features = Array.from(new Set(body.features.map((item) => item.trim()).filter(Boolean)));
  const supabase = getServiceClient(env);
  const {error} = await supabase.from('app_settings').upsert({
    id: 'default',
    features,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    return json({error: error.message}, {status: 400});
  }
  return json({ok: true});
};
