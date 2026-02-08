const FMP_BASE_URL = "https://financialmodelingprep.com/stable";
const API_KEY = process.env.FMP_API_KEY || "";
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (attempt === retries) {
        console.error(`[FMP] Failed after ${retries + 1} attempts:`, error.message);
        throw error;
      }
      console.warn(`[FMP] Attempt ${attempt + 1} failed, retrying...`);
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

export const fmpClient = {
  async get<T = any>(endpoint: string): Promise<T> {
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${FMP_BASE_URL}/${endpoint}${separator}apikey=${API_KEY}`;
    return fetchWithRetry(url);
  },
};
