import { getVideoTitle } from '../lib/media/youtube'

const ids: Record<string, string> = {
  'sweet-child-o-mine': '1w7OgIMMRc4',
  'fix-you': 'SIelMFCVJLI',
}

async function main() {
  for (const [name, id] of Object.entries(ids)) {
    try {
      const title = await getVideoTitle(id)
      console.log(`${name} (${id}) -> "${title}"`)
    } catch (e) {
      console.log(`${name} (${id}) -> ERROR: ${e}`)
    }
  }
}

main()
