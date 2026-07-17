'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

// ID fixo da extensão Lexuri Captions — pega em chrome://extensions depois de
// carregar a pasta lexuri-extension/ como "unpacked". Trocar aqui sempre que
// a extensão for recarregada com um novo ID (dev) ou publicada na Chrome Web
// Store (ID definitivo).
const EXTENSION_ID = 'ikgaglbhelgjhchikaehhonoohfjccid'

type Status = 'checking' | 'no-session' | 'no-extension' | 'connecting' | 'connected' | 'error'

export default function ExtensionConnectPage() {
  const [status, setStatus] = useState<Status>('checking')

  async function tryConnect() {
    setStatus('checking')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setStatus('no-session')
      return
    }

    const chromeRuntime = (window as unknown as { chrome?: { runtime?: { sendMessage?: unknown } } }).chrome?.runtime

    if (!chromeRuntime?.sendMessage) {
      setStatus('no-extension')
      return
    }

    setStatus('connecting')

    try {
      const sendMessage = chromeRuntime.sendMessage as (
        extensionId: string,
        message: unknown,
        callback: (response: unknown) => void,
      ) => void

      sendMessage(
        EXTENSION_ID,
        {
          type: 'LEXURI_AUTH',
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          email: session.user.email,
        },
        (response: unknown) => {
          if (response && (response as { ok?: boolean }).ok) {
            setStatus('connected')
          } else {
            setStatus('error')
          }
        },
      )
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    tryConnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Extensão do Lexuri</h1>
        <p className="app-hero-subtitle">Conecte sua conta para destravar legendas direto do YouTube</p>
      </div>

      <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {status === 'checking' && <p>Verificando sua sessão…</p>}

        {status === 'no-session' && (
          <p>
            Você precisa estar logado para conectar a extensão. <a href="/login?next=/extension/connect">Fazer login</a>
          </p>
        )}

        {status === 'no-extension' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p>Não encontramos a extensão instalada neste navegador.</p>
            <p>Instale a extensão Lexuri Captions e volte nesta página para conectar sua conta automaticamente.</p>
            <button onClick={tryConnect} style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: 8 }}>
              Já instalei, tentar de novo
            </button>
          </div>
        )}

        {status === 'connecting' && <p>Conectando com a extensão…</p>}

        {status === 'connected' && (
          <div>
            <p style={{ fontWeight: 600 }}>✅ Extensão conectada!</p>
            <p>Agora, quando você assistir a um vídeo no YouTube, o botão da extensão vai deixar essa lição disponível pra todo mundo no Lexuri.</p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p>Não conseguimos conectar com a extensão. Confirme que ela está instalada e ativada.</p>
            <button onClick={tryConnect} style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: 8 }}>
              Tentar de novo
            </button>
          </div>
        )}
      </div>
    </>
  )
}
