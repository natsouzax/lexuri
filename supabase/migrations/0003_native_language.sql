-- Rename target_language → native_language (onboarding is for learner's mother tongue)
alter table onboarding rename column target_language to native_language;
