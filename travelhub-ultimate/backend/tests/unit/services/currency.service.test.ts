/**
 * Unit Tests for Currency Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { currencyService, SUPPORTED_CURRENCIES } from '@/services/currency.service';
import { cacheService } from '@/services/cache.service';

// Mock dependencies
vi.mock('@/services/cache.service', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
  },
  CACHE_TTL: {
    SHORT: 300,
    MEDIUM: 1800,
  },
}));

vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock global fetch
global.fetch = vi.fn();

describe('CurrencyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExchangeRates', () => {
    it('should return cached rates if available', async () => {
      const mockRates = {
        base: 'USD',
        date: '2024-12-22',
        rates: { EUR: 0.92, GBP: 0.79 },
      };
      vi.mocked(cacheService.get).mockResolvedValue(JSON.stringify(mockRates));

      const result = await currencyService.getExchangeRates('USD');

      expect(result).toEqual(mockRates);
      expect(cacheService.get).toHaveBeenCalledWith('exchange_rates:USD');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch from API when cache is empty', async () => {
      const mockRates = {
        base: 'USD',
        date: '2024-12-22',
        rates: { EUR: 0.92, GBP: 0.79, JPY: 149.5 },
      };
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockRates,
      } as Response);

      const result = await currencyService.getExchangeRates('USD');

      expect(result).toEqual(mockRates);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should use fallback rates when API fails', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await currencyService.getExchangeRates('USD');

      expect(result.base).toBe('USD');
      expect(result.rates).toHaveProperty('EUR');
      expect(result.rates).toHaveProperty('GBP');
    });

    it('should convert fallback rates to requested base currency', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      const result = await currencyService.getExchangeRates('EUR');

      expect(result.base).toBe('EUR');
      expect(result.rates).toHaveProperty('USD');
    });
  });

  describe('convert', () => {
    it('should return same amount for same currency conversion', async () => {
      const result = await currencyService.convert(100, 'USD', 'USD');

      expect(result).toEqual({
        amount: 100,
        convertedAmount: 100,
        rate: 1,
        fromCurrency: 'USD',
        toCurrency: 'USD',
        date: expect.any(String),
      });
    });

    it('should convert between different currencies', async () => {
      const mockRates = {
        base: 'USD',
        date: '2024-12-22',
        rates: { EUR: 0.92, GBP: 0.79 },
      };
      vi.mocked(cacheService.get).mockResolvedValue(JSON.stringify(mockRates));

      const result = await currencyService.convert(100, 'USD', 'EUR');

      expect(result).toEqual({
        amount: 100,
        convertedAmount: 92,
        rate: 0.92,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        date: '2024-12-22',
      });
    });

    it('should round converted amount to 2 decimal places', async () => {
      const mockRates = {
        base: 'USD',
        date: '2024-12-22',
        rates: { JPY: 149.567 },
      };
      vi.mocked(cacheService.get).mockResolvedValue(JSON.stringify(mockRates));

      const result = await currencyService.convert(100, 'USD', 'JPY');

      expect(result.convertedAmount).toBe(14956.7);
    });

    it('should throw error if target currency not found in rates', async () => {
      const mockRates = {
        base: 'USD',
        date: '2024-12-22',
        rates: { EUR: 0.92 },
      };
      vi.mocked(cacheService.get).mockResolvedValue(JSON.stringify(mockRates));

      await expect(currencyService.convert(100, 'USD', 'INVALID')).rejects.toThrow(
        'Conversion rate for INVALID not found'
      );
    });
  });

  describe('convertBatch', () => {
    it('should convert multiple amounts at once', async () => {
      const mockRates = {
        base: 'USD',
        date: '2024-12-22',
        rates: { EUR: 0.92, GBP: 0.79 },
      };
      vi.mocked(cacheService.get).mockResolvedValue(JSON.stringify(mockRates));

      const amounts = [
        { amount: 100, fromCurrency: 'USD', toCurrency: 'EUR' },
        { amount: 200, fromCurrency: 'USD', toCurrency: 'GBP' },
      ];

      const results = await currencyService.convertBatch(amounts);

      expect(results).toHaveLength(2);
      expect(results[0].convertedAmount).toBe(92);
      expect(results[1].convertedAmount).toBe(158);
    });

    it('should handle empty batch', async () => {
      const results = await currencyService.convertBatch([]);
      expect(results).toEqual([]);
    });
  });

  describe('getCurrencyInfo', () => {
    it('should return currency info for valid code', () => {
      const info = currencyService.getCurrencyInfo('USD');

      expect(info).toEqual({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        flag: '🇺🇸',
      });
    });

    it('should return currency info for EUR', () => {
      const info = currencyService.getCurrencyInfo('EUR');

      expect(info).toEqual({
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        flag: '🇪🇺',
      });
    });

    it('should return null for invalid currency code', () => {
      const info = currencyService.getCurrencyInfo('INVALID');
      expect(info).toBeNull();
    });

    it('should return currency info for all supported currencies', () => {
      SUPPORTED_CURRENCIES.forEach((code) => {
        const info = currencyService.getCurrencyInfo(code);
        expect(info).not.toBeNull();
        expect(info?.code).toBe(code);
      });
    });
  });

  describe('getAllCurrencies', () => {
    it('should return all supported currencies with info', () => {
      const currencies = currencyService.getAllCurrencies();

      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies[0]).toHaveProperty('code');
      expect(currencies[0]).toHaveProperty('name');
      expect(currencies[0]).toHaveProperty('symbol');
    });

    it('should match SUPPORTED_CURRENCIES length', () => {
      const currencies = currencyService.getAllCurrencies();
      expect(currencies.length).toBe(SUPPORTED_CURRENCIES.length);
    });
  });

  describe('formatAmount', () => {
    it('should format USD amount correctly', () => {
      const formatted = currencyService.formatAmount(1234.56, 'USD');
      expect(formatted).toBe('$1,234.56');
    });

    it('should format EUR amount correctly', () => {
      const formatted = currencyService.formatAmount(9876.54, 'EUR');
      expect(formatted).toBe('€9,876.54');
    });

    it('should format GBP amount correctly', () => {
      const formatted = currencyService.formatAmount(500.99, 'GBP');
      expect(formatted).toBe('£500.99');
    });

    it('should handle amounts without decimals', () => {
      const formatted = currencyService.formatAmount(1000, 'USD');
      expect(formatted).toBe('$1,000.00');
    });

    it('should use currency code for unknown currencies', () => {
      const formatted = currencyService.formatAmount(100, 'UNKNOWN');
      expect(formatted).toContain('UNKNOWN');
    });

    it('should always show 2 decimal places', () => {
      const formatted = currencyService.formatAmount(99, 'USD');
      expect(formatted).toBe('$99.00');
    });
  });

  describe('SUPPORTED_CURRENCIES constant', () => {
    it('should contain common major currencies', () => {
      expect(SUPPORTED_CURRENCIES).toContain('USD');
      expect(SUPPORTED_CURRENCIES).toContain('EUR');
      expect(SUPPORTED_CURRENCIES).toContain('GBP');
      expect(SUPPORTED_CURRENCIES).toContain('JPY');
      expect(SUPPORTED_CURRENCIES).toContain('CNY');
    });

    it('should have at least 20 currencies', () => {
      expect(SUPPORTED_CURRENCIES.length).toBeGreaterThanOrEqual(20);
    });

    it('should not have duplicate currencies', () => {
      const unique = new Set(SUPPORTED_CURRENCIES);
      expect(unique.size).toBe(SUPPORTED_CURRENCIES.length);
    });
  });
});
