insert into storage.buckets (id, name, public)
values ('uiux-screenshots', 'uiux-screenshots', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow public read uiux screenshots" on storage.objects;
create policy "Allow public read uiux screenshots"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'uiux-screenshots');

-- Intentionally no anon/authenticated INSERT, UPDATE, or DELETE storage policies.
-- Cloudflare Pages Functions upload/delete with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
