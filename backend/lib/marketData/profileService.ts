import { fmpClient } from "./fmpClient";
import { profileCache, type CompanyProfile } from "./priceCache";

interface FMPProfile {
  symbol: string;
  companyName: string;
  sector: string;
  country: string;
  industry: string;
  marketCap: number;
}

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const cached = profileCache.get(symbol);
  if (cached) return cached;

  try {
    const data: FMPProfile[] = await fmpClient.get(`profile?symbol=${symbol}`);

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const item = data[0];
    const profile: CompanyProfile = {
      symbol: item.symbol,
      companyName: item.companyName || "",
      sector: item.sector || "",
      country: item.country || "",
      industry: item.industry || "",
      marketCap: item.marketCap || 0,
    };

    profileCache.set(symbol, profile);
    return profile;
  } catch (error: any) {
    console.error(`[MarketData] Failed to fetch profile for ${symbol}:`, error.message);
    return null;
  }
}

export async function getCompanyProfiles(symbols: string[]): Promise<CompanyProfile[]> {
  const results: CompanyProfile[] = [];

  const uncached: string[] = [];
  for (const symbol of symbols) {
    const cached = profileCache.get(symbol);
    if (cached) {
      results.push(cached);
    } else {
      uncached.push(symbol);
    }
  }

  const profilePromises = uncached.map((s) => getCompanyProfile(s));
  const fetched = await Promise.allSettled(profilePromises);

  for (const result of fetched) {
    if (result.status === "fulfilled" && result.value) {
      results.push(result.value);
    }
  }

  return results;
}
