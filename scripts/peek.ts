import { getTranscript } from '../lib/media/youtube'

const id = process.argv[2]
const map: Record<string, string> = {
  californication: 'YlUKcNNmywk',
  'scar-tissue': 'mzJj5-lubeM',
  otherside: 'rn_YodiJO6k',
  'hey-jude': 'CG3jm4vvGXc',
  yesterday: 'NrgmdOz227I',
}

getTranscript(`https://www.youtube.com/watch?v=${map[id]}`).then(({ segments }) => {
  segments.forEach((s) => console.log(s.start.toFixed(1), s.duration.toFixed(1), '|', s.text))
})
