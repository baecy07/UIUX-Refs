import {BUCKET, getServiceClient, json, requireAdmin, toNumber, toTags, type Env} from '../_lib/supabase';

export const onRequestPost: PagesFunction<Env> = async ({request, env}) => {
  const formData = await request.formData();
  if (!requireAdmin(env, formData.get('password'))) {
    return json({error: '관리자 비밀번호가 올바르지 않습니다.'}, {status: 401});
  }

  const image = formData.get('image');
  const thumbnail = formData.get('thumbnail');
  const gameId = formData.get('game_id');
  const title = String(formData.get('title') || '').trim();
  const feature = String(formData.get('feature') || '').trim();

  if (!(image instanceof File) || !(thumbnail instanceof File) || typeof gameId !== 'string' || !title || !feature) {
    return json({error: '업로드 필수 값이 누락되었습니다.'}, {status: 400});
  }

  const supabase = getServiceClient(env);
  const now = new Date();
  const id = crypto.randomUUID();
  const imagePath = `${gameId}/${now.getFullYear()}/${id}.webp`;
  const thumbPath = `${gameId}/${now.getFullYear()}/${id}-thumb.webp`;

  const imageUpload = await supabase.storage.from(BUCKET).upload(imagePath, image, {
    contentType: image.type || 'image/webp',
    upsert: false,
  });
  if (imageUpload.error) {
    return json({error: imageUpload.error.message}, {status: 400});
  }

  const thumbUpload = await supabase.storage.from(BUCKET).upload(thumbPath, thumbnail, {
    contentType: thumbnail.type || 'image/webp',
    upsert: false,
  });
  if (thumbUpload.error) {
    await supabase.storage.from(BUCKET).remove([imagePath]);
    return json({error: thumbUpload.error.message}, {status: 400});
  }

  const tagsRaw = formData.get('tags');
  const tags = typeof tagsRaw === 'string' ? toTags(JSON.parse(tagsRaw || '[]')) : [];
  const {data, error} = await supabase
    .from('screenshots')
    .insert({
      game_id: gameId,
      feature,
      title,
      image_path: imagePath,
      thumb_path: thumbPath,
      width: toNumber(formData.get('width'), 0),
      height: toNumber(formData.get('height'), 0),
      order_index: toNumber(formData.get('order_index'), 0),
      memo: String(formData.get('memo') || ''),
      tags,
    })
    .select('id')
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([imagePath, thumbPath]);
    return json({error: error.message}, {status: 400});
  }

  await supabase
    .from('games')
    .update({cover_image_path: imagePath, cover_thumb_path: thumbPath, updated_at: new Date().toISOString()})
    .eq('id', gameId)
    .is('cover_thumb_path', null);

  return json({screenshotId: data.id});
};
