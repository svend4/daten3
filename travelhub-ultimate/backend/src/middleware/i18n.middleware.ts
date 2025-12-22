/**
 * Internationalization (i18n) Middleware
 * Multi-language support for TravelHub
 * Based on Innovation Library best practices
 */

import { Request, Response, NextFunction } from 'express';
import i18next from 'i18next';
import * as i18nextMiddleware from 'i18next-http-middleware';
import logger from '../utils/logger.js';

/**
 * Supported languages
 */
export enum SupportedLanguage {
  EN = 'en',
  RU = 'ru',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  ZH = 'zh',
  JA = 'ja',
}

/**
 * Translation resources
 */
const resources = {
  en: {
    translation: {
      welcome: 'Welcome to TravelHub',
      booking_confirmed: 'Your booking has been confirmed',
      payment_successful: 'Payment successful',
      error_occurred: 'An error occurred',
      not_found: 'Resource not found',
      unauthorized: 'Unauthorized access',
      // Add more translations...
    },
  },
  ru: {
    translation: {
      welcome: 'Добро пожаловать в TravelHub',
      booking_confirmed: 'Ваше бронирование подтверждено',
      payment_successful: 'Платеж успешен',
      error_occurred: 'Произошла ошибка',
      not_found: 'Ресурс не найден',
      unauthorized: 'Неавторизованный доступ',
    },
  },
  es: {
    translation: {
      welcome: 'Bienvenido a TravelHub',
      booking_confirmed: 'Su reserva ha sido confirmada',
      payment_successful: 'Pago exitoso',
      error_occurred: 'Ocurrió un error',
      not_found: 'Recurso no encontrado',
      unauthorized: 'Acceso no autorizado',
    },
  },
  fr: {
    translation: {
      welcome: 'Bienvenue sur TravelHub',
      booking_confirmed: 'Votre réservation a été confirmée',
      payment_successful: 'Paiement réussi',
      error_occurred: 'Une erreur s\'est produite',
      not_found: 'Ressource introuvable',
      unauthorized: 'Accès non autorisé',
    },
  },
  de: {
    translation: {
      welcome: 'Willkommen bei TravelHub',
      booking_confirmed: 'Ihre Buchung wurde bestätigt',
      payment_successful: 'Zahlung erfolgreich',
      error_occurred: 'Ein Fehler ist aufgetreten',
      not_found: 'Ressource nicht gefunden',
      unauthorized: 'Nicht autorisierter Zugriff',
    },
  },
};

/**
 * i18n statistics
 */
const stats = {
  totalRequests: 0,
  byLanguage: new Map<string, number>(),
  translationsUsed: new Map<string, number>(),
  recentRequests: [] as Array<{
    language: string;
    path: string;
    timestamp: Date;
  }>,
};

/**
 * Initialize i18n
 */
export const initializeI18n = async (): Promise<void> => {
  try {
    await i18next.init({
      lng: SupportedLanguage.EN, // Default language
      fallbackLng: SupportedLanguage.EN,
      resources,
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      detection: {
        order: ['querystring', 'header', 'cookie'],
        lookupQuerystring: 'lang',
        lookupCookie: 'i18next',
        lookupHeader: 'accept-language',
        caches: ['cookie'],
      },
    });

    // Initialize stats for all supported languages
    for (const lang of Object.values(SupportedLanguage)) {
      stats.byLanguage.set(lang, 0);
    }

    logger.info('i18n initialized successfully');
  } catch (error: any) {
    logger.error('Failed to initialize i18n:', error);
    throw error;
  }
};

/**
 * i18n middleware
 */
export const i18nMiddleware = () => {
  return i18nextMiddleware.handle(i18next, {
    removeLngFromUrl: false,
  });
};

/**
 * Language detection and stats middleware
 */
export const i18nStatsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const language = (req as any).language || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';

  // Update stats
  stats.totalRequests++;
  const langCount = stats.byLanguage.get(language) || 0;
  stats.byLanguage.set(language, langCount + 1);

  // Add to recent requests
  stats.recentRequests.push({
    language,
    path: req.originalUrl || req.url,
    timestamp: new Date(),
  });

  // Keep only last 50
  if (stats.recentRequests.length > 50) {
    stats.recentRequests = stats.recentRequests.slice(-50);
  }

  next();
};

/**
 * Get translation function for request
 */
export const getTranslation = (req: Request) => {
  return (req as any).t || i18next.t.bind(i18next);
};

/**
 * Translate string
 */
export const translate = (key: string, language?: string, options?: any): string => {
  try {
    const translation = language
      ? i18next.t(key, { lng: language, ...options })
      : i18next.t(key, options);

    // Track translation usage
    const count = stats.translationsUsed.get(key) || 0;
    stats.translationsUsed.set(key, count + 1);

    // Ensure string return (i18next.t can return string or object)
    return typeof translation === 'string' ? translation : JSON.stringify(translation);
  } catch (error: any) {
    logger.error(`Translation error for key "${key}":`, error);
    return key; // Return key if translation fails
  }
};

/**
 * Get i18n statistics
 */
export const getI18nStats = () => {
  const byLanguage: Record<string, number> = {};
  for (const [lang, count] of stats.byLanguage.entries()) {
    byLanguage[lang] = count;
  }

  const topTranslations = Array.from(stats.translationsUsed.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .reduce((acc, [key, count]) => {
      acc[key] = count;
      return acc;
    }, {} as Record<string, number>);

  const languageDistribution = stats.totalRequests > 0
    ? Object.fromEntries(
        Object.entries(byLanguage).map(([lang, count]) => [
          lang,
          Math.round((count / stats.totalRequests) * 100),
        ])
      )
    : {};

  return {
    totalRequests: stats.totalRequests,
    byLanguage,
    languageDistribution,
    topTranslations,
    supportedLanguages: Object.values(SupportedLanguage),
    recentRequests: stats.recentRequests.slice(-20),
  };
};

/**
 * Reset i18n statistics
 */
export const resetI18nStats = (): void => {
  stats.totalRequests = 0;
  stats.byLanguage.clear();
  stats.translationsUsed.clear();
  stats.recentRequests = [];

  // Reinitialize language stats
  for (const lang of Object.values(SupportedLanguage)) {
    stats.byLanguage.set(lang, 0);
  }
};

export default i18next;
