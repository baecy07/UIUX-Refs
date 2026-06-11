create extension if not exists "pgcrypto";

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null,
  genre text default '',
  orientation text check (orientation in ('Landscape', 'Portrait')) default 'Landscape',
  description text default '',
  cover_image_path text,
  cover_thumb_path text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.screenshots (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  feature text not null,
  title text not null,
  image_path text not null,
  thumb_path text not null,
  width integer,
  height integer,
  order_index integer default 0,
  memo text default '',
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.flows (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  from_screen_id uuid not null references public.screenshots(id) on delete cascade,
  to_screen_id uuid not null references public.screenshots(id) on delete cascade,
  action text default '',
  order_index integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.app_settings (
  id text primary key default 'default',
  features text[] not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists screenshots_game_feature_idx on public.screenshots(game_id, feature);
create index if not exists screenshots_feature_created_idx on public.screenshots(feature, created_at desc);
create index if not exists screenshots_tags_idx on public.screenshots using gin(tags);
create index if not exists flows_game_idx on public.flows(game_id, order_index);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_updated_at on public.games;
create trigger games_updated_at
before update on public.games
for each row execute function public.set_updated_at();

drop trigger if exists screenshots_updated_at on public.screenshots;
create trigger screenshots_updated_at
before update on public.screenshots
for each row execute function public.set_updated_at();

drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

insert into public.app_settings (id, features)
values (
  'default',
  array[
    '로그인',
    '타이틀',
    '로비',
    '메인 메뉴',
    '매칭',
    '포지션/캐릭터 선택',
    '인게임 HUD',
    '결과 화면',
    '보상 화면',
    '캐릭터/선수',
    '캐릭터 상세',
    '성장/강화',
    '스킬/장비',
    '샵',
    '상품 상세',
    '구매 확인',
    '이벤트',
    '출석',
    '미션',
    '시즌패스',
    '랭킹',
    '친구/소셜',
    '우편함',
    '설정',
    '팝업/알림',
    '튜토리얼'
  ]::text[]
)
on conflict (id) do nothing;

alter table public.games enable row level security;
alter table public.screenshots enable row level security;
alter table public.flows enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Allow public read games" on public.games;
create policy "Allow public read games"
on public.games for select
to anon, authenticated
using (true);

drop policy if exists "Allow public read screenshots" on public.screenshots;
create policy "Allow public read screenshots"
on public.screenshots for select
to anon, authenticated
using (true);

drop policy if exists "Allow public read flows" on public.flows;
create policy "Allow public read flows"
on public.flows for select
to anon, authenticated
using (true);

drop policy if exists "Allow public read app settings" on public.app_settings;
create policy "Allow public read app settings"
on public.app_settings for select
to anon, authenticated
using (true);
