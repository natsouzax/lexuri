# Azure Speech e Music Studio

O Music Studio transforma 14 takeaways em 6 versos e 1 refrão, oferece treino
de pronúncia por seção e grava a performance final com um backing track
sintetizado pelo navegador.

## Criar o recurso gratuito

1. Entre em <https://portal.azure.com> com a conta que será responsável pelo projeto.
2. Clique em **Create a resource** e pesquise por **Speech service** ou **Azure AI Speech**.
3. Configure:
   - Subscription: a assinatura Azure disponível.
   - Resource group: crie ou selecione o grupo do Lexuri.
   - Region: **Brazil South** (`brazilsouth`).
   - Name: um nome único, por exemplo `lexuri-speech-dev`.
   - Pricing tier: **Free F0**.
4. Confirme em **Review + create** e depois em **Create**.
5. Abra o recurso e entre em **Resource Management → Keys and Endpoint**.
6. Copie **KEY 1**, **Region** e **Endpoint**.

O nível F0 oferece 5 horas de Speech-to-Text em tempo real por mês. Se o
portal não permitir criar outro F0, verifique se a assinatura já possui um
recurso Speech gratuito.

Referências oficiais:

- <https://azure.microsoft.com/pt-br/pricing/free-services/>
- <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short>
- <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment>

## Configurar localmente

Nunca envie a chave por chat e nunca use `NEXT_PUBLIC_` no nome da variável.
Adicione ao `.env.local`:

```env
AZURE_SPEECH_KEY=cole-a-key-1-aqui
AZURE_SPEECH_REGION=brazilsouth
AZURE_SPEECH_ENDPOINT=https://SEU-RECURSO.cognitiveservices.azure.com
AZURE_SPEECH_PROSODY=false
```

Reinicie `npm run dev` depois de alterar o arquivo.

`AZURE_SPEECH_PROSODY=false` mantém o MVP no conjunto básico de avaliação.
Accuracy, fluency, completeness, palavras e fonemas continuam disponíveis.
Ative `true` apenas quando quiser a avaliação adicional de ritmo, tonicidade e
entonação e já tiver conferido a cobrança do recurso.

## Configurar na Vercel

No projeto da Vercel, abra **Settings → Environment Variables** e crie as
mesmas quatro variáveis para Preview e Production. Faça um novo deploy depois
de salvá-las.

## Banco e armazenamento

Aplicar as migrações do Supabase:

```powershell
npm run db:migrate
```

A migração `0027_user_music_studio.sql` cria:

- `user_songs`
- `user_song_sections`
- `pronunciation_attempts`
- bucket privado `song-recordings`
- políticas RLS para cada usuário acessar somente suas músicas

## Fluxo de áudio

- Treino falado: o navegador converte a gravação para WAV PCM mono, 16 kHz e
  envia um trecho de até 30 segundos ao servidor.
- Avaliação: o servidor autentica o usuário, recupera a letra de referência e
  chama o Azure sem expor a chave.
- Privacidade: o áudio do treino é descartado depois da análise; somente
  pontuações e feedback são salvos.
- Performance: o navegador mistura o microfone com o backing track e envia
  diretamente para o bucket privado do Supabase.
- Conclusão: administradores recebem uma notificação no Lexuri.

Para melhor qualidade, o usuário deve cantar com fones de ouvido.

## Configurar a conta da professora

A professora precisa primeiro criar uma conta normal no Lexuri. Depois, no
Supabase Dashboard, abra **Table Editor → profiles**, encontre essa conta e
altere `role` de `user` para `admin`. Não existe administrador cadastrado por
padrão. Todas as contas com `role = admin` recebem a notificação de música
concluída em tempo real.
