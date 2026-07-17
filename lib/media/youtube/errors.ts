export class YouTubeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Error' // keep route-level String(error) output stable
  }
}

export class InvalidYouTubeUrlError extends YouTubeError {
  constructor() {
    super('Invalid YouTube URL. Could not extract video ID.')
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}
