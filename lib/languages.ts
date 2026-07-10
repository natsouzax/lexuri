export interface Language {
  code: string
  flag: string
  nativeName: string
}

export const LANGUAGES: Language[] = [
  { code: 'pt', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'es', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'ja', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'zh', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ar', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'ru', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'tr', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'hi', flag: '🇮🇳', nativeName: 'हिंदी' },
]

export const LANG_DB_NAME: Record<string, string> = {
  pt: 'Portuguese', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
  ar: 'Arabic', ru: 'Russian', tr: 'Turkish', hi: 'Hindi',
}
