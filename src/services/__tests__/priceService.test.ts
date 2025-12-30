/**
 * Price Service Tests
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { fetchPrices, getDefaultPrices } from '../priceService';
import { Prices } from '../../types';

// Mock axios
const mockAxios = new MockAdapter(axios);

describe('priceService', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  describe('fetchPrices', () => {
    it('should fetch prices successfully from API', async () => {
      const mockResponse = {
        USD: { Buying: '34.50' },
        EUR: { Buying: '36.20' },
        GUMUS: { Buying: '30.00' },
        TAMALTIN: { Buying: '16000' },
        CEYREKALTIN: { Buying: '4000' },
        YIA: { Buying: '2300' },
        GRA: { Buying: '2500' },
      };

      mockAxios.onGet('https://finans.truncgil.com/v4/today.json').reply(200, mockResponse);

      const prices = await fetchPrices();

      expect(prices).toBeDefined();
      expect(prices.usd).toBe(34.5);
      expect(prices.eur).toBe(36.2);
      expect(prices.gumus).toBe(30);
      expect(prices.tam).toBe(16000);
      expect(prices.ceyrek).toBe(4000);
      expect(prices['22_ayar']).toBe(2300);
      expect(prices['24_ayar']).toBe(2500);
      expect(prices.tl).toBe(1);
    });

    it('should use currentPrices as fallback on API error', async () => {
      const currentPrices: Prices = {
        '22_ayar': 2300,
        '24_ayar': 2500,
        ceyrek: 4000,
        tam: 16000,
        usd: 34,
        eur: 36,
        tl: 1,
        gumus: 30,
      };

      mockAxios.onGet('https://finans.truncgil.com/v4/today.json').reply(500);

      const prices = await fetchPrices(currentPrices);

      expect(prices).toEqual(currentPrices);
    });

    it('should use default prices when API fails and no currentPrices', async () => {
      mockAxios.onGet('https://finans.truncgil.com/v4/today.json').reply(500);

      const prices = await fetchPrices();

      expect(prices).toEqual(getDefaultPrices());
    });

    it('should handle invalid API response structure', async () => {
      mockAxios.onGet('https://finans.truncgil.com/v4/today.json').reply(200, {});

      const prices = await fetchPrices();

      // Should fallback to default or current prices
      expect(prices).toBeDefined();
    });

    it('should handle network timeout', async () => {
      mockAxios.onGet('https://finans.truncgil.com/v4/today.json').timeout();

      const prices = await fetchPrices();

      // Should fallback
      expect(prices).toBeDefined();
    });

    it('should parse string prices correctly', async () => {
      const mockResponse = {
        USD: { Buying: '34.50' },
        EUR: { Buying: '36.20' },
        GUMUS: { Buying: '30' },
        TAMALTIN: { Buying: '16000' },
        CEYREKALTIN: { Buying: '4000' },
        YIA: { Buying: '2300' },
        GRA: { Buying: '2500' },
      };

      mockAxios.onGet('https://finans.truncgil.com/v4/today.json').reply(200, mockResponse);

      const prices = await fetchPrices();

      expect(typeof prices.usd).toBe('number');
      expect(typeof prices.eur).toBe('number');
      expect(prices.usd).toBe(34.5);
    });
  });

  describe('getDefaultPrices', () => {
    it('should return default prices', () => {
      const defaultPrices = getDefaultPrices();
      expect(defaultPrices).toBeDefined();
      expect(defaultPrices.usd).toBe(34);
      expect(defaultPrices.eur).toBe(36);
      expect(defaultPrices.tl).toBe(1);
    });
  });
});

