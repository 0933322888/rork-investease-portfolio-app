export interface SnapTradeUser {
  userId: string;
  userSecret: string;
  createdAt: number;
}

export interface SnapTradeAccount {
  id: string;
  brokerageAuthorization: string;
  name: string;
  number?: string;
  institutionName?: string;
  createdDate?: string;
  syncStatus?: string;
  addedAt: number;
}

export interface SnapTradeHolding {
  symbol: string;
  symbolId?: string;
  price: number;
  units: number;
  averagePrice?: number;
  currency?: string;
  type?: string;
}

export interface SnapTradeBalance {
  currency: string;
  cash: number;
  buying_power?: number;
}
