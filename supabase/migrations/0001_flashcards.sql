create table if not exists flashcards (
  id            text primary key,
  user_id       uuid references auth.users on delete cascade,
  word          text not null,
  translation   text not null default '',
  explanation   text not null default '',
  example       text not null default '',
  timestamp     float,
  source_video  text,
  created_at    timestamptz not null default now(),
  ease_factor   float not null default 2.5,
  interval      int not null default 1,
  repetitions   int not null default 0,
  next_review   timestamptz not null default now(),
  last_reviewed timestamptz
);

create index if not exists flashcards_user_id_idx on flashcards (user_id);
create index if not exists flashcards_next_review_idx on flashcards (next_review);

alter table flashcards enable row level security;

create policy "users manage own cards"
  on flashcards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
