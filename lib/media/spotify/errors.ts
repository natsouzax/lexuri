export class SpotifyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Error' // keep route-level String(error) output stable
  }
}

export class SpotifyNotConfiguredError extends SpotifyError {
  constructor() {
    super('Spotify credentials not configured')
  }
}
