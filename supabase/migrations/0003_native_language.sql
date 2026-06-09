-- Rename target_language → native_language (onboarding is for learner's mother tongue)
-- No-op on fresh databases where 0002 already creates native_language directly
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'onboarding' and column_name = 'target_language'
  ) then
    alter table onboarding rename column target_language to native_language;
  end if;
end $$;
