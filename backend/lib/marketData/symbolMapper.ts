const CRYPTO_SUFFIX = "USD";

const COMMODITY_MAP: Record<string, string> = {
  gold: "XAUUSD",
  silver: "XAGUSD",
  Gold: "XAUUSD",
  Silver: "XAGUSD",
  GOLD: "XAUUSD",
  SILVER: "XAGUSD",
  XAU: "XAUUSD",
  XAG: "XAGUSD",
};

const KNOWN_CRYPTO = new Set([
  "BTC", "ETH", "SOL", "DOGE", "ADA", "XRP", "DOT", "AVAX", "MATIC",
  "LINK", "UNI", "ATOM", "LTC", "BCH", "ALGO", "FIL", "NEAR", "APT",
  "ARB", "OP", "SUI", "SEI", "TIA", "JUP", "RENDER", "FET", "INJ",
  "SHIB", "PEPE", "WIF", "BONK",
]);

export function mapCryptoSymbol(symbol: string): string {
  const upper = symbol.toUpperCase().replace(/USD$/, "");
  return `${upper}${CRYPTO_SUFFIX}`;
}

export function mapCommoditySymbol(name: string): string | null {
  return COMMODITY_MAP[name] || null;
}

export function isCryptoSymbol(symbol: string): boolean {
  const upper = symbol.toUpperCase().replace(/USD$/, "");
  return KNOWN_CRYPTO.has(upper);
}

export function normalizeSymbol(symbol: string, assetType?: string): string {
  if (assetType === "crypto" || isCryptoSymbol(symbol)) {
    return mapCryptoSymbol(symbol);
  }

  const commoditySymbol = mapCommoditySymbol(symbol);
  if (commoditySymbol) {
    return commoditySymbol;
  }

  return symbol.toUpperCase();
}
