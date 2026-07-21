// ── Lexuri: captura de legenda via navegador real ──────────────────────────
// Como usar:
// 1. Rode `npm run dev` local (localhost:3000 precisa estar no ar).
// 2. Abra o vídeo de verdade no youtube.com (ex: o do Believer, Sweet Child
//    O'Mine, Californication...).
// 3. Abra o DevTools (F12) → aba Console.
// 4. Cole esse script inteiro e aperte Enter.
// 5. Espera a mensagem "✅ Enviado" aparecer no console.
// 6. Recarregue a página da lição no app local pra ver o resultado.
;(async () => {
  const videoId = new URL(location.href).searchParams.get('v')
  if (!videoId) return console.error('❌ Não parece ser uma página de vídeo do YouTube.')

  const tracks = window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
  if (!tracks?.length) return console.error('❌ Esse vídeo não tem legenda disponível.')

  const enHuman = tracks.find((t) => t.languageCode?.startsWith('en') && t.kind !== 'asr')
  const enAsr   = tracks.find((t) => t.languageCode?.startsWith('en'))
  const best    = enHuman ?? enAsr ?? tracks[0]
  const isASR   = best.kind === 'asr' || !enHuman

  console.log(`ℹ️ Usando faixa: ${best.languageCode} (${isASR ? 'automática' : 'humana'})`)

  const captionUrl = `${best.baseUrl}&fmt=json3`
  let captText = ''
  for (const method of ['GET', 'POST']) {
    try {
      const res = await fetch(captionUrl, { method })
      const text = await res.text()
      if (text) { captText = text; break }
    } catch { /* tenta o próximo método */ }
  }
  if (!captText) return console.error('❌ Corpo da legenda veio vazio — tente recarregar a página e rodar de novo.')

  const captData = JSON.parse(captText)
  const segments = (captData.events ?? [])
    .filter((e) => e.segs?.length && e.tStartMs !== undefined)
    .map((e) => ({
      text: e.segs.map((s) => s.utf8 ?? '').join('').replace(/\n/g, ' ').trim(),
      start: (e.tStartMs ?? 0) / 1000,
      duration: Math.max(0.1, (e.dDurationMs ?? 2000) / 1000),
    }))
    .filter((s) => s.text)

  if (!segments.length) return console.error('❌ Zero falas depois de processar a legenda.')

  const hasMusicalSymbol = segments.some((s) => s.text.includes('♪') || s.text.includes('🎵'))
  console.log(`ℹ️ ${segments.length} falas capturadas${hasMusicalSymbol ? ' (com símbolo ♪)' : ''}. Enviando...`)

  try {
    const res = await fetch('http://localhost:3000/api/admin/import-captured-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, segments, isASR, hasMusicalSymbol }),
    })
    const json = await res.json()
    if (!res.ok) return console.error('❌ Servidor recusou:', json.error)
    console.log(`✅ Enviado! Lição "${json.feedItemId}" atualizada — ${json.segments} falas, ${json.chunks} chunks.`)
  } catch (e) {
    console.error('❌ Não consegui falar com localhost:3000 — confirme que o `npm run dev` está rodando.', e)
  }
})()
