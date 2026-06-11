import {json, requireAdmin, readJson, type Env} from '../_lib/supabase';

export const onRequestPost: PagesFunction<Env> = async ({request, env}) => {
  const body = await readJson(request);
  return json({ok: requireAdmin(env, body.password)});
};
