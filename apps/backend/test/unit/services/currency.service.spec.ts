import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CurrencyService } from '../../../src/modules/accounts/services/currency.service';

// Mock global fetch
global.fetch = jest.fn();

describe('CurrencyService', () => {
  let service: CurrencyService;
  let configService: jest.Mocked<ConfigService>;

  const mockExchangeRateResponse = {
    result: 'success',
    documentation: 'https://www.exchangerate-api.com/docs',
    terms_of_use: 'https://www.exchangerate-api.com/terms',
    time_last_update_unix: 1704067200,
    time_last_update_utc: 'Mon, 01 Jan 2024 00:00:00 +0000',
    time_next_update_unix: 1704153600,
    time_next_update_utc: 'Tue, 02 Jan 2024 00:00:00 +0000',
    base_code: 'USD',
    conversion_rates: {
      USD: 1,
      BRL: 5.0,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.5,
    },
  };

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);

    // Clear mocks and cache before each test
    jest.clearAllMocks();
    service.clearCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== GETEXCHANGERATE METHOD ====================

  describe('getExchangeRate', () => {
    describe('same currency', () => {
      it('should return 1 when converting same currency', async () => {
        const rate = await service.getExchangeRate('USD', 'USD');
        expect(rate).toBe(1);
        expect(fetch).not.toHaveBeenCalled();
      });

      it('should return 1 for BRL to BRL', async () => {
        const rate = await service.getExchangeRate('BRL', 'BRL');
        expect(rate).toBe(1);
      });

      it('should return 1 for EUR to EUR', async () => {
        const rate = await service.getExchangeRate('EUR', 'EUR');
        expect(rate).toBe(1);
      });
    });

    describe('API success', () => {
      it('should fetch exchange rate from API successfully', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateResponse,
        });

        const rate = await service.getExchangeRate('USD', 'BRL');

        expect(fetch).toHaveBeenCalledWith(
          'https://api.exchangerate-api.com/v4/latest/USD'
        );
        expect(rate).toBe(5.0);
      });

      it('should fetch USD to EUR rate', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateResponse,
        });

        const rate = await service.getExchangeRate('USD', 'EUR');

        expect(rate).toBe(0.85);
      });

      it('should fetch USD to GBP rate', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateResponse,
        });

        const rate = await service.getExchangeRate('USD', 'GBP');

        expect(rate).toBe(0.73);
      });

      it('should fetch USD to JPY rate', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateResponse,
        });

        const rate = await service.getExchangeRate('USD', 'JPY');

        expect(rate).toBe(110.5);
      });

      it('should return 1 if target currency not found in API response', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateResponse,
        });

        const rate = await service.getExchangeRate('USD', 'XYZ');

        expect(rate).toBe(1);
      });
    });

    describe('cache behavior', () => {
      it('should use cached rate on second call', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateResponse,
        });

        // First call - fetches from API
        const rate1 = await service.getExchangeRate('USD', 'BRL');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(rate1).toBe(5.0);

        // Second call - uses cache
        const rate2 = await service.getExchangeRate('USD', 'BRL');
        expect(fetch).toHaveBeenCalledTimes(1); // Still 1, no new fetch
        expect(rate2).toBe(5.0);
      });

      it('should cache multiple currencies from same base', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateResponse,
        });

        await service.getExchangeRate('USD', 'BRL');
        await service.getExchangeRate('USD', 'EUR');
        await service.getExchangeRate('USD', 'GBP');

        expect(fetch).toHaveBeenCalledTimes(1); // Only one API call
      });

      it('should fetch again after cache expires', async () => {
        // Mock first fetch
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateResponse,
        });

        await service.getExchangeRate('USD', 'BRL');
        expect(fetch).toHaveBeenCalledTimes(1);

        // Clear cache to simulate expiration
        service.clearCache();

        // Mock second fetch
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockExchangeRateResponse,
            conversion_rates: { USD: 1, BRL: 5.5 },
          }),
        });

        const rate = await service.getExchangeRate('USD', 'BRL');
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(rate).toBe(5.5);
      });

      it('should maintain separate cache for different base currencies', async () => {
        (fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockExchangeRateResponse,
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              ...mockExchangeRateResponse,
              base_code: 'EUR',
              conversion_rates: { EUR: 1, BRL: 5.9 },
            }),
          });

        await service.getExchangeRate('USD', 'BRL');
        await service.getExchangeRate('EUR', 'BRL');

        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('API errors', () => {
      it('should use fallback when API returns non-ok status', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        const rate = await service.getExchangeRate('USD', 'BRL');

        expect(rate).toBe(5.0); // Fallback rate
      });

      it('should use fallback when API returns error result', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: 'error' }),
        });

        const rate = await service.getExchangeRate('USD', 'BRL');

        expect(rate).toBe(5.0); // Fallback rate
      });

      it('should use fallback when fetch throws network error', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const rate = await service.getExchangeRate('USD', 'BRL');

        expect(rate).toBe(5.0); // Fallback rate
      });

      it('should use fallback when API times out', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('Request timeout'));

        const rate = await service.getExchangeRate('USD', 'BRL');

        expect(rate).toBe(5.0);
      });

      it('should use fallback for EUR conversion on API failure', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

        const rate = await service.getExchangeRate('USD', 'EUR');

        // USD->EUR using fallback: USD=5.0 BRL, EUR=5.5 BRL, so USD->EUR = 5.0/5.5
        expect(rate).toBeCloseTo(5.0 / 5.5, 4);
      });

      it('should use fallback for GBP conversion on API failure', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

        const rate = await service.getExchangeRate('USD', 'GBP');

        // USD->GBP using fallback: USD=5.0 BRL, GBP=6.3 BRL, so USD->GBP = 5.0/6.3
        expect(rate).toBeCloseTo(5.0 / 6.3, 4);
      });
    });

    describe('fallback rates', () => {
      it('should use fallback rate for USD to BRL', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

        const rate = await service.getExchangeRate('USD', 'BRL');

        expect(rate).toBe(5.0);
      });

      it('should use fallback rate for BRL to USD (inverse)', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

        const rate = await service.getExchangeRate('BRL', 'USD');

        expect(rate).toBe(1 / 5.0); // 0.2
      });

      it('should use fallback rate for EUR to BRL', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

        const rate = await service.getExchangeRate('EUR', 'BRL');

        expect(rate).toBe(5.5);
      });

      it('should use fallback rate for BRL to EUR (inverse)', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

        const rate = await service.getExchangeRate('BRL', 'EUR');

        expect(rate).toBe(1 / 5.5);
      });

      it('should calculate cross-rate for USD to EUR using fallback', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

        const rate = await service.getExchangeRate('USD', 'EUR');

        // USD->BRL = 5.0, EUR->BRL = 5.5, so USD->EUR = 5.0/5.5
        expect(rate).toBeCloseTo(5.0 / 5.5, 4);
      });

      it('should return 1 for unknown currency pairs in fallback', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));

        const rate = await service.getExchangeRate('XYZ', 'ABC');

        expect(rate).toBe(1);
      });
    });
  });

  // ==================== CONVERTAMOUNT METHOD ====================

  describe('convertAmount', () => {
    it('should convert amount from USD to BRL', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const converted = await service.convertAmount(100, 'USD', 'BRL');

      expect(converted).toBe(500); // 100 * 5.0
    });

    it('should convert amount from USD to EUR', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const converted = await service.convertAmount(100, 'USD', 'EUR');

      expect(converted).toBe(85); // 100 * 0.85
    });

    it('should convert decimal amounts', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const converted = await service.convertAmount(123.45, 'USD', 'BRL');

      expect(converted).toBeCloseTo(617.25, 2); // 123.45 * 5.0
    });

    it('should return same amount when converting same currency', async () => {
      const converted = await service.convertAmount(100, 'USD', 'USD');

      expect(converted).toBe(100);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should convert amount of 0', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const converted = await service.convertAmount(0, 'USD', 'BRL');

      expect(converted).toBe(0);
    });

    it('should convert large amounts', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const converted = await service.convertAmount(1000000, 'USD', 'BRL');

      expect(converted).toBe(5000000); // 1M * 5.0
    });

    it('should convert negative amounts', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const converted = await service.convertAmount(-100, 'USD', 'BRL');

      expect(converted).toBe(-500);
    });

    it('should use fallback rate when API fails', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const converted = await service.convertAmount(100, 'USD', 'BRL');

      expect(converted).toBe(500); // 100 * 5.0 (fallback)
    });
  });

  // ==================== GETMULTIPLERATES METHOD ====================

  describe('getMultipleRates', () => {
    it('should get rates for multiple currencies', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const rates = await service.getMultipleRates('USD', ['BRL', 'EUR', 'GBP']);

      expect(rates).toEqual({
        BRL: 5.0,
        EUR: 0.85,
        GBP: 0.73,
      });
    });

    it('should fetch only once for multiple rates from same base', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      await service.getMultipleRates('USD', ['BRL', 'EUR', 'GBP', 'JPY']);

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty object for empty array', async () => {
      const rates = await service.getMultipleRates('USD', []);

      expect(rates).toEqual({});
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should get rate for single currency', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const rates = await service.getMultipleRates('USD', ['BRL']);

      expect(rates).toEqual({ BRL: 5.0 });
    });

    it('should handle mixed valid and invalid currencies', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const rates = await service.getMultipleRates('USD', ['BRL', 'XYZ']);

      expect(rates.BRL).toBe(5.0);
      expect(rates.XYZ).toBe(1); // Not found in response
    });

    it('should use fallback rates when API fails', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const rates = await service.getMultipleRates('USD', ['BRL', 'EUR']);

      expect(rates.BRL).toBe(5.0);
      expect(rates.EUR).toBeCloseTo(5.0 / 5.5, 4); // USD->EUR via BRL
    });

    it('should get rates for large number of currencies', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const currencies = ['BRL', 'EUR', 'GBP', 'JPY', 'USD'];
      const rates = await service.getMultipleRates('USD', currencies);

      expect(Object.keys(rates)).toHaveLength(5);
    });
  });

  // ==================== CLEARCACHE METHOD ====================

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      // Populate cache
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      await service.getExchangeRate('USD', 'BRL');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Fetch again - should call API again
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      await service.getExchangeRate('USD', 'BRL');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should clear cache for all currencies', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockExchangeRateResponse,
            base_code: 'EUR',
          }),
        });

      await service.getExchangeRate('USD', 'BRL');
      await service.getExchangeRate('EUR', 'BRL');

      service.clearCache();

      const cacheInfo = service.getCacheInfo();
      expect(cacheInfo).toHaveLength(0);
    });

    it('should allow fetching after clear', async () => {
      service.clearCache();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const rate = await service.getExchangeRate('USD', 'BRL');

      expect(rate).toBe(5.0);
    });
  });

  // ==================== GETCACHEINFO METHOD ====================

  describe('getCacheInfo', () => {
    it('should return empty array when cache is empty', () => {
      const info = service.getCacheInfo();

      expect(info).toEqual([]);
      expect(info).toHaveLength(0);
    });

    it('should return cache info for single currency', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      await service.getExchangeRate('USD', 'BRL');

      const info = service.getCacheInfo();

      expect(info).toHaveLength(1);
      expect(info[0].currency).toBe('USD');
      expect(info[0].lastUpdate).toBeInstanceOf(Date);
      expect(info[0].expiresAt).toBeInstanceOf(Date);
    });

    it('should return cache info for multiple currencies', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockExchangeRateResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockExchangeRateResponse,
            base_code: 'EUR',
          }),
        });

      await service.getExchangeRate('USD', 'BRL');
      await service.getExchangeRate('EUR', 'BRL');

      const info = service.getCacheInfo();

      expect(info).toHaveLength(2);
      expect(info.map((i) => i.currency)).toContain('USD');
      expect(info.map((i) => i.currency)).toContain('EUR');
    });

    it('should show expiration time in the future', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      await service.getExchangeRate('USD', 'BRL');

      const info = service.getCacheInfo();
      const now = new Date();

      expect(info[0].expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should be empty after clearCache', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      await service.getExchangeRate('USD', 'BRL');
      service.clearCache();

      const info = service.getCacheInfo();

      expect(info).toHaveLength(0);
    });
  });

  // ==================== EDGE CASES ====================

  describe('edge cases', () => {
    it('should handle malformed API response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Missing fields
      });

      const rate = await service.getExchangeRate('USD', 'BRL');

      expect(rate).toBe(5.0); // Fallback
    });

    it('should handle API response with null conversion_rates', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: 'success',
          conversion_rates: null,
        }),
      });

      const rate = await service.getExchangeRate('USD', 'BRL');

      expect(rate).toBe(5.0); // Fallback
    });

    it('should handle concurrent requests to same currency pair', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const [rate1, rate2, rate3] = await Promise.all([
        service.getExchangeRate('USD', 'BRL'),
        service.getExchangeRate('USD', 'BRL'),
        service.getExchangeRate('USD', 'BRL'),
      ]);

      expect(rate1).toBe(5.0);
      expect(rate2).toBe(5.0);
      expect(rate3).toBe(5.0);
      // Note: May call API multiple times due to race condition, that's ok
    });

    it('should handle very small amounts in conversion', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const converted = await service.convertAmount(0.01, 'USD', 'BRL');

      expect(converted).toBeCloseTo(0.05, 4);
    });

    it('should handle case sensitivity in currency codes', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeRateResponse,
      });

      const rate = await service.getExchangeRate('usd', 'brl');

      // API will be called with lowercase 'usd'
      expect(fetch).toHaveBeenCalledWith(
        'https://api.exchangerate-api.com/v4/latest/usd'
      );
    });
  });
});
