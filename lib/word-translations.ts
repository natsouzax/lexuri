// Shared dictionary of common English words → native-language translations
// Used by HeroDemo (marketing) and ChunkHighlighter (demo page + app)
export const WORD_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Pronouns & basic function words
  'i': {
    'pt-BR': 'eu', 'es': 'yo', 'fr': 'je', 'de': 'ich',
    'it': 'io', 'ja': '私', 'ko': '나', 'zh': '我',
    'ar': 'أنا', 'tr': 'ben', 'ru': 'я', 'hi': 'मैं',
  },
  'you': {
    'pt-BR': 'você', 'es': 'tú / usted', 'fr': 'tu / vous', 'de': 'du / Sie',
    'it': 'tu / Lei', 'ja': 'あなた', 'ko': '당신', 'zh': '你',
    'ar': 'أنت', 'tr': 'sen / siz', 'ru': 'ты / вы', 'hi': 'आप / तुम',
  },
  'your': {
    'pt-BR': 'seu / sua', 'es': 'tu / su', 'fr': 'ton / votre', 'de': 'dein / Ihr',
    'it': 'il tuo / la tua', 'ja': 'あなたの', 'ko': '당신의', 'zh': '你的',
    'ar': 'ملكك / خاصتك', 'tr': 'senin / sizin', 'ru': 'твой / ваш', 'hi': 'आपका / तुम्हारा',
  },
  'it': {
    'pt-BR': 'isso / ele / ela', 'es': 'eso / él / ella', 'fr': 'il / elle / ça', 'de': 'es',
    'it': 'esso / ciò', 'ja': 'それ', 'ko': '그것', 'zh': '它',
    'ar': 'هو / هي', 'tr': 'o', 'ru': 'это', 'hi': 'यह',
  },
  'that': {
    'pt-BR': 'que / isso', 'es': 'que / eso', 'fr': 'que / cela', 'de': 'dass / das',
    'it': 'che / quello', 'ja': 'ということ', 'ko': '~는 것', 'zh': '那 / 那个',
    'ar': 'أن / ذلك', 'tr': 'ki / o', 'ru': 'что / это', 'hi': 'कि / वह',
  },
  'there': {
    'pt-BR': 'lá / existe', 'es': 'allí / hay', 'fr': 'là / il y a', 'de': 'dort / es gibt',
    'it': 'là / c\'è', 'ja': 'そこに / ある', 'ko': '거기에 / 있다', 'zh': '那里 / 有',
    'ar': 'هناك', 'tr': 'orada / var', 'ru': 'там / есть', 'hi': 'वहाँ / है',
  },
  'is': {
    'pt-BR': 'é / está', 'es': 'es / está', 'fr': 'est', 'de': 'ist',
    'it': 'è', 'ja': 'です / いる', 'ko': '이다 / 있다', 'zh': '是 / 在',
    'ar': 'هو / يكون', 'tr': '-dır / -dir', 'ru': 'есть / является', 'hi': 'है',
  },
  'have': {
    'pt-BR': 'ter', 'es': 'tener / haber', 'fr': 'avoir', 'de': 'haben',
    'it': 'avere', 'ja': '持つ / している', 'ko': '가지다 / 했다', 'zh': '有 / 已',
    'ar': 'يملك / لديه', 'tr': 'sahip olmak', 'ru': 'иметь', 'hi': 'रखना / है',
  },
  'something': {
    'pt-BR': 'algo / alguma coisa', 'es': 'algo', 'fr': 'quelque chose', 'de': 'etwas',
    'it': 'qualcosa', 'ja': '何か', 'ko': '뭔가', 'zh': '什么 / 某事',
    'ar': 'شيء ما', 'tr': 'bir şey', 'ru': 'что-то', 'hi': 'कुछ',
  },
  'just': {
    'pt-BR': 'apenas / simplesmente', 'es': 'solo / apenas', 'fr': 'juste / simplement', 'de': 'gerade / nur',
    'it': 'solo / appena', 'ja': 'ちょうど / ただ', 'ko': '그냥 / 딱', 'zh': '就是 / 刚',
    'ar': 'فقط / للتو', 'tr': 'sadece / tam', 'ru': 'только / просто', 'hi': 'बस / अभी',
  },
  'but': {
    'pt-BR': 'mas', 'es': 'pero', 'fr': 'mais', 'de': 'aber',
    'it': 'ma', 'ja': 'でも', 'ko': '하지만', 'zh': '但是',
    'ar': 'لكن', 'tr': 'ama', 'ru': 'но', 'hi': 'लेकिन',
  },
  'not': {
    'pt-BR': 'não', 'es': 'no', 'fr': 'pas', 'de': 'nicht',
    'it': 'non', 'ja': 'ない', 'ko': '않다', 'zh': '不',
    'ar': 'لا', 'tr': 'değil', 'ru': 'не', 'hi': 'नहीं',
  },
  'or': {
    'pt-BR': 'ou', 'es': 'o', 'fr': 'ou', 'de': 'oder',
    'it': 'o', 'ja': 'または', 'ko': '또는', 'zh': '或者',
    'ar': 'أو', 'tr': 'veya', 'ru': 'или', 'hi': 'या',
  },
  'for': {
    'pt-BR': 'por / para', 'es': 'por / para', 'fr': 'pour', 'de': 'für',
    'it': 'per', 'ja': '〜の間 / ために', 'ko': '위해서 / 동안', 'zh': '为了 / 期间',
    'ar': 'لـ / من أجل', 'tr': 'için', 'ru': 'для / за', 'hi': 'के लिए',
  },
  'from': {
    'pt-BR': 'de / a partir de', 'es': 'de / desde', 'fr': 'de / depuis', 'de': 'von / aus',
    'it': 'da', 'ja': 'から', 'ko': '~부터 / 에서', 'zh': '从',
    'ar': 'من', 'tr': '-den / -dan', 'ru': 'от / из', 'hi': 'से',
  },
  'to': {
    'pt-BR': 'para / a', 'es': 'para / a', 'fr': 'pour / à', 'de': 'zu / für',
    'it': 'per / a', 'ja': '〜するために', 'ko': '~에게 / ~하기 위해', 'zh': '为了 / 到',
    'ar': 'إلى / لـ', 'tr': 'için / -e', 'ru': 'к / в / для', 'hi': 'के लिए / को',
  },
  'do': {
    'pt-BR': 'fazer', 'es': 'hacer', 'fr': 'faire', 'de': 'machen / tun',
    'it': 'fare', 'ja': 'する', 'ko': '하다', 'zh': '做',
    'ar': 'يفعل', 'tr': 'yapmak', 'ru': 'делать', 'hi': 'करना',
  },
  'can': {
    'pt-BR': 'pode / consegue', 'es': 'puede', 'fr': 'peut', 'de': 'kann',
    'it': 'può', 'ja': 'できる', 'ko': '할 수 있다', 'zh': '能',
    'ar': 'يمكن', 'tr': 'yapabilir', 'ru': 'может', 'hi': 'सकता है',
  },
  'could': {
    'pt-BR': 'podia / conseguia', 'es': 'podía', 'fr': 'pouvais', 'de': 'konnte',
    'it': 'potevo', 'ja': 'できた', 'ko': '할 수 있었다', 'zh': '能',
    'ar': 'كان بإمكاني', 'tr': 'yapabilirdi', 'ru': 'мог', 'hi': 'सकता था',
  },
  'still': {
    'pt-BR': 'ainda', 'es': 'todavía', 'fr': 'encore', 'de': 'immer noch',
    'it': 'ancora', 'ja': 'まだ', 'ko': '아직도', 'zh': '仍然',
    'ar': 'لا يزال', 'tr': 'hâlâ', 'ru': 'всё ещё', 'hi': 'अभी भी',
  },

  // Verbs
  'understand': {
    'pt-BR': 'entender', 'es': 'entender', 'fr': 'comprendre', 'de': 'verstehen',
    'it': 'capire', 'ja': '理解する', 'ko': '이해하다', 'zh': '理解',
    'ar': 'يفهم', 'tr': 'anlamak', 'ru': 'понимать', 'hi': 'समझना',
  },
  'suggests': {
    'pt-BR': 'sugere', 'es': 'sugiere', 'fr': 'suggère', 'de': 'schlägt vor',
    'it': 'suggerisce', 'ja': '提案する', 'ko': '제안한다', 'zh': '建议',
    'ar': 'يقترح', 'tr': 'önerir', 'ru': 'предлагает', 'hi': 'सुझाता है',
  },
  'wanted': {
    'pt-BR': 'queria', 'es': 'quería', 'fr': 'voulait', 'de': 'wollte',
    'it': 'voleva', 'ja': '望んでいた', 'ko': '원했다', 'zh': '想要',
    'ar': 'أراد', 'tr': 'istedi', 'ru': 'хотел', 'hi': 'चाहता था',
  },
  'think': {
    'pt-BR': 'pense', 'es': 'piense', 'fr': 'pensez', 'de': 'denk',
    'it': 'pensa', 'ja': '考えて', 'ko': '생각해', 'zh': '想想',
    'ar': 'فكّر', 'tr': 'düşün', 'ru': 'подумайте', 'hi': 'सोचो',
  },
  'make': {
    'pt-BR': 'fazer', 'es': 'hacer', 'fr': 'faire', 'de': 'machen',
    'it': 'fare', 'ja': 'する', 'ko': '만들다', 'zh': '做',
    'ar': 'يصنع', 'tr': 'yapmak', 'ru': 'делать', 'hi': 'बनाना',
  },
  'subtract': {
    'pt-BR': 'eliminar', 'es': 'eliminar', 'fr': 'supprimer', 'de': 'entfernen',
    'it': 'eliminare', 'ja': '取り除く', 'ko': '없애다', 'zh': '去掉',
    'ar': 'إزالة', 'tr': 'çıkarmak', 'ru': 'убрать', 'hi': 'हटाना',
  },
  'done': {
    'pt-BR': 'feito', 'es': 'hecho', 'fr': 'fait', 'de': 'gemacht',
    'it': 'fatto', 'ja': 'やること', 'ko': '한', 'zh': '完成',
    'ar': 'منجز', 'tr': 'yapılmış', 'ru': 'сделанный', 'hi': 'किया',
  },

  // Nouns
  'english': {
    'pt-BR': 'inglês', 'es': 'inglés', 'fr': 'anglais', 'de': 'Englisch',
    'it': 'inglese', 'ja': '英語', 'ko': '영어', 'zh': '英语',
    'ar': 'الإنجليزية', 'tr': 'İngilizce', 'ru': 'английский', 'hi': 'अंग्रेजी',
  },
  'idea': {
    'pt-BR': 'ideia', 'es': 'idea', 'fr': 'idée', 'de': 'Idee',
    'it': 'idea', 'ja': 'アイデア', 'ko': '아이디어', 'zh': '想法',
    'ar': 'فكرة', 'tr': 'fikir', 'ru': 'идея', 'hi': 'विचार',
  },
  'days': {
    'pt-BR': 'dias', 'es': 'días', 'fr': 'jours', 'de': 'Tage',
    'it': 'giorni', 'ja': '日間', 'ko': '일', 'zh': '天',
    'ar': 'أيام', 'tr': 'gün', 'ru': 'дней', 'hi': 'दिन',
  },
  'time': {
    'pt-BR': 'tempo', 'es': 'tiempo', 'fr': 'temps', 'de': 'Zeit',
    'it': 'tempo', 'ja': '時間', 'ko': '시간', 'zh': '时间',
    'ar': 'وقت', 'tr': 'zaman', 'ru': 'время', 'hi': 'समय',
  },
  'habit': {
    'pt-BR': 'hábito', 'es': 'hábito', 'fr': 'habitude', 'de': 'Gewohnheit',
    'it': 'abitudine', 'ja': '習慣', 'ko': '습관', 'zh': '习惯',
    'ar': 'عادة', 'tr': 'alışkanlık', 'ru': 'привычка', 'hi': 'आदत',
  },
  'life': {
    'pt-BR': 'vida', 'es': 'vida', 'fr': 'vie', 'de': 'Leben',
    'it': 'vita', 'ja': '人生', 'ko': '삶', 'zh': '生活',
    'ar': 'حياة', 'tr': 'hayat', 'ru': 'жизнь', 'hi': 'जीवन',
  },
  'steps': {
    'pt-BR': 'passos', 'es': 'pasos', 'fr': 'pas', 'de': 'Schritte',
    'it': 'passi', 'ja': 'ステップ', 'ko': '단계', 'zh': '步骤',
    'ar': 'خطوات', 'tr': 'adımlar', 'ru': 'шаги', 'hi': 'कदम',
  },
  'difference': {
    'pt-BR': 'diferença', 'es': 'diferencia', 'fr': 'différence', 'de': 'Unterschied',
    'it': 'differenza', 'ja': '違い', 'ko': '차이', 'zh': '差异',
    'ar': 'فرق', 'tr': 'fark', 'ru': 'разница', 'hi': 'अंतर',
  },
  'amount': {
    'pt-BR': 'quantidade', 'es': 'cantidad', 'fr': 'quantité', 'de': 'Menge',
    'it': 'quantità', 'ja': '量', 'ko': '양', 'zh': '数量',
    'ar': 'كمية', 'tr': 'miktar', 'ru': 'количество', 'hi': 'मात्रा',
  },
  'conversations': {
    'pt-BR': 'conversas', 'es': 'conversaciones', 'fr': 'conversations', 'de': 'Gespräche',
    'it': 'conversazioni', 'ja': '会話', 'ko': '대화', 'zh': '对话',
    'ar': 'محادثات', 'tr': 'konuşmalar', 'ru': 'разговоры', 'hi': 'बातचीत',
  },

  // Adjectives
  'simple': {
    'pt-BR': 'simples', 'es': 'simple', 'fr': 'simple', 'de': 'einfach',
    'it': 'semplice', 'ja': 'シンプル', 'ko': '간단한', 'zh': '简单',
    'ar': 'بسيط', 'tr': 'basit', 'ru': 'простой', 'hi': 'सरल',
  },
  'new': {
    'pt-BR': 'novo', 'es': 'nuevo', 'fr': 'nouveau', 'de': 'neu',
    'it': 'nuovo', 'ja': '新しい', 'ko': '새로운', 'zh': '新的',
    'ar': 'جديد', 'tr': 'yeni', 'ru': 'новый', 'hi': 'नया',
  },
  'small': {
    'pt-BR': 'pequeno', 'es': 'pequeño', 'fr': 'petit', 'de': 'klein',
    'it': 'piccolo', 'ja': '小さな', 'ko': '작은', 'zh': '小的',
    'ar': 'صغير', 'tr': 'küçük', 'ru': 'маленький', 'hi': 'छोटा',
  },
  'fast': {
    'pt-BR': 'rápido', 'es': 'rápido', 'fr': 'rapide', 'de': 'schnell',
    'it': 'veloce', 'ja': '速い', 'ko': '빠른', 'zh': '快速',
    'ar': 'سريع', 'tr': 'hızlı', 'ru': 'быстрый', 'hi': 'तेज़',
  },
  'right': {
    'pt-BR': 'certo / correto', 'es': 'correcto', 'fr': 'juste / correct', 'de': 'richtig',
    'it': 'giusto', 'ja': '正しい', 'ko': '맞는', 'zh': '正确的',
    'ar': 'صحيح', 'tr': 'doğru', 'ru': 'правильный', 'hi': 'सही',
  },
  'remarkable': {
    'pt-BR': 'notável', 'es': 'notable', 'fr': 'remarquable', 'de': 'bemerkenswert',
    'it': 'notevole', 'ja': '注目すべき', 'ko': '놀라운', 'zh': '显著的',
    'ar': 'ملحوظ', 'tr': 'dikkat çekici', 'ru': 'замечательный', 'hi': 'उल्लेखनीय',
  },

  // Adverbs
  'consistently': {
    'pt-BR': 'consistentemente', 'es': 'de forma constante', 'fr': 'de façon constante', 'de': 'konsequent',
    'it': 'costantemente', 'ja': '一貫して', 'ko': '꾸준히', 'zh': '持续地',
    'ar': 'باستمرار', 'tr': 'tutarlı biçimde', 'ru': 'последовательно', 'hi': 'लगातार',
  },
}

// Multi-word grammar patterns & fixed phrases
// Checked before single-word lookup so they always win
export const PHRASE_TRANSLATIONS: Record<string, Record<string, string>> = {
  'used to': {
    'pt-BR': 'costumava / tinha o hábito de',
    'es':    'solía / tenía la costumbre de',
    'fr':    "avait l'habitude de",
    'de':    'pflegte zu / hatte die Gewohnheit',
    'it':    'era solito / aveva l\'abitudine di',
    'ja':    'かつて〜していた',
    'ko':    '~하곤 했다',
    'zh':    '以前常常',
    'ar':    'اعتاد أن',
    'tr':    'eskiden yapardı',
    'ru':    'раньше / привык',
    'hi':    'पहले करता था',
  },
  'turns out': {
    'pt-BR': 'acontece que / resulta que',
    'es':    'resulta que',
    'fr':    "il s'avère que",
    'de':    'es stellt sich heraus',
    'it':    'risulta che',
    'ja':    'どうやら〜らしい',
    'ko':    '알고 보니',
    'zh':    '结果发现',
    'ar':    'اتضح أن',
    'tr':    'meğer / ortaya çıkıyor ki',
    'ru':    'оказывается',
    'hi':    'पता चला कि',
  },
  'think about': {
    'pt-BR': 'pense nisso / reflita sobre',
    'es':    'piénsalo / reflexiona sobre',
    'fr':    'réfléchis-y / pense à',
    'de':    'denk darüber nach',
    'it':    'pensaci / rifletti su',
    'ja':    '考えてみて',
    'ko':    '생각해봐',
    'zh':    '想想这个',
    'ar':    'فكّر في الأمر',
    'tr':    'bir düşün',
    'ru':    'подумай об этом',
    'hi':    'इसके बारे में सोचो',
  },
}

// ── Tokenizer ────────────────────────────────────────────────────────────────

export type Token =
  | { kind: 'plain';  content: string }
  | { kind: 'word';   content: string; translation: string }
  | { kind: 'phrase'; content: string; translation: string }

/** Splits `text` into plain, word, and phrase tokens for the given language. */
export function tokenizeText(text: string, lang: string): Token[] {
  const phraseKeys = Object.keys(PHRASE_TRANSLATIONS).sort((a, b) => b.length - a.length)
  const escaped = phraseKeys.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = escaped.length
    ? new RegExp(`(${escaped.join('|')})|([a-zA-Z']+)|([^a-zA-Z']+)`, 'gi')
    : /([a-zA-Z']+)|([^a-zA-Z']+)/g

  const tokens: Token[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const full = match[0]
    const lower = full.toLowerCase()
    const phraseTranslation = PHRASE_TRANSLATIONS[lower]?.[lang]
    if (phraseTranslation) {
      tokens.push({ kind: 'phrase', content: full, translation: phraseTranslation })
    } else if (/[a-zA-Z]/.test(full)) {
      // Split on apostrophe so "you've" → "you", "it's" → "it", "can't" → "can"
      const wordKey = lower.split("'")[0]
      const wordTranslation = WORD_TRANSLATIONS[wordKey]?.[lang]
      tokens.push(wordTranslation
        ? { kind: 'word',  content: full, translation: wordTranslation }
        : { kind: 'plain', content: full },
      )
    } else {
      tokens.push({ kind: 'plain', content: full })
    }
  }
  return tokens
}
