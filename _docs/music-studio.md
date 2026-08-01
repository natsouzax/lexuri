# Music Studio e análise de clareza

O Music Studio transforma 14 takeaways em 6 versos e 1 refrão, oferece treino
falado por seção e grava a performance final com um backing track sintetizado
pelo navegador.

## Configuração

O treino usa a mesma chave da OpenAI já utilizada pelo restante do Lexuri. Em
`.env.local` e nas variáveis de ambiente da Vercel, configure:

```env
OPENAI_API_KEY=cole-a-chave-aqui
```

A chave fica somente no servidor e nunca deve usar o prefixo `NEXT_PUBLIC_`.
Reinicie o servidor local ou faça um novo deploy depois de alterá-la.

## O que a avaliação mede

O servidor envia a gravação para o modelo `gpt-4o-mini-transcribe`, sem fornecer
a letra esperada como prompt. A transcrição recebe apenas uma instrução genérica
para reconhecer fala em inglês e não trocar ou traduzir para outros idiomas.
Quando disponível, o idioma materno escolhido para as traduções também informa
o contexto de sotaque (por exemplo, inglês falado com sotaque brasileiro), sem
revelar a palavra ou a letra esperada.
Depois, o Lexuri compara a transcrição com a letra
e calcula:

- clareza: combinação da correspondência, completude e confiança da transcrição;
- correspondência: porcentagem de palavras reconhecidas exatamente;
- completude: porcentagem de palavras esperadas que foram pronunciadas;
- confiança: confiança do modelo na transcrição recebida.

Esse resultado mede **inteligibilidade**, isto é, o que a IA conseguiu entender.
Ele não é uma nota fonética e não deve ser apresentado como uma medição exata de
posição da língua, prosódia ou qualidade de cada fonema.

Referência oficial:

- <https://developers.openai.com/api/docs/guides/speech-to-text>

## Banco e armazenamento

Aplicar as migrações do Supabase:

```powershell
npm run db:migrate
```

A migração `0027_user_music_studio.sql` cria:

- `user_songs`;
- `user_song_sections`;
- `pronunciation_attempts`;
- bucket privado `song-recordings`;
- políticas RLS para cada usuário acessar somente suas músicas.

A migração `0030_speaking_review.sql` acrescenta a fila de revisão oral e o
histórico textual das tentativas. O botão **Save words to speaking practice**
usa somente as palavras que a avaliação final marcou em **Practice next**. Na
rota `/speaking-review`, a palavra avança apenas quando a transcrição a reconhece
e volta depois em intervalos de repetição espaçada.

Os nomes históricos `pronunciation_attempts` e `best_pronunciation_score`
continuam no banco para evitar uma migração destrutiva, mas a interface apresenta
o resultado corretamente como clareza/inteligibilidade.

## Fluxo de áudio e privacidade

- O navegador converte o treino para WAV PCM mono, 16 kHz, com até 30 segundos.
- O usuário pode ouvir o take de treino ou substituí-lo por uma nova gravação;
  essa prévia existe somente na memória da aba atual.
- O servidor autentica o usuário e envia o áudio à OpenAI para transcrição.
- O áudio do treino não é salvo pelo Lexuri; somente transcrição, pontuações e
  feedback ficam no Supabase.
- A revisão oral usa o mesmo fluxo temporário, limitado a oito segundos. A
  palavra esperada não é enviada como prompt de transcrição; a comparação ocorre
  localmente no servidor depois que a OpenAI retorna o que entendeu.
- A performance final mistura a voz e uma rota dedicada do backing track no
  navegador antes de ser enviada ao bucket privado do Supabase.
- Em paralelo, o navegador mantém uma faixa temporária somente da voz. Ao fim
  da música, essa faixa é enviada à OpenAI para transcrever a performance
  completa e comparar o que foi entendido com toda a letra.
- A faixa isolada de voz usada na análise não é salva. O Lexuri persiste apenas
  a transcrição, as pontuações, as palavras reconhecidas/não reconhecidas e o
  feedback; o mix final continua dependendo de **Save to my Library**.
- Para evitar bloqueios de autoplay, o navegador pré-renderiza o instrumental
  em WAV. O ensaio usa um elemento de áudio comum. Na performance final, o WAV
  é decodificado uma única vez e essa mesma fonte é ligada simultaneamente à
  saída audível e ao `MediaRecorder`; assim, a base ouvida é exatamente a base
  salva junto com a voz. Depois de liberar o microfone, o usuário confirma o
  início em **Start performance**.
- A avaliação do aluno é o resultado principal. A notificação para uma conta
  de professora/admin continua disponível apenas como recurso complementar.

Para a performance final, o usuário deve preferir fones com fio. Fones
Bluetooth podem trocar de perfil quando o microfone é ativado e perder a saída
do backing track.

## Configurar a conta da professora

A professora precisa primeiro criar uma conta normal no Lexuri. Depois, no
Supabase Dashboard, abra **Table Editor → profiles**, encontre essa conta e
altere `role` de `user` para `admin`. Todas as contas com `role = admin` recebem
a notificação de música concluída em tempo real.
