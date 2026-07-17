-- Add non-music video items to the feed (MrBeast, Kurzgesagt, Yes Theory, Veritasium)

INSERT INTO feed_items (id, type, title, channel, artist, youtube_id, duration, level, tags, preview) VALUES

  ('video-mrbeast-circle', 'video', 'Last To Leave Circle Wins $500,000', 'MrBeast', null,
   'zxYjTTXc-J8', '27:46', 'B1',
   array['challenge','competition','American English','colloquial'],
   'Contestants stand in small circles for as long as they can to win half a million dollars. Casual American English packed with encouragement phrases, colloquialisms and high-pressure negotiation — addictive B1 listening practice.'),

  ('video-mrbeast-solitary', 'video', 'I Spent 50 Hours In Solitary Confinement', 'MrBeast', null,
   '9RhWXPcKBI8', '16:17', 'B1',
   array['storytelling','emotional','narrative','challenge'],
   'MrBeast narrates 50 hours in complete isolation. First-person storytelling rich in descriptive vocabulary about time, emotions and physical sensations — excellent B1 practice for expressing inner states and sequential narration.'),

  ('video-yes-theory-flight', 'video', 'I Asked 100 Strangers To Buy Me a Flight', 'Yes Theory', null,
   'FNoT5aLSMqI', '12:53', 'B1',
   array['adventure','real speech','social English','conversation'],
   'Yes Theory asks 100 strangers to fund a spontaneous flight anywhere in the world. Authentic conversational English full of polite requests, small talk and natural reactions — perfect for B1 learners practising real-world social interactions.'),

  ('video-kurzgesagt-egg', 'video', 'The Egg — A Short Story', 'Kurzgesagt', null,
   'h6fcK_fRYaI', '8:32', 'B2',
   array['philosophy','storytelling','complex vocabulary','narrative'],
   'A beautifully animated short story by Andy Weir. Dense philosophical vocabulary, second-person narration and rich metaphors about identity and existence — a thought-provoking B2 challenge with stunning visuals.'),

  ('video-kurzgesagt-nihilism', 'video', 'Optimistic Nihilism', 'Kurzgesagt', null,
   'MBRqu0YOH14', '6:53', 'B2',
   array['philosophy','abstract','academic vocabulary','science'],
   'Kurzgesagt asks: if the universe is indifferent, does anything matter? Rich in abstract nouns, conditional reasoning and hedging language. A concise B2 dose of philosophical English.'),

  ('video-veritasium-parallel', 'video', 'Parallel Worlds Probably Exist. Here''s Why.', 'Veritasium', null,
   'S1tFT4smd6E', '19:43', 'C1',
   array['science','physics','academic English','hedging language'],
   'Derek explores the many-worlds interpretation of quantum mechanics with stunning clarity. Dense scientific vocabulary, expert hedging and complex causal reasoning — a demanding C1 challenge for science-minded learners.')

ON CONFLICT (id) DO NOTHING;
