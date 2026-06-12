export const recommendedLessons = [
  {
    title: 'The Danger of Silence',
    source: 'TED Talk',
    href: '/feed/the-danger-of-silence',
    thumbnail: 'https://img.youtube.com/vi/N2Y8AONe0dA/hqdefault.jpg',
    difficulty: 'B2',
    chunks: 20,
    progress: 60,
    skills: ['Communication', 'Persuasion', 'Idioms'],
  },
  {
    title: 'How to Speak So People Want to Listen',
    source: 'YouTube',
    href: '/youtube',
    thumbnail: 'https://img.youtube.com/vi/eIho2S0ZahI/hqdefault.jpg',
    difficulty: 'B1',
    chunks: 18,
    progress: 0,
    skills: ['Conversation', 'Voice', 'Collocations'],
  },
  {
    title: 'Fix You',
    source: 'Music',
    href: '/music',
    thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    difficulty: 'B1',
    chunks: 14,
    progress: 25,
    skills: ['Emotion', 'Phrasal verbs', 'Listening'],
  },
]

export const learningLoop = [
  'Discover content',
  'Consume naturally',
  'Save chunks',
  'Generate cards',
  'Review',
  'Level up',
]

export const rankRoadmap = [
  { label: 'Seed', minXP: 0, reward: 'Start collecting real English chunks' },
  { label: 'Explorer', minXP: 200, reward: 'Unlock richer recommendations' },
  { label: 'Speaker', minXP: 700, reward: 'Build daily review momentum' },
  { label: 'Communicator', minXP: 2000, reward: 'Track source-based fluency growth' },
  { label: 'Storyteller', minXP: 5000, reward: 'Master idioms and expression patterns' },
  { label: 'Fluent', minXP: 12500, reward: 'Long-term retention mode' },
  { label: 'Native', minXP: 30000, reward: 'Advanced listening and nuance' },
]

export const contentTabs = [
  { href: '/feed', label: 'Discover', description: 'Curated TED talks, podcasts, videos, and songs.' },
  { href: '/youtube', label: 'YouTube', description: 'Paste a URL, import transcript, analyze chunks.' },
  { href: '/music', label: 'Music', description: 'Search lyrics and turn natural expressions into cards.' },
]

