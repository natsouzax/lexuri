$ErrorActionPreference = "Stop"

# Vercel is the only production target for this repository. The npm script
# runs tests, a production build, and a runtime dependency audit before upload.
npm run deploy
if ($LASTEXITCODE -ne 0) {
    throw "Lexuri deployment failed with exit code $LASTEXITCODE."
}
