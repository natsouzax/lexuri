'use client'

// i18n leve do MVP: inglês é o padrão absoluto; o popup de idioma
// (LanguageGate) grava a escolha em localStorage e ela passa a guiar
// a UI e o idioma-alvo das traduções de palavras.
import { createContext, useContext, useEffect, useState } from 'react'

// Os mesmos 12 idiomas do Lexuri original + inglês.
export type Lang =
  | 'en' | 'pt' | 'es' | 'fr' | 'de' | 'it'
  | 'ja' | 'ko' | 'zh' | 'ar' | 'tr' | 'ru' | 'hi'

export const LANG_STORAGE_KEY = 'lexuri_lang'

export const LANG_OPTIONS: Array<{ id: Lang; label: string; flag: string }> = [
  { id: 'en', label: 'English',        flag: '🇺🇸' },
  { id: 'pt', label: 'Português (BR)', flag: '🇧🇷' },
  { id: 'es', label: 'Español',        flag: '🇪🇸' },
  { id: 'fr', label: 'Français',       flag: '🇫🇷' },
  { id: 'de', label: 'Deutsch',        flag: '🇩🇪' },
  { id: 'it', label: 'Italiano',       flag: '🇮🇹' },
  { id: 'ja', label: '日本語',          flag: '🇯🇵' },
  { id: 'ko', label: '한국어',          flag: '🇰🇷' },
  { id: 'zh', label: '中文',            flag: '🇨🇳' },
  { id: 'ar', label: 'العربية',         flag: '🇸🇦' },
  { id: 'tr', label: 'Türkçe',         flag: '🇹🇷' },
  { id: 'ru', label: 'Русский',        flag: '🇷🇺' },
  { id: 'hi', label: 'हिंदी',           flag: '🇮🇳' },
]

// Nome do idioma pro prompt de tradução da IA.
export const NATIVE_LANG_NAME: Record<Lang, string> = {
  en: 'English',
  pt: 'Portuguese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese (Simplified)',
  ar: 'Arabic',
  tr: 'Turkish',
  ru: 'Russian',
  hi: 'Hindi',
}

// Sugestão pelo idioma do navegador (mesma lógica do LanguagePicker original).
export function detectBrowserLang(): Lang | null {
  if (typeof navigator === 'undefined') return null
  const nav = navigator.language.toLowerCase()
  for (const opt of LANG_OPTIONS) {
    if (nav.startsWith(opt.id)) return opt.id
  }
  return null
}

const DICT = {
  en: {
    // landing
    'landing.badge': 'Research project',
    'landing.title': 'Learn English with the songs you love',
    'landing.body': "We're testing a simple idea: listen to music with the lyrics on screen, tap words to understand them, and review in short sessions. No charges, no catch — we just want to know if it works for you.",
    'landing.cta': 'Start now',
    'landing.time': 'Takes less than 2 minutes.',
    'landing.step1.title': 'Listen to a song',
    'landing.step1.desc': 'Synced lyrics on screen, at your English level.',
    'landing.step2.title': "Tap what you don't understand",
    'landing.step2.desc': 'Instant translation and meaning. Save the words you want to learn.',
    'landing.step3.title': 'Review across 3 short days',
    'landing.step3.desc': 'Flashcards, a memory game and fill-in-the-lyrics. A few minutes a day.',
    'landing.login': 'Log in',
    'landing.privacy': 'Privacy',
    'landing.terms': 'Terms',
    // nav
    'nav.songs': 'Songs',
    'nav.albums': 'Albums',
    'nav.review': 'Review',
    'nav.library': 'Library',
    'nav.overview': 'Overview',
    // level
    'level.title': "What's your English level?",
    'level.subtitle': "We'll open a real song that matches where you're at.",
    'level.beginner.desc': 'I know some words, but full sentences are hard to follow.',
    'level.intermediate.desc': 'I can follow along, but I miss a lot of the details.',
    'level.advanced.desc': 'I understand most of it — I just want to sound more natural.',
    // home
    'home.title': 'Your songs',
    'home.subtitle': "Pick a song, listen with the lyrics, tap what you don't understand.",
    'home.pickLevel': 'Tell us your English level so we can suggest the right song.',
    'home.pickLevelCta': 'Choose level',
    'home.weekly': '🎧 Your song of the week',
    'home.yourLevel': 'your level',
    'home.done': 'Completed ✓',
    'home.reviewDay': 'Review: Day',
    'home.study': 'Study',
    // lesson
    'lesson.back': '← Songs',
    'lesson.notFound': 'Song not found.',
    'lesson.how.label': '👆 How it works',
    'lesson.how.body': 'Press play and follow the lyrics. Tap any word to see its translation — one tap saves it to your library. The highlighted expressions are the most valuable ones in this song.',
    'lesson.loading': 'Loading the song…',
    'lesson.loadError': "Couldn't load this song.",
    'lesson.retry': 'Try again',
    'lesson.keyExpressions': 'Key expressions in this song',
    'lesson.savedCount': 'words in your library 🎉',
    'lesson.savedOne': 'word in your library 🎉',
    'lesson.saveSome': 'Save a few words before you continue',
    'lesson.finishHint': 'Done listening? Your first review is now — a quick read of what you saved.',
    'lesson.finishCta': 'Start review (Day 1) →',
    'lesson.going': 'Going…',
    // review overview
    'review.title': 'Review',
    'review.subtitle': 'Three short sessions per song: reading, memory and lyrics.',
    'review.empty.title': 'No reviews yet.',
    'review.empty.body': 'Listen to a song and save some words — your first review starts right away.',
    'review.empty.cta': 'Pick a song',
    'review.pending': 'Pending',
    'review.doNow': 'Do it now →',
    'review.tomorrow': 'Available tomorrow 🌙',
    'review.completed': 'Completed cycles',
    // day info
    'day1.title': 'Day 1 — Flashcards',
    'day1.desc': 'Reread the words you saved. Just reading, no testing.',
    'day2.title': 'Day 2 — Memory game',
    'day2.desc': 'Match each word with its translation.',
    'day3.title': 'Day 3 — Complete the lyrics',
    'day3.desc': 'Fill in the song lines and write down what you learned.',
    // review runner
    'runner.back': '← Review',
    'runner.cycleDone': 'cycle complete ✅',
    'runner.cycleDoneSub': 'You finished all three days for this song.',
    'runner.nextSong': 'Next song →',
    'runner.locked.title': 'This review opens tomorrow.',
    'runner.locked.body': 'The one-day gap is what makes memory stick. Come back tomorrow for',
    'runner.locked.back': 'Back to songs',
    'runner.noWords.title': "You haven't saved words from this song yet.",
    'runner.noWords.body': 'Go back to the song and tap the words you want to learn — then the review unlocks.',
    'runner.noWords.cta': 'Open the song',
    'runner.preparing': 'Preparing your review…',
    // day activities
    'act.of': 'of',
    'act.prev': '← Previous',
    'act.next': 'Next →',
    'act.finishDay1': 'Finish Day 1 ✓',
    'act.finishDay2': 'Finish Day 2 ✓',
    'act.finishDay3': 'Finish Day 3 ✓',
    'act.saving': 'Saving…',
    'act.pairs': 'pairs',
    'act.mistakes': 'mistakes',
    'act.allPairs': 'All pairs found! 🎉',
    'act.fillTitle': 'Complete the song lines',
    'act.gotRight': 'You got {n} of {total} lines right.',
    'act.correctAnswer': 'Correct answer:',
    'act.continue': 'Continue →',
    'act.beforeFinish': '✍️ Before you finish',
    'act.takeawayQuestion': 'Which two words or learnings stuck with you the most today?',
    'act.takeawayHint': 'Only what you write here enters your glossary — and every two learnings become a verse of your personal song.',
    'act.takeaway1': '1st learning (e.g. "by the way" = incidentally)',
    'act.takeaway2': '2nd learning',
    'act.takeawayError': 'Write at least one learning — that is what goes into your glossary.',
    'act.done.title': 'Cycle complete! 🎉',
    'act.done.body': 'Your learnings are now in your glossary.',
    'act.done.verse': '🎼 A new verse in your song',
    'act.done.glossary': 'See glossary',
    // library
    'lib.title': 'Library',
    'lib.subtitle': 'The English you already own: words, learnings and your song.',
    'lib.tab.words': '📚 Words',
    'lib.tab.glossary': '✍️ Glossary',
    'lib.tab.song': '🎼 My song',
    'lib.words.empty.title': 'No words saved yet.',
    'lib.words.empty.body': 'Open a song and tap the words you want to learn.',
    'lib.glossary.how.label': 'How it works',
    'lib.glossary.how.body': 'Nothing enters here automatically. Your glossary is the learnings you wrote at the end of each review cycle.',
    'lib.glossary.empty.title': 'Glossary is empty.',
    'lib.glossary.empty.body': 'Complete Day 3 of a song and write what stuck with you.',
    'lib.song.label': '🎼 Your song',
    'lib.song.how': 'Every two learnings from your glossary become a new verse. Verse by verse, you compose the song of your own journey.',
    'lib.song.empty.title': "Your song hasn't started yet.",
    'lib.song.empty.body': 'Write two learnings in your glossary and the first verse appears here.',
    'lib.goSongs': 'Go to songs',
    // language gate
    'lesson.interactiveLyrics': '📝 Interactive lyrics',
    'lesson.savedWords': 'Your saved words',
    'runner.skipWait': 'I want to do it now anyway →',
    'srs.title': '🧠 Smart flashcards',
    'srs.body': 'Spaced repetition: your saved words come back right before you would forget them.',
    'srs.due': 'cards ready to review',
    'srs.none': 'No cards due right now — come back later.',
    'srs.start': 'Review now →',
    'srs.show': 'Show answer',
    'srs.again': 'Again',
    'srs.hard': 'Hard',
    'srs.good': 'Good',
    'srs.easy': 'Easy',
    'srs.done': 'Session complete! 🎉',
    'srs.doneBody': 'Your next reviews are already scheduled.',
    'gate.title': "What's your native language?",
    'gate.body': "We'll use it to translate words and adapt the app for you.",
  },
  pt: {
    'landing.badge': 'Projeto de pesquisa',
    'landing.title': 'Aprenda inglês com as músicas que você ama',
    'landing.body': 'Estamos testando uma ideia simples: ouvir música com a letra na tela, tocar nas palavras para entender, e revisar em sessões curtas. Sem cobrança, sem pegadinha — só queremos saber se funciona para você.',
    'landing.cta': 'Começar agora',
    'landing.time': 'Leva menos de 2 minutos.',
    'landing.step1.title': 'Ouça uma música',
    'landing.step1.desc': 'Letra sincronizada na tela, no seu nível de inglês.',
    'landing.step2.title': 'Toque no que não entender',
    'landing.step2.desc': 'Tradução e significado na hora. Salve as palavras que quiser aprender.',
    'landing.step3.title': 'Revise em 3 dias curtos',
    'landing.step3.desc': 'Flashcards, jogo da memória e complete a letra. Poucos minutos por dia.',
    'landing.login': 'Entrar',
    'landing.privacy': 'Privacidade',
    'landing.terms': 'Termos',
    'nav.songs': 'Músicas',
    'nav.albums': 'Álbuns',
    'nav.review': 'Revisão',
    'nav.library': 'Biblioteca',
    'nav.overview': 'Visão geral',
    'level.title': 'Qual é o seu nível de inglês?',
    'level.subtitle': 'Vamos abrir uma música de verdade, no nível certo pra você.',
    'level.beginner.desc': 'Sei algumas palavras, mas frases completas são difíceis.',
    'level.intermediate.desc': 'Acompanho bem, mas perco muitos detalhes.',
    'level.advanced.desc': 'Entendo quase tudo — quero soar mais natural.',
    'home.title': 'Suas músicas',
    'home.subtitle': 'Escolha uma música, ouça com a letra, toque no que não entender.',
    'home.pickLevel': 'Diga seu nível de inglês pra gente te indicar a música certa.',
    'home.pickLevelCta': 'Escolher nível',
    'home.weekly': '🎧 Sua música da semana',
    'home.yourLevel': 'seu nível',
    'home.done': 'Concluída ✓',
    'home.reviewDay': 'Revisão: Day',
    'home.study': 'Estudar',
    'lesson.back': '← Músicas',
    'lesson.notFound': 'Música não encontrada.',
    'lesson.how.label': '👆 Como funciona',
    'lesson.how.body': 'Dê play e acompanhe a letra. Toque em qualquer palavra pra ver a tradução — tocou, salvou na sua biblioteca. As expressões destacadas são as mais valiosas da música.',
    'lesson.loading': 'Carregando a música…',
    'lesson.loadError': 'Não foi possível carregar esta música.',
    'lesson.retry': 'Tentar de novo',
    'lesson.keyExpressions': 'Expressões-chave desta música',
    'lesson.savedCount': 'palavras na sua biblioteca 🎉',
    'lesson.savedOne': 'palavra na sua biblioteca 🎉',
    'lesson.saveSome': 'Salve algumas palavras antes de continuar',
    'lesson.finishHint': 'Terminou de ouvir? A primeira revisão é agora — uma leitura rápida do que você salvou.',
    'lesson.finishCta': 'Começar revisão (Day 1) →',
    'lesson.going': 'Indo…',
    'review.title': 'Revisão',
    'review.subtitle': 'Três encontros curtos com cada música: leitura, memória e letra.',
    'review.empty.title': 'Nenhuma revisão ainda.',
    'review.empty.body': 'Ouça uma música e salve algumas palavras — a primeira revisão começa na hora.',
    'review.empty.cta': 'Escolher uma música',
    'review.pending': 'Pendentes',
    'review.doNow': 'Fazer agora →',
    'review.tomorrow': 'Disponível amanhã 🌙',
    'review.completed': 'Ciclos completos',
    'day1.title': 'Day 1 — Flashcards',
    'day1.desc': 'Releia as palavras que você salvou. Só leitura, sem teste.',
    'day2.title': 'Day 2 — Jogo da memória',
    'day2.desc': 'Encontre os pares palavra ↔ tradução.',
    'day3.title': 'Day 3 — Complete a letra',
    'day3.desc': 'Preencha os trechos da música e registre seus aprendizados.',
    'runner.back': '← Revisão',
    'runner.cycleDone': 'ciclo completo ✅',
    'runner.cycleDoneSub': 'Você fechou os três dias desta música.',
    'runner.nextSong': 'Próxima música →',
    'runner.locked.title': 'Essa revisão abre amanhã.',
    'runner.locked.body': 'O intervalo de um dia é o que faz a memória fixar. Volte amanhã pro',
    'runner.locked.back': 'Voltar às músicas',
    'runner.noWords.title': 'Você ainda não salvou palavras desta música.',
    'runner.noWords.body': 'Volte pra música e toque nas palavras que quiser aprender — depois a revisão libera.',
    'runner.noWords.cta': 'Abrir a música',
    'runner.preparing': 'Preparando sua revisão…',
    'act.of': 'de',
    'act.prev': '← Anterior',
    'act.next': 'Próxima →',
    'act.finishDay1': 'Concluir Day 1 ✓',
    'act.finishDay2': 'Concluir Day 2 ✓',
    'act.finishDay3': 'Concluir Day 3 ✓',
    'act.saving': 'Salvando…',
    'act.pairs': 'pares',
    'act.mistakes': 'erros',
    'act.allPairs': 'Todos os pares encontrados! 🎉',
    'act.fillTitle': 'Complete os trechos da música',
    'act.gotRight': 'Você acertou {n} de {total} trechos.',
    'act.correctAnswer': 'Resposta certa:',
    'act.continue': 'Continuar →',
    'act.beforeFinish': '✍️ Antes de terminar',
    'act.takeawayQuestion': 'Quais foram duas palavras ou aprendizados que mais marcaram você hoje?',
    'act.takeawayHint': 'Só o que você escrever aqui entra no seu glossário — e a cada dois aprendizados, um verso da sua música pessoal nasce.',
    'act.takeaway1': '1º aprendizado (ex.: "by the way" = a propósito)',
    'act.takeaway2': '2º aprendizado',
    'act.takeawayError': 'Escreva pelo menos um aprendizado — é ele que entra no seu glossário.',
    'act.done.title': 'Ciclo completo! 🎉',
    'act.done.body': 'Seus aprendizados entraram no glossário.',
    'act.done.verse': '🎼 Um verso novo na sua música',
    'act.done.glossary': 'Ver glossário',
    'lib.title': 'Biblioteca',
    'lib.subtitle': 'O inglês que você já fez seu: palavras, aprendizados e a sua música.',
    'lib.tab.words': '📚 Palavras',
    'lib.tab.glossary': '✍️ Glossário',
    'lib.tab.song': '🎼 Minha música',
    'lib.words.empty.title': 'Nenhuma palavra salva ainda.',
    'lib.words.empty.body': 'Abra uma música e toque nas palavras que quiser aprender.',
    'lib.glossary.how.label': 'Como funciona',
    'lib.glossary.how.body': 'Nada entra aqui automaticamente. O glossário são os aprendizados que você escreveu ao fim de cada ciclo de revisão.',
    'lib.glossary.empty.title': 'Glossário vazio.',
    'lib.glossary.empty.body': 'Complete o Day 3 de uma música e escreva o que mais te marcou.',
    'lib.song.label': '🎼 Sua música',
    'lib.song.how': 'A cada dois aprendizados do glossário, um verso novo nasce. Verso a verso, você compõe a música da sua própria jornada.',
    'lib.song.empty.title': 'Sua música ainda não começou.',
    'lib.song.empty.body': 'Escreva dois aprendizados no glossário e o primeiro verso aparece aqui.',
    'lib.goSongs': 'Ir para as músicas',
    'lesson.interactiveLyrics': '📝 Letra interativa',
    'lesson.savedWords': 'Palavras que você salvou',
    'runner.skipWait': 'Quero fazer agora mesmo assim →',
    'srs.title': '🧠 Flashcards inteligentes',
    'srs.body': 'Repetição espaçada: suas palavras voltam pouco antes de você esquecê-las.',
    'srs.due': 'cards prontos pra revisar',
    'srs.none': 'Nenhum card vencido agora — volte mais tarde.',
    'srs.start': 'Revisar agora →',
    'srs.show': 'Mostrar resposta',
    'srs.again': 'De novo',
    'srs.hard': 'Difícil',
    'srs.good': 'Bom',
    'srs.easy': 'Fácil',
    'srs.done': 'Sessão completa! 🎉',
    'srs.doneBody': 'Suas próximas revisões já estão agendadas.',
    'gate.title': 'Qual é a sua língua materna?',
    'gate.body': 'Vamos usá-la para traduzir palavras e adaptar o app pra você.',
  },
  es: {
    'landing.badge': 'Proyecto de investigación',
    'landing.title': 'Aprende inglés con las canciones que amas',
    'landing.body': 'Estamos probando una idea simple: escuchar música con la letra en pantalla, tocar las palabras para entenderlas y repasar en sesiones cortas. Sin cobros, sin trampas — solo queremos saber si funciona para ti.',
    'landing.cta': 'Empezar ahora',
    'landing.time': 'Toma menos de 2 minutos.',
    'landing.step1.title': 'Escucha una canción',
    'landing.step1.desc': 'Letra sincronizada en pantalla, a tu nivel de inglés.',
    'landing.step2.title': 'Toca lo que no entiendas',
    'landing.step2.desc': 'Traducción y significado al instante. Guarda las palabras que quieras aprender.',
    'landing.step3.title': 'Repasa en 3 días cortos',
    'landing.step3.desc': 'Flashcards, juego de memoria y completa la letra. Pocos minutos al día.',
    'landing.login': 'Entrar',
    'landing.privacy': 'Privacidad',
    'landing.terms': 'Términos',
    'nav.songs': 'Canciones',
    'nav.albums': 'Álbumes',
    'nav.review': 'Repaso',
    'nav.library': 'Biblioteca',
    'nav.overview': 'Resumen',
    'level.title': '¿Cuál es tu nivel de inglés?',
    'level.subtitle': 'Abriremos una canción de verdad, en el nivel correcto para ti.',
    'level.beginner.desc': 'Sé algunas palabras, pero las frases completas son difíciles.',
    'level.intermediate.desc': 'Sigo bien, pero pierdo muchos detalles.',
    'level.advanced.desc': 'Entiendo casi todo — solo quiero sonar más natural.',
    'home.title': 'Tus canciones',
    'home.subtitle': 'Elige una canción, escúchala con la letra, toca lo que no entiendas.',
    'home.pickLevel': 'Dinos tu nivel de inglés para sugerirte la canción correcta.',
    'home.pickLevelCta': 'Elegir nivel',
    'home.weekly': '🎧 Tu canción de la semana',
    'home.yourLevel': 'tu nivel',
    'home.done': 'Completada ✓',
    'home.reviewDay': 'Repaso: Day',
    'home.study': 'Estudiar',
    'lesson.back': '← Canciones',
    'lesson.notFound': 'Canción no encontrada.',
    'lesson.how.label': '👆 Cómo funciona',
    'lesson.how.body': 'Dale play y sigue la letra. Toca cualquier palabra para ver la traducción — un toque y queda en tu biblioteca. Las expresiones destacadas son las más valiosas de la canción.',
    'lesson.loading': 'Cargando la canción…',
    'lesson.loadError': 'No se pudo cargar esta canción.',
    'lesson.retry': 'Intentar de nuevo',
    'lesson.keyExpressions': 'Expresiones clave de esta canción',
    'lesson.savedCount': 'palabras en tu biblioteca 🎉',
    'lesson.savedOne': 'palabra en tu biblioteca 🎉',
    'lesson.saveSome': 'Guarda algunas palabras antes de continuar',
    'lesson.finishHint': '¿Terminaste de escuchar? Tu primer repaso es ahora — una lectura rápida de lo que guardaste.',
    'lesson.finishCta': 'Empezar repaso (Day 1) →',
    'lesson.going': 'Yendo…',
    'review.title': 'Repaso',
    'review.subtitle': 'Tres sesiones cortas por canción: lectura, memoria y letra.',
    'review.empty.title': 'Aún no hay repasos.',
    'review.empty.body': 'Escucha una canción y guarda algunas palabras — el primer repaso empieza al instante.',
    'review.empty.cta': 'Elegir una canción',
    'review.pending': 'Pendientes',
    'review.doNow': 'Hacer ahora →',
    'review.tomorrow': 'Disponible mañana 🌙',
    'review.completed': 'Ciclos completos',
    'day1.title': 'Day 1 — Flashcards',
    'day1.desc': 'Relee las palabras que guardaste. Solo lectura, sin prueba.',
    'day2.title': 'Day 2 — Juego de memoria',
    'day2.desc': 'Encuentra los pares palabra ↔ traducción.',
    'day3.title': 'Day 3 — Completa la letra',
    'day3.desc': 'Rellena los versos de la canción y anota lo que aprendiste.',
    'runner.back': '← Repaso',
    'runner.cycleDone': 'ciclo completo ✅',
    'runner.cycleDoneSub': 'Cerraste los tres días de esta canción.',
    'runner.nextSong': 'Siguiente canción →',
    'runner.locked.title': 'Este repaso abre mañana.',
    'runner.locked.body': 'El intervalo de un día es lo que fija la memoria. Vuelve mañana para el',
    'runner.locked.back': 'Volver a las canciones',
    'runner.noWords.title': 'Aún no guardaste palabras de esta canción.',
    'runner.noWords.body': 'Vuelve a la canción y toca las palabras que quieras aprender — después se desbloquea el repaso.',
    'runner.noWords.cta': 'Abrir la canción',
    'runner.preparing': 'Preparando tu repaso…',
    'act.of': 'de',
    'act.prev': '← Anterior',
    'act.next': 'Siguiente →',
    'act.finishDay1': 'Terminar Day 1 ✓',
    'act.finishDay2': 'Terminar Day 2 ✓',
    'act.finishDay3': 'Terminar Day 3 ✓',
    'act.saving': 'Guardando…',
    'act.pairs': 'pares',
    'act.mistakes': 'errores',
    'act.allPairs': '¡Todos los pares encontrados! 🎉',
    'act.fillTitle': 'Completa los versos de la canción',
    'act.gotRight': 'Acertaste {n} de {total} versos.',
    'act.correctAnswer': 'Respuesta correcta:',
    'act.continue': 'Continuar →',
    'act.beforeFinish': '✍️ Antes de terminar',
    'act.takeawayQuestion': '¿Cuáles fueron las dos palabras o aprendizajes que más te marcaron hoy?',
    'act.takeawayHint': 'Solo lo que escribas aquí entra en tu glosario — y cada dos aprendizajes nace un verso de tu canción personal.',
    'act.takeaway1': '1er aprendizaje (ej.: "by the way" = por cierto)',
    'act.takeaway2': '2º aprendizaje',
    'act.takeawayError': 'Escribe al menos un aprendizaje — eso es lo que entra en tu glosario.',
    'act.done.title': '¡Ciclo completo! 🎉',
    'act.done.body': 'Tus aprendizajes entraron al glosario.',
    'act.done.verse': '🎼 Un verso nuevo en tu canción',
    'act.done.glossary': 'Ver glosario',
    'lib.title': 'Biblioteca',
    'lib.subtitle': 'El inglés que ya es tuyo: palabras, aprendizajes y tu canción.',
    'lib.tab.words': '📚 Palabras',
    'lib.tab.glossary': '✍️ Glosario',
    'lib.tab.song': '🎼 Mi canción',
    'lib.words.empty.title': 'Aún no hay palabras guardadas.',
    'lib.words.empty.body': 'Abre una canción y toca las palabras que quieras aprender.',
    'lib.glossary.how.label': 'Cómo funciona',
    'lib.glossary.how.body': 'Nada entra aquí automáticamente. Tu glosario son los aprendizajes que escribiste al final de cada ciclo de repaso.',
    'lib.glossary.empty.title': 'Glosario vacío.',
    'lib.glossary.empty.body': 'Completa el Day 3 de una canción y escribe lo que más te marcó.',
    'lib.song.label': '🎼 Tu canción',
    'lib.song.how': 'Cada dos aprendizajes de tu glosario nace un verso nuevo. Verso a verso, compones la canción de tu propio camino.',
    'lib.song.empty.title': 'Tu canción aún no empezó.',
    'lib.song.empty.body': 'Escribe dos aprendizajes en tu glosario y el primer verso aparece aquí.',
    'lib.goSongs': 'Ir a las canciones',
    'lesson.interactiveLyrics': '📝 Letra interactiva',
    'lesson.savedWords': 'Palabras que guardaste',
    'runner.skipWait': 'Quiero hacerlo ahora de todos modos →',
    'srs.title': '🧠 Flashcards inteligentes',
    'srs.body': 'Repetición espaciada: tus palabras vuelven justo antes de que las olvides.',
    'srs.due': 'tarjetas listas para repasar',
    'srs.none': 'Ninguna tarjeta pendiente ahora — vuelve más tarde.',
    'srs.start': 'Repasar ahora →',
    'srs.show': 'Mostrar respuesta',
    'srs.again': 'Otra vez',
    'srs.hard': 'Difícil',
    'srs.good': 'Bien',
    'srs.easy': 'Fácil',
    'srs.done': '¡Sesión completa! 🎉',
    'srs.doneBody': 'Tus próximos repasos ya están programados.',
    'gate.title': '¿Cuál es tu lengua materna?',
    'gate.body': 'La usaremos para traducir palabras y adaptar la app para ti.',
  },
} as const

import { EXTRA_DICTS } from './i18n-extra'

export type DictKey = keyof typeof DICT.en

const ALL_DICTS: Record<Lang, Partial<Record<DictKey, string>>> = {
  en: DICT.en,
  pt: DICT.pt,
  es: DICT.es,
  ...EXTRA_DICTS,
}

interface LangContextValue {
  lang: Lang
  chosen: boolean
  setLang: (lang: Lang) => void
  t: (key: DictKey, vars?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  chosen: true,
  setLang: () => {},
  t: (key) => DICT.en[key],
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  const [chosen, setChosen] = useState(true) // true até hidratar — evita flash do popup no SSR

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as Lang | null
    if (stored && stored in ALL_DICTS) {
      setLangState(stored)
      setChosen(true)
    } else {
      setChosen(false)
    }
  }, [])

  function setLang(next: Lang) {
    localStorage.setItem(LANG_STORAGE_KEY, next)
    setLangState(next)
    setChosen(true)
  }

  // A INTERFACE é sempre em inglês (imersão) — o idioma escolhido no popup
  // guia apenas a tradução de conteúdo (palavras, letras, chunks) via
  // getNativeLangName(). Os dicionários pt/es/… permanecem para o caso de
  // se querer localizar a UI no futuro, mas hoje t() resolve sempre em EN.
  function t(key: DictKey, vars?: Record<string, string | number>): string {
    let text: string = DICT.en[key]
    if (vars) {
      for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v))
    }
    return text
  }

  return (
    <LangContext.Provider value={{ lang, chosen, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

// Idioma-alvo das traduções de palavra, lido fora do React (hooks/fetches).
export function getNativeLangName(): string {
  if (typeof window === 'undefined') return 'Portuguese'
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY) as Lang | null
  return stored ? NATIVE_LANG_NAME[stored] ?? 'English' : 'English'
}
