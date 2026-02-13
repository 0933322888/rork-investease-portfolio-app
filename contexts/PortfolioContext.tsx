import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Asset, AssetType } from '@/types/assets';
import { PlaidAccount } from '@/types/plaid';
import { trpc } from '@/lib/trpc';

const STORAGE_KEY = 'portfolio_assets';
const ONBOARDING_KEY = 'has_completed_onboarding';
const PLAID_ACCOUNTS_KEY = 'plaid_accounts';
const COINBASE_CREDENTIALS_KEY = 'coinbase_credentials';

const MARKET_PRICE_TYPES: AssetType[] = ['stocks', 'crypto'];

export interface MarketQuoteData {
  price: number;
  changePercent: number;
  dayChange: number;
}

export interface SparklineData {
  prices: number[];
}

export const [PortfolioProvider, usePortfolio] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [plaidAccounts, setPlaidAccounts] = useState<PlaidAccount[]>([]);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [lastPriceRefresh, setLastPriceRefresh] = useState<number | null>(null);
  const [marketQuotes, setMarketQuotes] = useState<Record<string, MarketQuoteData>>({});
  const [sparklineData, setSparklineData] = useState<Record<string, SparklineData>>({});
  const hasLoadedSparklinesRef = useRef(false);

  const assetsQuery = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      const mockAssets: Asset[] = [
        {
          id: 'mock-1',
          type: 'stocks',
          name: 'Apple Inc.',
          symbol: 'AAPL',
          quantity: 10,
          purchasePrice: 150.00,
          currentPrice: 175.50,
          currency: 'USD',
          addedAt: Date.now() - 86400000 * 30,
        },
        {
          id: 'mock-2',
          type: 'stocks',
          name: 'Microsoft Corporation',
          symbol: 'MSFT',
          quantity: 5,
          purchasePrice: 320.00,
          currentPrice: 385.25,
          currency: 'USD',
          addedAt: Date.now() - 86400000 * 60,
        },
        {
          id: 'mock-3',
          type: 'stocks',
          name: 'SPDR S&P 500 ETF',
          symbol: 'SPY',
          quantity: 20,
          purchasePrice: 420.00,
          currentPrice: 465.80,
          currency: 'USD',
          addedAt: Date.now() - 86400000 * 90,
        },
        {
          id: 'mock-4',
          type: 'crypto',
          name: 'Bitcoin',
          symbol: 'BTC',
          quantity: 0.5,
          purchasePrice: 45000.00,
          currentPrice: 52000.00,
          currency: 'USD',
          addedAt: Date.now() - 86400000 * 120,
        },
        {
          id: 'mock-5',
          type: 'crypto',
          name: 'Ethereum',
          symbol: 'ETH',
          quantity: 3,
          purchasePrice: 2200.00,
          currentPrice: 2800.00,
          currency: 'USD',
          addedAt: Date.now() - 86400000 * 100,
        },
        {
          id: 'mock-6',
          type: 'real-estate',
          name: 'Downtown Apartment',
          quantity: 1,
          purchasePrice: 350000.00,
          currentPrice: 385000.00,
          currency: 'USD',
          isRented: true,
          monthlyRent: 2800,
          addedAt: Date.now() - 86400000 * 365,
        },
        {
          id: 'mock-7',
          type: 'real-estate',
          name: 'Suburban Family Home',
          quantity: 1,
          purchasePrice: 520000.00,
          currentPrice: 565000.00,
          currency: 'USD',
          isRented: false,
          addedAt: Date.now() - 86400000 * 730,
        },
        {
          id: 'mock-8',
          type: 'cash',
          name: 'Chase Checking',
          quantity: 15000,
          purchasePrice: 1.00,
          currentPrice: 1.00,
          currency: 'USD',
          addedAt: Date.now() - 86400000 * 10,
        },
        {
          id: 'mock-9',
          type: 'cash',
          name: 'Savings Account',
          quantity: 45000,
          purchasePrice: 1.00,
          currentPrice: 1.00,
          currency: 'USD',
          addedAt: Date.now() - 86400000 * 5,
          interestRate: 4.50,
        },
        {
          id: 'mock-10',
          type: 'commodities',
          name: 'Gold Coins',
          quantity: 5,
          purchasePrice: 1850.00,
          currentPrice: 2050.00,
          currency: 'USD',
          estimatedValue: 10250,
          addedAt: Date.now() - 86400000 * 180,
        },
        {
          id: 'mock-11',
          type: 'commodities',
          name: 'Silver Bars',
          quantity: 50,
          purchasePrice: 22.00,
          currentPrice: 25.50,
          currency: 'USD',
          estimatedValue: 1275,
          addedAt: Date.now() - 86400000 * 150,
        },
        {
          id: 'mock-12',
          type: 'fixed-income',
          name: 'US Treasury Bond',
          quantity: 10000,
          purchasePrice: 1.00,
          currentPrice: 1.02,
          currency: 'USD',
          monthlyIncome: 250,
          dueDate: '2030-12-31',
          addedAt: Date.now() - 86400000 * 200,
        },
        {
          id: 'mock-13',
          type: 'fixed-income',
          name: 'Corporate Bond - Apple',
          quantity: 5000,
          purchasePrice: 1.00,
          currentPrice: 1.05,
          currency: 'USD',
          monthlyIncome: 150,
          dueDate: '2028-06-15',
          addedAt: Date.now() - 86400000 * 250,
        },
      ];
      
      return mockAssets;
    },
  });

  const onboardingQuery = useQuery({
    queryKey: ['onboarding'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
      return stored === 'true';
    },
  });

  const plaidAccountsQuery = useQuery({
    queryKey: ['plaidAccounts'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PLAID_ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const saveAssetsMutation = useMutation({
    mutationFn: async (newAssets: Asset[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAssets));
      return newAssets;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  useEffect(() => {
    if (assetsQuery.data) {
      setAssets(assetsQuery.data);
    }
  }, [assetsQuery.data]);

  useEffect(() => {
    if (plaidAccountsQuery.data) {
      setPlaidAccounts(plaidAccountsQuery.data);
    }
  }, [plaidAccountsQuery.data]);

  const addAsset = (asset: Omit<Asset, 'id' | 'addedAt'>) => {
    const newAsset: Asset = {
      ...asset,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      addedAt: Date.now(),
    };
    const updated = [...assets, newAsset];
    setAssets(updated);
    saveAssetsMutation.mutate(updated);
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    const updated = assets.map((a) => (a.id === id ? { ...a, ...updates } : a));
    setAssets(updated);
    saveAssetsMutation.mutate(updated);
  };

  const deleteAsset = (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    saveAssetsMutation.mutate(updated);
  };

  const completeOnboarding = () => {
    completeOnboardingMutation.mutate();
  };

  const savePlaidAccountsMutation = useMutation({
    mutationFn: async (accounts: PlaidAccount[]) => {
      await AsyncStorage.setItem(PLAID_ACCOUNTS_KEY, JSON.stringify(accounts));
      return accounts;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plaidAccounts'] });
    },
  });

  const syncPlaidAccount = async (accessToken: string, itemId: string) => {
    console.log('[Portfolio] Syncing Plaid account, itemId:', itemId);
    
    try {
      const accountsResponse = await fetch(
        `/api/trpc/plaid.getAccounts?input=${encodeURIComponent(
          JSON.stringify({ json: { accessToken } })
        )}`
      );
      const accountsData = await accountsResponse.json();
      const accounts = accountsData.result.data.json.accounts;
      
      console.log('[Portfolio] Fetched accounts:', accounts.length);

      const balancesResponse = await fetch(
        `/api/trpc/plaid.getBalances?input=${encodeURIComponent(
          JSON.stringify({ json: { accessToken } })
        )}`
      );
      const balancesData = await balancesResponse.json();
      const balances = balancesData.result.data.json.accounts;

      console.log('[Portfolio] Fetched balances:', balances.length);

      const newPlaidAccounts: PlaidAccount[] = accounts.map((account: any) => ({
        id: `plaid_${account.account_id}`,
        itemId,
        accessToken,
        accountId: account.account_id,
        name: account.name,
        officialName: account.official_name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        addedAt: Date.now(),
      }));

      const updatedPlaidAccounts = [...plaidAccounts, ...newPlaidAccounts];
      setPlaidAccounts(updatedPlaidAccounts);
      savePlaidAccountsMutation.mutate(updatedPlaidAccounts);

      const newAssets: Asset[] = balances.map((account: any) => {
        const balance = account.balances.current || 0;
        const currency = account.balances.iso_currency_code || 'USD';
        
        let assetType: AssetType = 'cash';
        if (account.type === 'investment') {
          assetType = 'stocks';
        } else if (account.type === 'credit') {
          assetType = 'cash';
        }

        return {
          id: `plaid_asset_${account.account_id}`,
          type: assetType,
          name: account.name,
          quantity: balance,
          purchasePrice: 1,
          currentPrice: 1,
          currency,
          addedAt: Date.now(),
          plaidAccountId: account.account_id,
          plaidItemId: itemId,
          isPlaidConnected: true,
        };
      });

      const updatedAssets = [...assets, ...newAssets];
      setAssets(updatedAssets);
      saveAssetsMutation.mutate(updatedAssets);

      console.log('[Portfolio] Synced', newAssets.length, 'assets from Plaid');
    } catch (error) {
      console.error('[Portfolio] Error syncing Plaid account:', error);
      throw error;
    }
  };

  const refreshPlaidBalances = async () => {
    console.log('[Portfolio] Refreshing Plaid balances');
    
    for (const plaidAccount of plaidAccounts) {
      try {
        const balancesResponse = await fetch(
          `/api/trpc/plaid.getBalances?input=${encodeURIComponent(
            JSON.stringify({ json: { accessToken: plaidAccount.accessToken } })
          )}`
        );
        const balancesData = await balancesResponse.json();
        const balances = balancesData.result.data.json.accounts;

        const updatedAssets = assets.map((asset) => {
          if (asset.plaidAccountId) {
            const accountBalance = balances.find(
              (b: any) => b.account_id === asset.plaidAccountId
            );
            if (accountBalance) {
              return {
                ...asset,
                quantity: accountBalance.balances.current || asset.quantity,
              };
            }
          }
          return asset;
        });

        setAssets(updatedAssets);
        saveAssetsMutation.mutate(updatedAssets);
      } catch (error) {
        console.error('[Portfolio] Error refreshing balances for account:', plaidAccount.id, error);
      }
    }
    
    console.log('[Portfolio] Balances refreshed');
  };

  const syncSnapTradeAccount = async (userId: string, userSecret: string) => {
    console.log('[Portfolio] Syncing SnapTrade account for user:', userId);
    
    try {
      const accountsResponse = await fetch(
        `/api/trpc/snaptrade.listAccounts?input=${encodeURIComponent(
          JSON.stringify({ json: { userId, userSecret } })
        )}`
      );
      const accountsData = await accountsResponse.json();
      
      if (!accountsData.result?.data?.json?.accounts) {
        throw new Error('No accounts found. Please connect a brokerage first.');
      }
      
      const accounts = accountsData.result.data.json.accounts;
      console.log('[Portfolio] SnapTrade accounts:', accounts.length);

      const holdingsResponse = await fetch(
        `/api/trpc/snaptrade.getHoldings?input=${encodeURIComponent(
          JSON.stringify({ json: { userId, userSecret } })
        )}`
      );
      const holdingsData = await holdingsResponse.json();
      const holdings = holdingsData.result?.data?.json?.holdings || [];
      
      console.log('[Portfolio] SnapTrade holdings fetched');

      const newAssets: Asset[] = [];
      
      for (const account of accounts) {
        const accountHoldings = holdings.filter(
          (h: any) => h.account?.id === account.id
        );
        
        for (const holding of accountHoldings) {
          if (holding.symbol && holding.units > 0) {
            const price = holding.price || holding.average_purchase_price || 0;
            const assetType: AssetType = holding.symbol.type === 'crypto' ? 'crypto' : 'stocks';
            
            newAssets.push({
              id: `snaptrade_${account.id}_${holding.symbol.id || holding.symbol.symbol}`,
              type: assetType,
              name: holding.symbol.description || holding.symbol.symbol,
              symbol: holding.symbol.symbol,
              quantity: holding.units,
              purchasePrice: holding.average_purchase_price || price,
              currentPrice: price,
              purchaseDate: new Date().toISOString(),
              currency: holding.symbol.currency?.code || 'USD',
              snaptradeAccountId: account.id,
            });
          }
        }

        if (accountHoldings.length === 0) {
          const balancesResponse = await fetch(
            `/api/trpc/snaptrade.getAccountBalances?input=${encodeURIComponent(
              JSON.stringify({ json: { userId, userSecret, accountId: account.id } })
            )}`
          );
          const balancesData = await balancesResponse.json();
          const balances = balancesData.result?.data?.json?.balances || [];
          
          for (const balance of balances) {
            if (balance.cash && balance.cash > 0) {
              newAssets.push({
                id: `snaptrade_cash_${account.id}_${balance.currency?.code || 'USD'}`,
                type: 'cash',
                name: `${account.name || 'Brokerage'} Cash`,
                symbol: balance.currency?.code || 'USD',
                quantity: balance.cash,
                purchasePrice: 1,
                currentPrice: 1,
                purchaseDate: new Date().toISOString(),
                currency: balance.currency?.code || 'USD',
                snaptradeAccountId: account.id,
              });
            }
          }
        }
      }

      if (newAssets.length > 0) {
        const existingNonSnapTrade = assets.filter(a => !a.snaptradeAccountId);
        const updatedAssets = [...existingNonSnapTrade, ...newAssets];
        setAssets(updatedAssets);
        saveAssetsMutation.mutate(updatedAssets);
        console.log('[Portfolio] SnapTrade assets added:', newAssets.length);
      } else {
        console.log('[Portfolio] No holdings found in SnapTrade accounts');
      }
    } catch (error) {
      console.error('[Portfolio] Error syncing SnapTrade account:', error);
      throw error;
    }
  };

  const totalValue = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.quantity * asset.currentPrice, 0);
  }, [assets]);

  const totalCost = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.quantity * asset.purchasePrice, 0);
  }, [assets]);

  const totalGain = useMemo(() => {
    return totalValue - totalCost;
  }, [totalValue, totalCost]);

  const totalGainPercent = useMemo(() => {
    return totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  }, [totalGain, totalCost]);

  const assetsByType = useMemo(() => {
    const grouped: Record<AssetType, Asset[]> = {
      stocks: [],
      crypto: [],
      commodities: [],
      'fixed-income': [],
      'real-estate': [],
      cash: [],
    };
    assets.forEach((asset) => {
      grouped[asset.type].push(asset);
    });
    return grouped;
  }, [assets]);

  const assetAllocation = useMemo(() => {
    const allocation: Record<AssetType, number> = {
      stocks: 0,
      crypto: 0,
      commodities: 0,
      'fixed-income': 0,
      'real-estate': 0,
      cash: 0,
    };
    assets.forEach((asset) => {
      allocation[asset.type] += asset.quantity * asset.currentPrice;
    });
    return allocation;
  }, [assets]);

  const removePlaidAccount = async (accountId: string) => {
    const updatedPlaidAccounts = plaidAccounts.filter((a) => a.id !== accountId);
    setPlaidAccounts(updatedPlaidAccounts);
    savePlaidAccountsMutation.mutate(updatedPlaidAccounts);

    const updatedAssets = assets.filter((a) => !a.plaidAccountId || `plaid_${a.plaidAccountId}` !== accountId);
    setAssets(updatedAssets);
    saveAssetsMutation.mutate(updatedAssets);
  };

  const syncCoinbaseAccount = async (apiKey: string, apiSecret: string): Promise<{ success: boolean; error?: string; assetsCount?: number }> => {
    console.log('[Portfolio] Connecting Coinbase account...');

    try {
      const response = await fetch('/api/trpc/coinbase.connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { apiKey, apiSecret } }),
      });

      const data = await response.json();
      const result = data.result?.data?.json;

      if (!result?.success) {
        return { success: false, error: result?.error || 'Connection failed' };
      }

      const coinbaseAccounts = result.accounts || [];
      console.log('[Portfolio] Coinbase accounts fetched:', coinbaseAccounts.length);

      await AsyncStorage.setItem(COINBASE_CREDENTIALS_KEY, JSON.stringify({ apiKey, apiSecret }));

      const newAssets: Asset[] = coinbaseAccounts.map((account: any) => {
        const existingAsset = assets.find(
          a => a.isCoinbaseConnected && a.coinbaseAccountId === account.uuid
        );
        return {
          id: existingAsset?.id || `coinbase_${account.uuid || account.symbol}_${Date.now()}`,
          type: 'crypto' as AssetType,
          name: account.name || account.symbol,
          symbol: account.symbol,
          quantity: account.balance,
          purchasePrice: existingAsset?.purchasePrice || 0,
          currentPrice: existingAsset?.currentPrice || 0,
          currency: 'USD',
          addedAt: existingAsset?.addedAt || Date.now(),
          coinbaseAccountId: account.uuid,
          isCoinbaseConnected: true,
        };
      });

      const existingNonCoinbase = assets.filter(a => !a.isCoinbaseConnected);
      const updatedAssets = [...existingNonCoinbase, ...newAssets];
      setAssets(updatedAssets);
      saveAssetsMutation.mutate(updatedAssets);

      console.log('[Portfolio] Coinbase assets added:', newAssets.length);
      return { success: true, assetsCount: newAssets.length };
    } catch (error: any) {
      console.error('[Portfolio] Error connecting Coinbase:', error);
      return { success: false, error: error.message || 'Failed to connect' };
    }
  };

  const refreshCoinbaseBalances = async () => {
    console.log('[Portfolio] Refreshing Coinbase balances...');
    try {
      const stored = await AsyncStorage.getItem(COINBASE_CREDENTIALS_KEY);
      if (!stored) return;

      const { apiKey, apiSecret } = JSON.parse(stored);

      const response = await fetch('/api/trpc/coinbase.syncBalances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { apiKey, apiSecret } }),
      });

      const data = await response.json();
      const result = data.result?.data?.json;

      if (!result?.success) return;

      const coinbaseAccounts = result.accounts || [];

      const updatedAssets = assets.map(asset => {
        if (asset.isCoinbaseConnected && asset.coinbaseAccountId) {
          const match = coinbaseAccounts.find((a: any) => a.uuid === asset.coinbaseAccountId);
          if (match) {
            return { ...asset, quantity: match.balance };
          }
        }
        return asset;
      });

      setAssets(updatedAssets);
      saveAssetsMutation.mutate(updatedAssets);
      console.log('[Portfolio] Coinbase balances refreshed');
    } catch (error) {
      console.error('[Portfolio] Error refreshing Coinbase balances:', error);
    }
  };

  const hasRefreshedRef = useRef(false);

  const refreshMarketPrices = useCallback(async () => {
    const symbolAssets = assets.filter(
      (a) => a.symbol && MARKET_PRICE_TYPES.includes(a.type)
    );
    if (symbolAssets.length === 0) {
      console.log('[Portfolio] No tradeable assets with symbols to refresh');
      return;
    }

    setIsRefreshingPrices(true);
    try {
      const marketRequests = symbolAssets.map((a) => ({
        symbol: a.symbol!,
        assetType: a.type,
      }));

      const response = await fetch(
        `/api/trpc/marketData.getMarketData?input=${encodeURIComponent(
          JSON.stringify({ json: { assets: marketRequests } })
        )}`
      );

      if (!response.ok) {
        console.warn('[Portfolio] Market price fetch failed:', response.status, response.statusText);
        return;
      }

      const data = await response.json();
      const result = data.result?.data?.json;

      if (!result?.success || !result.data) {
        console.warn('[Portfolio] Market price refresh failed:', result?.error);
        return;
      }

      const priceMap = new Map<string, number>();
      const quotesMap: Record<string, MarketQuoteData> = {};
      for (const item of result.data) {
        priceMap.set(item.originalSymbol.toUpperCase(), item.price);
        priceMap.set(item.symbol.toUpperCase(), item.price);
        quotesMap[item.originalSymbol.toUpperCase()] = {
          price: item.price,
          changePercent: item.changePercent ?? 0,
          dayChange: item.dayChange ?? 0,
        };
        quotesMap[item.symbol.toUpperCase()] = {
          price: item.price,
          changePercent: item.changePercent ?? 0,
          dayChange: item.dayChange ?? 0,
        };
      }
      setMarketQuotes(prev => ({ ...prev, ...quotesMap }));

      let hasChanges = false;
      const updatedAssets = assets.map((asset) => {
        if (!asset.symbol || !MARKET_PRICE_TYPES.includes(asset.type)) return asset;
        const livePrice = priceMap.get(asset.symbol.toUpperCase());
        if (livePrice !== undefined && livePrice > 0 && livePrice !== asset.currentPrice) {
          hasChanges = true;
          return { ...asset, currentPrice: livePrice };
        }
        return asset;
      });

      if (hasChanges) {
        setAssets(updatedAssets);
        saveAssetsMutation.mutate(updatedAssets);
        console.log('[Portfolio] Market prices updated for', result.data.length, 'symbols');
      } else {
        console.log('[Portfolio] Market prices unchanged');
      }
      setLastPriceRefresh(Date.now());
    } catch (error) {
      console.error('[Portfolio] Error refreshing market prices:', error);
    } finally {
      setIsRefreshingPrices(false);
    }
  }, [assets, saveAssetsMutation]);

  const fetchSparklineData = useCallback(async () => {
    const symbolAssets = assets.filter(
      (a) => a.symbol && MARKET_PRICE_TYPES.includes(a.type)
    );
    if (symbolAssets.length === 0) return;

    const uniqueSymbols = [...new Set(symbolAssets.map((a) => a.symbol!.toUpperCase()))];
    const newSparklines: Record<string, SparklineData> = {};

    await Promise.all(
      uniqueSymbols.map(async (symbol) => {
        try {
          const response = await fetch(
            `/api/trpc/marketData.getHistoricalPrices?input=${encodeURIComponent(
              JSON.stringify({ json: { symbol, range: '1M' } })
            )}`
          );
          if (!response.ok) return;
          const data = await response.json();
          const result = data.result?.data?.json;
          if (!result?.success || !result.data || result.data.length === 0) return;

          const prices = result.data.map((p: { price: number }) => p.price);
          const sampled = prices.length > 12
            ? Array.from({ length: 12 }, (_, i) => prices[Math.floor((i / 11) * (prices.length - 1))])
            : prices;

          newSparklines[symbol] = { prices: sampled };
        } catch {
        }
      })
    );

    if (Object.keys(newSparklines).length > 0) {
      setSparklineData((prev) => ({ ...prev, ...newSparklines }));
      console.log('[Portfolio] Sparkline data loaded for', Object.keys(newSparklines).length, 'symbols');
    }
  }, [assets]);

  useEffect(() => {
    if (assets.length > 0 && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshMarketPrices().catch((error) => {
        console.error('[Portfolio] Failed to refresh market prices on init:', error);
      });
    }
  }, [assets, refreshMarketPrices]);

  useEffect(() => {
    if (assets.length > 0 && !hasLoadedSparklinesRef.current) {
      hasLoadedSparklinesRef.current = true;
      fetchSparklineData().catch((error) => {
        console.error('[Portfolio] Failed to load sparkline data on init:', error);
      });
    }
  }, [assets, fetchSparklineData]);

  const removeAllPlaidAccounts = async () => {
    setPlaidAccounts([]);
    savePlaidAccountsMutation.mutate([]);

    const updatedAssets = assets.filter((a) => !a.isPlaidConnected);
    setAssets(updatedAssets);
    saveAssetsMutation.mutate(updatedAssets);
  };

  return {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent,
    assetsByType,
    assetAllocation,
    isLoading: assetsQuery.isLoading || onboardingQuery.isLoading,
    hasCompletedOnboarding: onboardingQuery.data ?? false,
    completeOnboarding,
    plaidAccounts,
    syncPlaidAccount,
    refreshPlaidBalances,
    syncSnapTradeAccount,
    syncCoinbaseAccount,
    refreshCoinbaseBalances,
    removePlaidAccount,
    removeAllPlaidAccounts,
    refreshMarketPrices,
    isRefreshingPrices,
    lastPriceRefresh,
    marketQuotes,
    sparklineData,
  };
});
