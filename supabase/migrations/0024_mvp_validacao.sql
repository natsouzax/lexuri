-- ============================================================
-- 0024: MVP Validação — ciclo de revisão por música, takeaways,
--       glossário ativo e versos do usuário.
--
-- Aditiva por segurança: NÃO dropa as tabelas do Lexuri SaaS
-- (subscriptions, gamification, notifications, etc.) porque o
-- projeto Supabase pode ser compartilhado. A lista do que pode
-- ser dropado está em _plans/decisions.md.
--
-- Reaproveitadas: flashcards (biblioteca de palavras),
-- profiles + onboarding (nível e idioma nativo).
-- ============================================================

-- Nível declarado no fluxo /level (Beginner/Intermediate/Advanced)
-- + estrutura preparada pra brain mapping futuro (placeholder).
alter table profiles add column if not exists study_level text
  check (study_level in ('beginner', 'intermediate', 'advanced'));
alter table profiles add column if not exists brain_map jsonb not null default '{}';

-- ── Progresso por música: controla o ciclo Day 1 / Day 2 / Day 3 ──
create table if not exists song_progress (
  user_id      uuid        not null references auth.users on delete cascade,
  song_id      text        not null,
  listened_at  timestamptz not null default now(),
  day1_done_at timestamptz,
  day2_done_at timestamptz,
  day3_done_at timestamptz,
  primary key (user_id, song_id)
);

create index if not exists song_progress_user_idx on song_progress (user_id);

alter table song_progress enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'song_progress' and policyname = 'users manage own song_progress') then
    execute 'create policy "users manage own song_progress" on song_progress for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

-- ── Takeaways: o que o usuário ESCREVE ao fim do Day 3 ──
-- Regra do produto: nada entra no glossário automaticamente;
-- o glossário É o conjunto de takeaways (aprendizado ativo).
create table if not exists takeaways (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  song_id    text        not null,
  text       text        not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists takeaways_user_idx on takeaways (user_id, created_at);

alter table takeaways enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'takeaways' and policyname = 'users manage own takeaways') then
    execute 'create policy "users manage own takeaways" on takeaways for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

-- ── Versos do usuário: a cada 2 takeaways nasce um verso ──
create table if not exists user_verses (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users on delete cascade,
  verse_text   text        not null,
  takeaway_ids uuid[]      not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists user_verses_user_idx on user_verses (user_id, created_at);

alter table user_verses enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'user_verses' and policyname = 'users manage own user_verses') then
    execute 'create policy "users manage own user_verses" on user_verses for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;
