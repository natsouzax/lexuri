export interface Question {
  id: string
  level: 'A2' | 'B1' | 'B2' | 'C1'
  question: string
  options: string[]
  correct: number
}

export const QUESTIONS: Question[] = [
  // A2 — 2 questions
  {
    id: 'q1', level: 'A2',
    question: 'She _____ to school by bus every day.',
    options: ['go', 'goes', 'going', 'gone'],
    correct: 1,
  },
  {
    id: 'q2', level: 'A2',
    question: 'There isn\'t _____ milk left in the fridge.',
    options: ['some', 'any', 'few', 'much'],
    correct: 1,
  },
  // B1 — 3 questions
  {
    id: 'q3', level: 'B1',
    question: 'By the time she arrived, we _____ for two hours.',
    options: ['waited', 'were waiting', 'had been waiting', 'have waited'],
    correct: 2,
  },
  {
    id: 'q4', level: 'B1',
    question: 'She suggested _____ a taxi instead of walking.',
    options: ['to take', 'taking', 'take', 'taken'],
    correct: 1,
  },
  {
    id: 'q5', level: 'B1',
    question: 'I wish I _____ more time to study last week.',
    options: ['have', 'had', 'would have', 'will have'],
    correct: 1,
  },
  // B2 — 3 questions
  {
    id: 'q6', level: 'B2',
    question: 'No sooner _____ than the phone rang.',
    options: ['I had arrived', 'had I arrived', 'I arrived', 'I have arrived'],
    correct: 1,
  },
  {
    id: 'q7', level: 'B2',
    question: 'The report _____ before the meeting tomorrow.',
    options: ['will finish', 'will have finished', 'will be finished', 'finishes'],
    correct: 2,
  },
  {
    id: 'q8', level: 'B2',
    question: 'That _____ be John — he\'s on holiday in Spain.',
    options: ["mustn't", "can't", "shouldn't", "mightn't"],
    correct: 1,
  },
  // C1 — 2 questions
  {
    id: 'q9', level: 'C1',
    question: 'The evidence points _____ the conclusion that the market is recovering.',
    options: ['to', 'at', 'towards', 'on'],
    correct: 0,
  },
  {
    id: 'q10', level: 'C1',
    question: 'I would rather you _____ to the party last night.',
    options: ["didn't come", "hadn't come", "wouldn't come", "don't come"],
    correct: 1,
  },
]

export const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: 'Beginner — you\'re just starting out.',
  A2: 'Elementary — you know the basics.',
  B1: 'Intermediate — you can get by in most situations.',
  B2: 'Upper Intermediate — you communicate with confidence.',
  C1: 'Advanced — you express yourself fluently and precisely.',
}

export function computeLevel(answers: (number | null)[]): string {
  const score = (lvl: string) =>
    QUESTIONS.filter((q) => q.level === lvl)
      .filter((q) => answers[QUESTIONS.indexOf(q)] === q.correct).length

  let level = 'A1'
  if (score('A2') >= 1) level = 'A2'
  if (score('B1') >= 2) level = 'B1'
  if (score('B2') >= 2) level = 'B2'
  if (score('C1') >= 1) level = 'C1'
  return level
}
