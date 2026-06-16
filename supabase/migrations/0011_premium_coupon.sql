-- Add premium_until to profiles (set by coupon redemption)
alter table profiles add column if not exists premium_until timestamptz;

-- Record coupon redemptions (prevents double-use per user per code)
create table if not exists coupon_redemptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  coupon_code   text not null,
  redeemed_at   timestamptz not null default now(),
  unique(user_id, coupon_code)
);

alter table coupon_redemptions enable row level security;

create policy "users read own redemptions"
  on coupon_redemptions for select
  using (auth.uid() = user_id);

-- Weekly usage counters (reset each calendar week)
create table if not exists user_weekly_usage (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  week_start      date not null default date_trunc('week', now())::date,
  yt_imports      integer not null default 0,
  chunk_analyses  integer not null default 0
);

alter table user_weekly_usage enable row level security;

create policy "users read own weekly usage"
  on user_weekly_usage for select
  using (auth.uid() = user_id);
