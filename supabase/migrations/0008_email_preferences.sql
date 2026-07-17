alter table profiles
  add column if not exists email_reminders boolean not null default true;
