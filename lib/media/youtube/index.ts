// YouTube Module — public API. All YouTube functionality goes through here;
// no other module reaches into scraper/parser internals.

export { extractVideoId, isYouTubeUrl, watchUrl } from './url'
export { getVideoTitle, getVideoDurationSeconds } from './scraper/metadata'
export { searchYouTubeVideo } from './scraper/search'
export { fetchCaptions } from './scraper/captions'
export { sanitizeSegments, mergeIntoSentences, splitAtSentenceBoundaries } from './parser/segments'
export { reviewAndCleanSegments } from './services/enhancement'
export { getTranscript, getTranscriptFast, updateTranscriptCache } from './services/transcript'
export { getMusicCaptions } from './services/music-captions'
export { transcriptCache, SupabaseTranscriptCache, type TranscriptCache, type CachedTranscript } from './cache'
export { YouTubeError, InvalidYouTubeUrlError } from './errors'
export { youtubeRegistration } from './registration'
export type { TranscriptSegment, VideoData, FastTranscriptResult, EdgePageCaptions } from './types'
