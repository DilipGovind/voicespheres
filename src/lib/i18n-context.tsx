'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLocale, SUPPORTED_LOCALES, LocaleInfo } from '@/types/i18n';
import { BASE_TRANSLATIONS, TranslationDictionary } from '@/locales/translations';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  localeInfo: LocaleInfo;
  t: (key: keyof TranslationDictionary) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem('voicesphere_locale') as SupportedLocale;
      if (savedLocale && SUPPORTED_LOCALES[savedLocale]) {
        setLocaleState(savedLocale);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    if (!SUPPORTED_LOCALES[newLocale]) return;
    setLocaleState(newLocale);
    try {
      localStorage.setItem('voicesphere_locale', newLocale);
    } catch {
      // ignore
    }
  };

  const localeInfo = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.en;
  const isRtl = localeInfo.direction === 'rtl';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    }
  }, [locale, isRtl]);

  const t = (key: keyof TranslationDictionary): string => {
    const dict = BASE_TRANSLATIONS[locale] || BASE_TRANSLATIONS.en;
    return dict[key] || BASE_TRANSLATIONS.en[key] || String(key);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, localeInfo, t, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
