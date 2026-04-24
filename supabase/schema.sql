-- ─────────────────────────────────────────────
-- SceneBloc Database Schema
-- Run this entire file in Supabase SQL Editor
-- ─────────────────────────────────────────────

-- profiles: one row per auth user
create table if not exists public.profiles (
  id      uuid references auth.users on delete cascade primary key,
  email   text,
  plan    text not null default 'free', -- 'free' | 'pro'
  created_at timestamptz default now()
);

-- prompts: saved prompt history
create table if not exists public.prompts (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  title       text not null,
  product     text,
  scene_count integer not null default 1,
  prompt_text text not null,
  scenes_json jsonb,
  created_at  timestamptz default now()
);

-- ── Row-Level Security ──────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.prompts  enable row level security;

-- profiles policies
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- prompts policies
create policy "Users can read own prompts"
  on public.prompts for select
  using (auth.uid() = user_id);

create policy "Users can insert own prompts"
  on public.prompts for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own prompts"
  on public.prompts for delete
  using (auth.uid() = user_id);

-- ── Auto-create profile on signup ──────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
