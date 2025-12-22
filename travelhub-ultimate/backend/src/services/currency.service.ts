/**
 * Currency Conversion Service
 * Handles currency conversion using exchange rates
 * Integrates with exchangerate-api.com for real-time rates
 */

import logger from '../utils/logger.js';
import { cacheService, CACHE_TTL } from './cache.service.js';

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF',
  'RUB', 'INR', 'BRL', 'MXN', 'ZAR', 'SGD', 'HKD', 'NOK',
  'SEK', 'DKK', 'PLN', 'THB', 'IDR', 'MYR', 'PHP', 'TRY',
  'AED', 'SAR', 'ILS', 'NZD', 'KRW', 'ARS'
];

/**
 * Exchange rate data
 */
interface ExchangeRates {
  base: string;
  date: string;
  rates: { [currency: string]: number };
}

/**
 * Currency info
 */
interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}

/**
 * Currency Service
 */
class CurrencyService {
  private baseUrl = 'https://api.exchangerate-api.com/v4/latest';
  private fallbackRates: ExchangeRates;

  constructor() {
    // Fallback rates in case API is unavailable
    this.fallbackRates = {
      base: 'USD',
      date: new Date().toISOString().split('T')[0],
      rates: {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        CNY: 7.24,
        AUD: 1.53,
        CAD: 1.36,
        CHF: 0.88,
        RUB: 92.50,
        INR: 83.12,
        BRL: 4.97,
        MXN: 17.12,
        ZAR: 18.75,
        SGD: 1.34,
        HKD: 7.82,
        NOK: 10.87,
        SEK: 10.52,
        DKK: 6.89,
        PLN: 3.95,
        THB: 35.42,
        IDR: 15625,
        MYR: 4.72,
        PHP: 56.25,
        TRY: 32.15,
        AED: 3.67,
        SAR: 3.75,
        ILS: 3.72,
        NZD: 1.65,
        KRW: 1320,
        ARS: 850
      }
    };
  }

  /**
   * Get exchange rates for a base currency
   */
  async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    try {
      const cacheKey = `exchange_rates:${baseCurrency}`;

      // Try to get from cache
      const cached = await cacheService.get<ExchangeRates>(cacheKey);
      if (cached) {
        logger.info('Exchange rates retrieved from cache', { baseCurrency });
        return cached;
      }

      // Fetch from API
      const response = await fetch(`${this.baseUrl}/${baseCurrency}`);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Cache for 1 hour
      await cacheService.set(cacheKey, data, CACHE_TTL.SHORT);

      logger.info('Exchange rates fetched from API', { baseCurrency });

      return data;
    } catch (error: any) {
      logger.error('Error fetching exchange rates, using fallback', {
        error: error.message,
        baseCurrency
      });

      // Return fallback rates
      if (baseCurrency === 'USD') {
        return this.fallbackRates;
      }

      // Convert fallback rates to requested base currency
      return this.convertBase(this.fallbackRates, baseCurrency);
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{
    amount: number;
    convertedAmount: number;
    rate: number;
    fromCurrency: string;
    toCurrency: string;
    date: string;
  }> {
    try {
      // If same currency, no conversion needed
      if (fromCurrency === toCurrency) {
        return {
          amount,
          convertedAmount: amount,
          rate: 1,
          fromCurrency,
          toCurrency,
          date: new Date().toISOString().split('T')[0]
        };
      }

      // Get exchange rates for base currency
      const rates = await this.getExchangeRates(fromCurrency);

      // Get conversion rate
      const rate = rates.rates[toCurrency];

      if (!rate) {
        throw new Error(`Conversion rate for ${toCurrency} not found`);
      }

      // Calculate converted amount
      const convertedAmount = Math.round(amount * rate * 100) / 100;

      return {
        amount,
        convertedAmount,
        rate,
        fromCurrency,
        toCurrency,
        date: rates.date
      };
    } catch (error: any) {
      logger.error('Error converting currency', {
        error: error.message,
        fromCurrency,
        toCurrency
      });
      throw error;
    }
  }

  /**
   * Convert multiple amounts at once
   */
  async convertBatch(
    amounts: { amount: number; fromCurrency: string; toCurrency: string }[]
  ) {
    try {
      const results = await Promise.all(
        amounts.map(({ amount, fromCurrency, toCurrency }) =>
          this.convert(amount, fromCurrency, toCurrency)
        )
      );

      return results;
    } catch (error: any) {
      logger.error('Error in batch conversion', { error: error.message });
      throw error;
    }
  }

  /**
   * Convert base currency for exchange rates
   */
  private convertBase(rates: ExchangeRates, newBase: string): ExchangeRates {
    const conversionRate = rates.rates[newBase];

    if (!conversionRate) {
      throw new Error(`Currency ${newBase} not found in rates`);
    }

    const newRates: { [currency: string]: number } = {};

    Object.entries(rates.rates).forEach(([currency, rate]) => {
      newRates[currency] = rate / conversionRate;
    });

    return {
      base: newBase,
      date: rates.date,
      rates: newRates
    };
  }

  /**
   * Get currency information
   */
  getCurrencyInfo(code: string): CurrencyInfo | null {
    const currencyMap: { [key: string]: CurrencyInfo } = {
      USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
      EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
      GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
      JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
      CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
      AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
      CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
      CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
      RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
      INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
      BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
      MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽' },
      ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
      SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
      HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
      NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
      SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
      DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
      PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
      THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
      IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
      MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
      PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
      TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
      AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
      SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
      ILS: { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
      NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
      KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
      ARS: { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷' }
    };

    return currencyMap[code] || null;
  }

  /**
   * Get all supported currencies with info
   */
  getAllCurrencies(): CurrencyInfo[] {
    return SUPPORTED_CURRENCIES.map(code => this.getCurrencyInfo(code))
      .filter((info): info is CurrencyInfo => info !== null);
  }

  /**
   * Format amount with currency
   */
  formatAmount(amount: number, currency: string): string {
    const info = this.getCurrencyInfo(currency);
    const symbol = info?.symbol || currency;

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

    return `${symbol}${formatted}`;
  }
}

export const currencyService = new CurrencyService();
