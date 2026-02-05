export interface PlaidAccount {
  id: string;
  itemId: string;
  accessToken: string;
  accountId: string;
  name: string;
  officialName?: string;
  type: string;
  subtype?: string;
  mask?: string;
  institutionName?: string;
  addedAt: number;
}

export interface PlaidBalance {
  accountId: string;
  available: number | null;
  current: number | null;
  limit: number | null;
  isoCurrencyCode: string | null;
}

export interface PlaidTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  merchantName?: string;
  category?: string[];
  pending: boolean;
}
