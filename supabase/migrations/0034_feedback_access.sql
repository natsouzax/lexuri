-- Feedback used to allow anonymous direct inserts through the public anon key.
-- The beta now accepts feedback only from authenticated tester accounts and
-- applies a per-user API quota before inserting.
drop policy if exists "Anyone can submit feedback" on feedback;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'feedback' and policyname = 'users submit own feedback'
  ) then
    execute 'create policy "users submit own feedback" on feedback for insert
      with check (auth.uid() = user_id)';
  end if;
end $$;
