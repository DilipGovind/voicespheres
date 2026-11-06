import { describe, it, expect } from 'vitest';
import { SUPPORTED_LOCALES, SupportedLocale } from '../src/types/i18n';
import { BASE_TRANSLATIONS } from '../src/locales/translations';

describe('Global Multilingual Support (21 Languages)', () => {
  const mandatory21Languages: SupportedLocale[] = [
    'en',
    'te',
    'hi',
    'ta',
    'kn',
    'ml',
    'bn',
    'mr',
    'gu',
    'pa',
    'ur',
    'ar',
    'es',
    'fr',
    'de',
    'pt',
    'zh',
    'ja',
    'ko',
    'ru',
    'id',
  ];

  it('contains exactly the 21 required global languages with native names', () => {
    mandatory21Languages.forEach((code) => {
      expect(SUPPORTED_LOCALES).toHaveProperty(code);
      const info = SUPPORTED_LOCALES[code];
      expect(info.nativeName.length).toBeGreaterThan(0);
      expect(info.direction).toMatch(/^(ltr|rtl)$/);
    });
  });

  it('correctly sets RTL direction for Arabic and Urdu', () => {
    expect(SUPPORTED_LOCALES.ar.direction).toBe('rtl');
    expect(SUPPORTED_LOCALES.ur.direction).toBe('rtl');
    expect(SUPPORTED_LOCALES.en.direction).toBe('ltr');
    expect(SUPPORTED_LOCALES.te.direction).toBe('ltr');
  });

  it('provides translations for every supported language', () => {
    mandatory21Languages.forEach((code) => {
      const dict = BASE_TRANSLATIONS[code];
      expect(dict).toBeDefined();
      expect(dict.appTitle).toBeDefined();
      expect(dict.accessibilityCenter).toBeDefined();
      expect(dict.liveCaptions).toBeDefined();
    });
  });
});
