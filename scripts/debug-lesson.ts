import { STATIC_LESSONS } from '../data/featured-lessons'

const id = process.argv[2]
const lesson = STATIC_LESSONS[id]
if (!lesson) {
  console.log('not found:', id)
  process.exit(1)
}
console.log(`${lesson.segments.length} segments, video_id=${lesson.video_id}`)
lesson.segments.forEach((s) => console.log(s.start.toFixed(1), s.duration.toFixed(1), '|', s.text))
