-- ============================================================
-- 0025: Módulo Álbum — progresso do ciclo global + faixa
--       compilada do usuário. Aditiva; reusa song_progress
--       (progresso por faixa), takeaways e user_verses.
-- ============================================================

-- Ciclo GLOBAL do álbum (libera após todas as faixas fecharem o próprio
-- ciclo de 3 dias). O progresso por faixa continua em song_progress.
create table if not exists album_progress (
  user_id             uuid        not null references auth.users on delete cascade,
  album_id            text        not null,
  started_at          timestamptz not null default now(),
  album_day1_done_at  timestamptz,
  album_day2_done_at  timestamptz,
  album_day3_done_at  timestamptz,
  primary key (user_id, album_id)
);

create index if not exists album_progress_user_idx on album_progress (user_id);

alter table album_progress enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'album_progress' and policyname = 'users manage own album_progress') then
    execute 'create policy "users manage own album_progress" on album_progress for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

-- A "faixa do usuário": os versos gerados em todas as faixas do álbum,
-- compilados numa peça única — a última faixa do "álbum dela".
create table if not exists user_album_songs (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users on delete cascade,
  album_id      text        not null,
  compiled_text text        not null default '',
  verse_ids     uuid[]      not null default '{}',
  created_at    timestamptz not null default now(),
  unique (user_id, album_id)
);

create index if not exists user_album_songs_user_idx on user_album_songs (user_id);

alter table user_album_songs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'user_album_songs' and policyname = 'users manage own user_album_songs') then
    execute 'create policy "users manage own user_album_songs" on user_album_songs for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;
