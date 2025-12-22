import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import { currencyService } from '../services/currency.service.js';

/**
 * Get exchange rates
 * GET /api/currency/rates
 */
export const getExchangeRates = async (req: Request, res: Response) => {
  try {
    const { base } = req.query;
    const baseCurrency = (base as string) || 'USD';

    const rates = await currencyService.getExchangeRates(baseCurrency);

    res.json({
      success: true,
      data: rates
    });
  } catch (error: any) {
    logger.error('Error fetching exchange rates', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Convert currency
 * POST /api/currency/convert
 */
export const convertCurrency = async (req: Request, res: Response) => {
  try {
    const { amount, from, to } = req.body;

    // Validation
    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, from, to'
      });
    }

    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    const result = await currencyService.convert(
      parsedAmount,
      from.toUpperCase(),
      to.toUpperCase()
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error converting currency', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Convert multiple currencies at once
 * POST /api/currency/convert/batch
 */
export const convertBatch = async (req: Request, res: Response) => {
  try {
    const { conversions } = req.body;

    if (!Array.isArray(conversions) || conversions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'conversions must be a non-empty array'
      });
    }

    // Validate each conversion
    for (const conv of conversions) {
      if (!conv.amount || !conv.from || !conv.to) {
        return res.status(400).json({
          success: false,
          error: 'Each conversion must have amount, from, and to fields'
        });
      }
    }

    const results = await currencyService.convertBatch(
      conversions.map(c => ({
        amount: Number(c.amount),
        fromCurrency: c.from.toUpperCase(),
        toCurrency: c.to.toUpperCase()
      }))
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    logger.error('Error in batch conversion', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get supported currencies
 * GET /api/currency/supported
 */
export const getSupportedCurrencies = async (req: Request, res: Response) => {
  try {
    const currencies = currencyService.getAllCurrencies();

    res.json({
      success: true,
      data: currencies
    });
  } catch (error: any) {
    logger.error('Error fetching supported currencies', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get currency information
 * GET /api/currency/info/:code
 */
export const getCurrencyInfo = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const info = currencyService.getCurrencyInfo(code.toUpperCase());

    if (!info) {
      return res.status(404).json({
        success: false,
        error: 'Currency not found'
      });
    }

    res.json({
      success: true,
      data: info
    });
  } catch (error: any) {
    logger.error('Error fetching currency info', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
