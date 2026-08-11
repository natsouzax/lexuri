-- ============================================================
-- 0032: Personal examples for active Glossary practice
-- Keeps the learner's answer history separate from the takeaway
-- and schedules each Glossary expression for future production.
-- ============================================================

create table if not exists glossary_examples (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users on delete cascade,
  takeaway_id     uuid        not null references takeaways on delete cascade,
  target_expression text      not null check (char_length(target_expression) between 1 and 120),
  question        text        not null check (char_length(question) between 1 and 500),
  answer          text        not null check (char_length(answer) between 1 and 1000),
  original_answer text        check (original_answer is null or char_length(original_answer) <= 1000),
  feedback        text        check (feedback is null or char_length(feedback) <= 1000),
  created_at      timestamptz not null default now()
);

create index if not exists glossary_examples_takeaway_idx
  on glossary_examples (user_id, takeaway_id, created_at desc);

alter table glossary_examples enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'glossary_examples' and policyname = 'users manage own glossary examples') then
    execute 'create policy "users manage own glossary examples" on glossary_examples for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id and exists (
        select 1 from takeaways where takeaways.id = glossary_examples.takeaway_id and takeaways.user_id = auth.uid()
      ))';
  end if;
end $$;

create table if not exists glossary_practice_state (
  user_id          uuid        not null references auth.users on delete cascade,
  takeaway_id      uuid        not null references takeaways on delete cascade,
  target_expression text       not null check (char_length(target_expression) between 1 and 120),
  repetitions      integer     not null default 0 check (repetitions >= 0),
  interval_days    integer     not null default 0 check (interval_days between 0 and 365),
  next_review_at   timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (user_id, takeaway_id)
);

create index if not exists glossary_practice_state_due_idx
  on glossary_practice_state (user_id, next_review_at);

alter table glossary_practice_state enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'glossary_practice_state' and policyname = 'users manage own glossary practice state') then
    execute 'create policy "users manage own glossary practice state" on glossary_practice_state for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id and exists (
        select 1 from takeaways where takeaways.id = glossary_practice_state.takeaway_id and takeaways.user_id = auth.uid()
      ))';
  end if;
end $$;
