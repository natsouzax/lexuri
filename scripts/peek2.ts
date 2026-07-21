import { getTranscript } from '../lib/media/youtube'

const map: Record<string, string> = {
  'rolling-in-the-deep': 'rYEDA3JcQqw',
  'kurzgesagt-nihilism': 'MBRqu0YOH14',
}

const id = process.argv[2]
getTranscript(`https://www.youtube.com/watch?v=${map[id]}`).then(({ segments }) => {
  segments.slice(0, 20).forEach((s) => console.log(s.start.toFixed(1), s.duration.toFixed(1), '|', s.text))
})
