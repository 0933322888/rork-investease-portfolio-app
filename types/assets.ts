export type AssetType = 'stocks' | 'crypto' | 'commodities' | 'fixed-income' | 'real-estate' | 'cash';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  symbol?: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currency: string;
  addedAt?: number;
  purchaseDate?: string;
  monthlyRent?: number;
  monthlyIncome?: number;
  dueDate?: string;
  estimatedValue?: number;
  plaidAccountId?: string;
  plaidItemId?: string;
  isPlaidConnected?: boolean;
  snaptradeAccountId?: string;
}

export interface AssetTypeInfo {
  id: AssetType;
  label: string;
  icon: string;
  description: string;
}

export const ASSET_TYPES: AssetTypeInfo[] = [
  {
    id: 'stocks',
    label: 'Stocks / ETFs',
    icon: 'TrendingUp',
    description: 'Equities and exchange-traded funds',
  },
  {
    id: 'crypto',
    label: 'Crypto',
    icon: 'Bitcoin',
    description: 'Digital currencies and tokens',
  },
  {
    id: 'commodities',
    label: 'Commodities',
    icon: 'Gem',
    description: 'Gold, silver, and other commodities',
  },
  {
    id: 'fixed-income',
    label: 'Fixed Income',
    icon: 'Receipt',
    description: 'Bonds and fixed-return securities',
  },
  {
    id: 'real-estate',
    label: 'Real Estate',
    icon: 'Home',
    description: 'Property investments',
  },
  {
    id: 'cash',
    label: 'Cash',
    icon: 'Wallet',
    description: 'Cash and cash equivalents',
  },
];
