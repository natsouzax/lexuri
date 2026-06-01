create table if not exists feed_items (
  id         text primary key,
  type       text not null check (type in ('video', 'music')),
  title      text not null,
  channel    text,
  artist     text,
  youtube_id text not null,
  duration   text not null,
  level      text not null,
  tags       text[] not null default '{}',
  preview    text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists feed_items_level_idx on feed_items (level);
create index if not exists feed_items_active_idx on feed_items (active);

alter table feed_items enable row level security;

create policy "public read active feed items"
  on feed_items for select
  using (active = true);

create policy "service role manages feed items"
  on feed_items for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Seed: migrate items from data/feed-items.json
insert into feed_items (id, type, title, channel, artist, youtube_id, duration, level, tags, preview) values
  ('try-something-new', 'video', 'Try Something New for 30 Days', 'TED', null, 'UNP03fDSj1U', '3:27', 'B1', array['motivation','habits','everyday English'], 'Matt Cutts suggests a simple idea: try something new for 30 days. Short, clear and full of practical everyday English.'),
  ('danger-of-silence', 'video', 'The Danger of Silence', 'TED', null, 'NiKtZgImdlY', '4:30', 'B1', array['poetry','spoken word','emotional'], 'Clint Smith reads four powerful poems about silence and speaking up — rich figurative language and emotional expression.'),
  ('how-to-speak', 'video', 'How to Speak So That People Want to Listen', 'TED', null, 'eIho2S0ZahI', '9:58', 'B2', array['communication','idioms','phrasal verbs'], 'Julian Treasure reveals the 7 deadly sins of speaking. Dense with idioms, collocations and persuasion vocabulary.'),
  ('master-procrastinator', 'video', 'Inside the Mind of a Master Procrastinator', 'TED', null, 'arj7oStGLkU', '14:03', 'B2', array['humor','idioms','storytelling'], 'Tim Urban''s hilarious talk is packed with informal English, metaphors and phrasal verbs — great for understanding native-speed humor.'),
  ('great-leaders', 'video', 'How Great Leaders Inspire Action', 'TED', null, 'qp0HIF3SfI4', '18:04', 'B2', array['business','leadership','collocations'], 'Simon Sinek''s Golden Circle talk — dense with business English collocations and persuasive language patterns.'),
  ('vulnerability', 'video', 'The Power of Vulnerability', 'TED', null, 'iCvmsMzlF7o', '20:19', 'C1', array['emotional','storytelling','advanced'], 'Brené Brown on human connection and shame — rich emotional vocabulary, advanced conversational register and complex sentence structures.'),
  ('body-language', 'video', 'Your Body Language May Shape Who You Are', 'TED', null, 'Ks-_Mh1QhMc', '21:02', 'B2', array['psychology','academic English','hedging'], 'Amy Cuddy''s science-backed talk about power poses — full of scientific register, hedging language and grammar patterns.'),
  ('music-happy', 'music', 'Happy', null, 'Pharrell Williams', 'ZbZSe6N_BXs', '3:53', 'A1', array['pop','simple vocabulary','positive mood'], 'One of the most positive songs in modern pop. The vocabulary is super simple and repetitive — perfect for absolute beginners learning everyday feelings.'),
  ('music-count-on-me', 'music', 'Count on Me', null, 'Bruno Mars', 'ZMsvwwp6S7Q', '3:16', 'A1', array['pop','friendship','simple vocabulary'], 'Warm and simple lyrics about friendship. Short sentences, high-frequency words and clear pronunciation make this ideal for A1 learners.'),
  ('music-somewhere-rainbow', 'music', 'Somewhere Over the Rainbow', null, 'Israel Kamakawiwoʻole', 'V1bFr2SWP1I', '3:49', 'A2', array['classic','dreams','slow tempo'], 'The iconic ukulele version. Slow tempo, clear pronunciation and poetic imagery — great for A2 learners who want to work on vowel sounds.'),
  ('music-shake-it-off', 'music', 'Shake It Off', null, 'Taylor Swift', 'nfWlot6h_JM', '3:39', 'A2', array['pop','phrasal verbs','informal'], 'Catchy and full of informal English. ''Shake it off'', ''play along'', ''break it down'' — great for learning common phrasal verbs in context.'),
  ('music-roar', 'music', 'Roar', null, 'Katy Perry', 'VFA3nPFYU98', '3:43', 'A2', array['pop','empowerment','idioms'], 'Empowerment anthem with clear, strong lyrics. Introduces common English metaphors and idioms about strength and standing up for yourself.'),
  ('music-hall-of-fame', 'music', 'Hall of Fame', null, 'The Script ft. will.i.am', 'mk48xRzuNvA', '3:47', 'B1', array['pop','motivation','collocations'], 'Inspiring lyrics about achieving your dreams. Great collocations: ''make a difference'', ''touch the sky'', ''go the extra mile'' — practical B1 vocabulary.'),
  ('music-someone-like-you', 'music', 'Someone Like You', null, 'Adele', 'hLQl3WQQoQ0', '4:45', 'B1', array['ballad','emotional','grammar patterns'], 'Adele''s clear British pronunciation and emotional lyrics make this a classic for learners. Notice past tenses, conditionals and formulaic expressions.'),
  ('music-fix-you', 'music', 'Fix You', null, 'Coldplay', 'k4V3Mo61fJM', '4:54', 'B1', array['ballad','emotional','vocabulary'], 'Deeply emotional and slowly paced. Rich in vocabulary about loss and hope — ''stuck in reverse'', ''tethered to'', ''tears stream''. Good for B1 reading comprehension.'),
  ('music-believer', 'music', 'Believer', null, 'Imagine Dragons', '7wtfhZwyrcc', '3:24', 'B1', array['rock','resilience','emotional vocabulary'], 'High-energy rock anthem about overcoming pain. Introduces strong emotional vocabulary and idiomatic expressions in a memorable, rhythmic context.'),
  ('music-stressed-out', 'music', 'Stressed Out', null, 'Twenty One Pilots', 'pXRviuL6vMY', '3:22', 'B2', array['pop','conversational','nostalgia','slang'], 'Conversational lyrics full of modern American English slang and phrasal verbs. Themes of anxiety and nostalgia — very natural, authentic speech patterns.'),
  ('music-dont-stop-me-now', 'music', 'Don''t Stop Me Now', null, 'Queen', 'HgzGwKwLmgM', '3:29', 'B2', array['rock','idioms','exaggeration'], 'Freddie Mercury at his most energetic. Packed with hyperbole, idiomatic expressions and playful language — great for B2 learners studying rhetorical style.'),
  ('music-bohemian-rhapsody', 'music', 'Bohemian Rhapsody', null, 'Queen', 'fJ9rUzIMcZQ', '5:55', 'C1', array['rock','theatrical','complex vocabulary','opera'], 'One of the most complex songs in English pop music — shifting registers, theatrical vocabulary, Italian phrases, dramatic narrative. A challenge for advanced learners.')
on conflict (id) do nothing;
