import { createHmac } from "crypto";

type CoinbaseHeaders = Record<string, string>;

function createSignature(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string,
  apiSecret: string
): string {
  const message = timestamp + method.toUpperCase() + requestPath + body;
  const hmac = createHmac("sha256", apiSecret);
  hmac.update(message);
  return hmac.digest("hex");
}

function createCoinbaseHeaders(
  method: string,
  path: string,
  body: string,
  apiKey: string,
  apiSecret: string
): CoinbaseHeaders {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createSignature(timestamp, method, path, body, apiSecret);

  return {
    "CB-ACCESS-KEY": apiKey,
    "CB-ACCESS-SIGN": signature,
    "CB-ACCESS-TIMESTAMP": timestamp,
    "Content-Type": "application/json",
  };
}

export interface CoinbaseAsset {
  symbol: string;
  name: string;
  balance: number;
  uuid: string;
}

const BASE_URL = "https://api.coinbase.com";

async function coinbaseRequest(
  method: string,
  path: string,
  apiKey: string,
  apiSecret: string,
  body: string = ""
): Promise<any> {
  const headers = createCoinbaseHeaders(method, path, body, apiKey, apiSecret);

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body ? { body } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Coinbase API error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

export async function validateCoinbaseKeys(
  apiKey: string,
  apiSecret: string
): Promise<boolean> {
  try {
    await coinbaseRequest("GET", "/api/v3/brokerage/accounts", apiKey, apiSecret);
    return true;
  } catch (error: any) {
    console.error("[Coinbase] Key validation failed:", error.message);
    return false;
  }
}

export async function getCoinbaseAccounts(
  apiKey: string,
  apiSecret: string
): Promise<CoinbaseAsset[]> {
  const data = await coinbaseRequest(
    "GET",
    "/api/v3/brokerage/accounts",
    apiKey,
    apiSecret
  );

  const accounts = data.accounts || [];

  return accounts
    .filter((account: any) => {
      const balance = parseFloat(account.available_balance?.value || "0");
      return balance > 0;
    })
    .map((account: any) => ({
      symbol: account.currency || account.available_balance?.currency || "UNKNOWN",
      name: account.name || account.currency || "Unknown Asset",
      balance: parseFloat(account.available_balance?.value || "0"),
      uuid: account.uuid || "",
    }));
}
