-- ============================================================
-- 0030: Speaking review
-- Words the learner wants to practise aloud, their spaced-
-- repetition state, and text-only AI assessment history.
-- Audio submitted for an assessment is never stored.
-- ============================================================

create table if not exists speaking_review_items (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users on delete cascade,
  source_song_id    uuid        references user_songs on delete set null,
  word              text        not null check (char_length(word) between 1 and 120),
  normalized_word   text        not null check (char_length(normalized_word) between 1 and 120),
  last_heard_as     text,
  ease_factor       numeric(4,2) not null default 2.50 check (ease_factor between 1.30 and 3.50),
  interval_days     integer     not null default 0 check (interval_days between 0 and 365),
  repetitions       integer     not null default 0 check (repetitions >= 0),
  attempt_count     integer     not null default 0 check (attempt_count >= 0),
  success_count     integer     not null default 0 check (success_count >= 0),
  last_score        numeric(5,2),
  next_review_at    timestamptz not null default now(),
  last_reviewed_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, normalized_word)
);

create index if not exists speaking_review_items_due_idx
  on speaking_review_items (user_id, next_review_at);

alter table speaking_review_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'speaking_review_items' and policyname = 'users manage own speaking review items') then
    execute 'create policy "users manage own speaking review items" on speaking_review_items for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

create table if not exists speaking_review_attempts (
  id                uuid        primary key default gen_random_uuid(),
  item_id           uuid        not null references speaking_review_items on delete cascade,
  user_id           uuid        not null references auth.users on delete cascade,
  reference_word    text        not null,
  recognized_text   text        not null default '',
  understood        boolean     not null,
  scores            jsonb       not null default '{}',
  created_at        timestamptz not null default now()
);

create index if not exists speaking_review_attempts_item_idx
  on speaking_review_attempts (user_id, item_id, created_at desc);

alter table speaking_review_attempts enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'speaking_review_attempts' and policyname = 'users manage own speaking review attempts') then
    execute 'create policy "users manage own speaking review attempts" on speaking_review_attempts for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

