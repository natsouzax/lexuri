# Beta test runbook

> Operational checklist for the teacher + student validation cohort.

## Release gate

- [ ] `npm run check:release` passes on Node 24.x.
- [ ] `supabase migration list` shows local and remote through migration 0034.
- [ ] The release is committed and tagged before production deployment.
- [ ] Supabase Auth allows email/password signup and lists the canonical callback URL.
- [ ] Custom SMTP is enabled in Supabase Auth and a real address outside the project team receives and completes the confirmation link. The built-in sender is limited to team addresses and 2 emails/hour, so it cannot support the cohort.
- [ ] Supabase Auth email rate limits are sized for the planned invite batch after custom SMTP is enabled.
- [ ] OpenAI project spend alerts/hard limit are configured in the OpenAI dashboard.
- [ ] One disposable account completes the internal smoke test below.

## Internal smoke test

1. Register with a new email, confirm age/guardian eligibility, and accept the current legal version.
2. Select an English level and open a curated song.
3. Confirm YouTube playback and lyric synchronization on desktop and mobile.
4. Translate and save at least three words or expressions.
5. Complete Day 1. For an internal disposable account only, either wait for the real calendar lock or adjust its timestamps in Supabase to exercise Day 2 and Day 3.
6. Save two takeaways, generate the personal verse, and complete one Glossary practice answer.
7. Grant and deny microphone permission once. Confirm both paths remain usable.
8. Save a final recording, play it from the Library, then delete the account and verify the database rows and Storage object are gone.
9. Submit one feedback item and verify it appears in the `feedback` table.

Test at minimum on current Chrome desktop, Android Chrome, and iPhone Safari. Record browser, device, exact route, expected result, actual result, and screenshot for every blocker.

## Directional success criteria

This is a product-direction pilot, not a statistically powered experiment. Use at least 10 activated learners before treating percentages as directional evidence.

- **Activation ≥ 70%:** selected a level, started a song, saved a word, and completed Day 1.
- **Day 2 return ≥ 50% of activated learners.**
- **Day 3 completion ≥ 35% of activated learners.**
- **Active learning:** at least half of Day 3 completers save two takeaways.
- **Qualitative demand:** at least 60% of interviewed completers say they want to continue with another song.
- **Reliability:** no open P0/P1 privacy, data-loss, account-access, or blocking mobile bugs.
- **Cost:** OpenAI spend remains within the project budget and no account repeatedly hits the normal-use quota.

## Cohort operations

- Invite only the agreed teacher/students; do not publish broadly during the first cycle.
- Do not send invitations while the signup confirmation test or custom SMTP check is failing.
- For participants aged 13–17, obtain guardian authorization through the school/test process before sending the account link.
- Provide the privacy/terms links and explain that microphone exercises are optional.
- Give testers one support channel and a response expectation.
- Review the metrics query daily and feedback at least once per day during the pilot.
- Stop invitations if a security/privacy issue, data loss, broken signup, or uncontrolled API spend appears.

## Measurement

Run [`beta-metrics.sql`](./beta-metrics.sql) in the Supabase SQL editor. It derives the funnel from functional learning records rather than third-party tracking. Change only the date in the `params` CTE to the cohort start.

At the end, export the aggregate result and de-identify interview notes before sharing them outside the test team.
