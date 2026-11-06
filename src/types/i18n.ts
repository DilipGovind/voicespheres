export type SupportedLocale =
  | 'en'
  | 'te'
  | 'hi'
  | 'ta'
  | 'kn'
  | 'ml'
  | 'bn'
  | 'mr'
  | 'gu'
  | 'pa'
  | 'ur'
  | 'ar'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ru'
  | 'id';

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  country: string;
}

export const SUPPORTED_LOCALES: Record<SupportedLocale, LocaleInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', country: 'Global' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr', country: 'India' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', country: 'India' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', country: 'India / Sri Lanka' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr', country: 'India' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr', country: 'India' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr', country: 'Bangladesh / India' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr', country: 'India' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr', country: 'India' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr', country: 'India / Pakistan' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', country: 'Pakistan / India' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', country: 'Middle East / North Africa' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', country: 'Spain / Latin America' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', country: 'France / Global' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', country: 'Germany' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', country: 'Brazil / Portugal' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文 (简体)', direction: 'ltr', country: 'China' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', country: 'Japan' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', country: 'South Korea' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', country: 'Global' },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr', country: 'Indonesia' },
};
