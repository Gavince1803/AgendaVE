import { LogCategory, logger } from './logger';

export interface ExchangeRate {
    usd: number;
    eur: number;
    date: string;
}

export class CurrencyService {
    private static CACHE_DURATION = 1000 * 60 * 60; // 1 hour
    private static cachedRate: ExchangeRate | null = null;
    private static lastFetchTime = 0;

    static async getExchangeRate(): Promise<ExchangeRate | null> {
        try {
            const now = Date.now();
            if (this.cachedRate && (now - this.lastFetchTime < this.CACHE_DURATION)) {
                return this.cachedRate;
            }

            const response = await fetch('https://api.dolarvzla.com/public/exchange-rate');
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();

            // The API returns { current: { usd: number, eur: number, date: string }, ... }
            if (data && data.current) {
                this.cachedRate = {
                    usd: data.current.usd,
                    eur: data.current.eur,
                    date: data.current.date
                };
                this.lastFetchTime = now;
                return this.cachedRate;
            }

            return null;
        } catch (error) {
            logger.error(LogCategory.SERVICE, 'Error fetching exchange rate', error);
            return this.cachedRate; // Return cached rate if available, even if expired
        }
    }
}
