import { LogCategory, logger } from './logger';

export interface ExchangeRate {
    usd: number;
    eur: number;
    parallel: number;
    date: string;
}

export class CurrencyService {
    private static CACHE_DURATION = 1000 * 60 * 60; // 1 hour
    private static cachedRate: ExchangeRate | null = null;
    private static lastFetchTime = 0;

    static async getExchangeRate(): Promise<ExchangeRate | null> {
        const now = Date.now();
        if (this.cachedRate && (now - this.lastFetchTime < this.CACHE_DURATION)) {
            return this.cachedRate;
        }

        let usd = 0;
        let parallel = 0;
        let eur = 0;

        try {
            // 1. Fetch Dollar (BCV)
            try {
                const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
                if (res.ok) {
                    const data = await res.json();
                    usd = data.promedio || 0;
                }
            } catch (e) { logger.error(LogCategory.SERVICE, 'Error fetching BCV USD', e); }

            // 2. Fetch Parallel
            try {
                const res = await fetch('https://ve.dolarapi.com/v1/dolares/paralelo');
                if (res.ok) {
                    const data = await res.json();
                    parallel = data.promedio || 0;
                }
            } catch (e) { logger.error(LogCategory.SERVICE, 'Error fetching Parallel', e); }

            // 3. Fetch Euro
            try {
                const res = await fetch('https://ve.dolarapi.com/v1/euros/oficial');
                if (res.ok) {
                    const data = await res.json();
                    eur = data.promedio || 0;
                }
            } catch (e) { logger.error(LogCategory.SERVICE, 'Error fetching Euro', e); }

            // Fallback Logic
            if (usd > 0) {
                // Determine Parallel fallback if API failed or returned 0
                if (parallel === 0) {
                    parallel = usd * 1.15; // Conservative 15% spread
                }

                // Determine Euro fallback if API failed
                if (eur === 0) {
                    try {
                        const crossRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                        if (crossRes.ok) {
                            const crossData = await crossRes.json();
                            // If 1 USD = 0.96 EUR, then 1 EUR = 1/0.96 USD = ~1.041 USD
                            // Bs/EUR = (Bs/USD) * (USD/EUR)
                            if (crossData.rates && crossData.rates.EUR) {
                                const usdPerEur = 1 / crossData.rates.EUR;
                                eur = usd * usdPerEur;
                            }
                        }
                    } catch (e) { logger.error(LogCategory.SERVICE, 'Error fetching cross rates', e); }
                }

                // Hard fallback for Euro if everything failed
                if (eur === 0) {
                    eur = usd * 1.09; // Approx global rate
                }

                this.cachedRate = {
                    usd: parseFloat(usd.toFixed(2)),
                    eur: parseFloat(eur.toFixed(2)),
                    parallel: parseFloat(parallel.toFixed(2)),
                    date: new Date().toISOString()
                };
                this.lastFetchTime = now;
                return this.cachedRate;
            }

            // Ultimate fallback if BCV fetch failed completely
            return this.cachedRate || {
                usd: 363.66,
                eur: 434.42,
                parallel: 522.12,
                date: new Date().toISOString()
            };

        } catch (error) {
            logger.error(LogCategory.SERVICE, 'Critical error in exchange rate service', error);
            return this.cachedRate;
        }
    }
}
