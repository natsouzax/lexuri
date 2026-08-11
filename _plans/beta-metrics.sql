-- Lexuri beta funnel. Run in the Supabase SQL editor as an authorized project
-- administrator. Change start_at to the first invitation date.
with params as (
  select timestamptz '2026-08-11 00:00:00+00' as start_at
), cohort as (
  select p.id, p.created_at, p.study_level
  from profiles p, params
  where p.created_at >= params.start_at
), per_user as (
  select
    c.id,
    c.study_level is not null as chose_level,
    count(distinct sp.song_id) as songs_started,
    count(distinct f.id) as words_saved,
    count(distinct sp.song_id) filter (where sp.day1_done_at is not null) as day1_songs,
    count(distinct sp.song_id) filter (where sp.day2_done_at is not null) as day2_songs,
    count(distinct sp.song_id) filter (where sp.day3_done_at is not null) as day3_songs,
    count(distinct t.id) as takeaways_saved,
    count(distinct ge.id) as glossary_examples_saved
  from cohort c
  left join song_progress sp on sp.user_id = c.id
  left join flashcards f on f.user_id = c.id
  left join takeaways t on t.user_id = c.id
  left join glossary_examples ge on ge.user_id = c.id
  group by c.id, c.study_level
), funnel as (
  select *,
    (chose_level and songs_started > 0 and words_saved > 0 and day1_songs > 0) as activated
  from per_user
)
select
  count(*) as registered,
  count(*) filter (where chose_level) as chose_level,
  count(*) filter (where songs_started > 0) as started_song,
  count(*) filter (where words_saved > 0) as saved_word,
  count(*) filter (where activated) as activated,
  round(100.0 * count(*) filter (where activated) / nullif(count(*), 0), 1) as activation_pct,
  count(*) filter (where activated and day2_songs > 0) as returned_day2,
  round(100.0 * count(*) filter (where activated and day2_songs > 0) / nullif(count(*) filter (where activated), 0), 1) as day2_of_activated_pct,
  count(*) filter (where activated and day3_songs > 0) as completed_day3,
  round(100.0 * count(*) filter (where activated and day3_songs > 0) / nullif(count(*) filter (where activated), 0), 1) as day3_of_activated_pct,
  count(*) filter (where day3_songs > 0 and takeaways_saved >= 2) as active_takeaway_users,
  count(*) filter (where glossary_examples_saved > 0) as glossary_practice_users
from funnel;

-- Daily return/completion activity, useful for spotting a broken cohort day.
with params as (
  select timestamptz '2026-08-11 00:00:00+00' as start_at
), activity as (
  select user_id, listened_at as happened_at, 'song_started' as event from song_progress
  union all select user_id, day1_done_at, 'day1_done' from song_progress where day1_done_at is not null
  union all select user_id, day2_done_at, 'day2_done' from song_progress where day2_done_at is not null
  union all select user_id, day3_done_at, 'day3_done' from song_progress where day3_done_at is not null
  union all select user_id, created_at, 'takeaway_saved' from takeaways
  union all select user_id, created_at, 'glossary_example_saved' from glossary_examples
)
select happened_at::date as day, event, count(*) as actions, count(distinct user_id) as learners
from activity, params
where happened_at >= params.start_at
group by happened_at::date, event
order by day, event;
