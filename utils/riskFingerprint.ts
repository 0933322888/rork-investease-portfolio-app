import { Asset, AssetType } from '@/types/assets';

export interface RiskDimension {
  key: string;
  label: string;
  score: number;
  description: string;
}

export interface RiskFingerprint {
  dimensions: RiskDimension[];
  interpretation: string;
  badges: string[];
  overallRiskLevel: 'Conservative' | 'Moderate' | 'Aggressive';
}

export function calculateRiskFingerprint(assets: Asset[]): RiskFingerprint {
  if (assets.length === 0) {
    return {
      dimensions: [
        { key: 'concentration', label: 'Asset Class Concentration', score: 0, description: 'No assets' },
        { key: 'geography', label: 'Geographic Concentration', score: 0, description: 'No assets' },
        { key: 'sector', label: 'Sector Concentration', score: 0, description: 'No assets' },
        { key: 'volatility', label: 'Volatility Proxy', score: 0, description: 'No assets' },
        { key: 'liquidity', label: 'Liquidity', score: 0, description: 'No assets' },
        { key: 'incomeGrowth', label: 'Income vs Growth', score: 0, description: 'No assets' },
      ],
      interpretation: 'Add assets to see your portfolio risk profile',
      badges: [],
      overallRiskLevel: 'Moderate',
    };
  }

  const totalValue = assets.reduce((sum, asset) => sum + asset.quantity * asset.currentPrice, 0);
  
  const assetTypeWeights: Record<AssetType, number> = {
    stocks: 0,
    crypto: 0,
    commodities: 0,
    'fixed-income': 0,
    'real-estate': 0,
    cash: 0,
    other: 0,
  };
  
  assets.forEach((asset) => {
    const value = asset.quantity * asset.currentPrice;
    assetTypeWeights[asset.type] += value;
  });
  
  const assetTypePercentages: Record<AssetType, number> = Object.fromEntries(
    Object.entries(assetTypeWeights).map(([type, value]) => [type, (value / totalValue) * 100])
  ) as Record<AssetType, number>;

  const concentrationScore = calculateConcentrationScore(assetTypePercentages);
  const geographyScore = calculateGeographyScore(assetTypePercentages);
  const sectorScore = calculateSectorScore(assetTypePercentages);
  const volatilityScore = calculateVolatilityScore(assetTypePercentages);
  const liquidityScore = calculateLiquidityScore(assetTypePercentages);
  const incomeGrowthScore = calculateIncomeGrowthScore(assetTypePercentages, assets);

  const dimensions: RiskDimension[] = [
    {
      key: 'concentration',
      label: 'Asset Class Concentration',
      score: concentrationScore,
      description: getConcentrationDescription(concentrationScore),
    },
    {
      key: 'geography',
      label: 'Geographic Concentration',
      score: geographyScore,
      description: getGeographyDescription(geographyScore),
    },
    {
      key: 'sector',
      label: 'Sector Concentration',
      score: sectorScore,
      description: getSectorDescription(sectorScore),
    },
    {
      key: 'volatility',
      label: 'Volatility Proxy',
      score: volatilityScore,
      description: getVolatilityDescription(volatilityScore),
    },
    {
      key: 'liquidity',
      label: 'Liquidity',
      score: liquidityScore,
      description: getLiquidityDescription(liquidityScore),
    },
    {
      key: 'incomeGrowth',
      label: 'Income vs Growth',
      score: incomeGrowthScore,
      description: getIncomeGrowthDescription(incomeGrowthScore),
    },
  ];

  const interpretation = generateInterpretation(dimensions, assetTypePercentages);
  const badges = generateBadges(dimensions, assetTypePercentages);
  const overallRiskLevel = calculateOverallRiskLevel(dimensions);

  return { dimensions, interpretation, badges, overallRiskLevel };
}

function calculateConcentrationScore(percentages: Record<AssetType, number>): number {
  const values = Object.values(percentages).filter((v) => v > 0);
  if (values.length === 0) return 0;
  
  const maxPercentage = Math.max(...values);
  
  if (maxPercentage > 70) return 85;
  if (maxPercentage > 50) return 60;
  if (maxPercentage > 30) return 35;
  return 15;
}

function calculateGeographyScore(percentages: Record<AssetType, number>): number {
  const usExposure = percentages.stocks + percentages.crypto * 0.6 + percentages['fixed-income'] * 0.8;
  
  if (usExposure > 70) return 80;
  if (usExposure > 50) return 55;
  if (usExposure > 30) return 30;
  return 15;
}

function calculateSectorScore(percentages: Record<AssetType, number>): number {
  const techExposure = percentages.stocks * 0.7 + percentages.crypto;
  
  if (techExposure > 60) return 75;
  if (techExposure > 40) return 50;
  if (techExposure > 20) return 30;
  return 20;
}

function calculateVolatilityScore(percentages: Record<AssetType, number>): number {
  const volatileAssets = percentages.crypto * 1.0 + percentages.stocks * 0.6 + percentages.commodities * 0.5;
  const stableAssets = percentages.cash * 0.1 + percentages['fixed-income'] * 0.2 + percentages['real-estate'] * 0.3;
  
  const netVolatility = volatileAssets - stableAssets;
  
  if (netVolatility > 60) return 85;
  if (netVolatility > 40) return 65;
  if (netVolatility > 20) return 40;
  return 20;
}

function calculateLiquidityScore(percentages: Record<AssetType, number>): number {
  const highLiquidity = percentages.cash + percentages.stocks * 0.9 + percentages.crypto * 0.8;
  const lowLiquidity = percentages['real-estate'] + percentages.commodities * 0.6 + percentages['fixed-income'] * 0.4;
  
  const netLiquidity = highLiquidity - lowLiquidity * 0.5;
  
  return Math.max(0, Math.min(100, netLiquidity));
}

function calculateIncomeGrowthScore(percentages: Record<AssetType, number>, assets: Asset[]): number {
  const incomeAssets = percentages['fixed-income'] + percentages['real-estate'] + percentages.cash * 0.2;
  const growthAssets = percentages.stocks + percentages.crypto + percentages.commodities;
  
  const totalIncome = assets
    .filter((a) => a.monthlyIncome || a.monthlyRent)
    .reduce((sum, a) => sum + (a.monthlyIncome || a.monthlyRent || 0), 0);
  
  const hasIncome = totalIncome > 0;
  
  if (growthAssets > 70 && !hasIncome) return 85;
  if (growthAssets > 50) return 65;
  if (incomeAssets > 50) return 25;
  return 50;
}

function getConcentrationDescription(score: number): string {
  if (score > 70) return 'Highly concentrated in one asset class';
  if (score > 40) return 'Moderate concentration';
  return 'Well diversified across asset classes';
}

function getGeographyDescription(score: number): string {
  if (score > 70) return 'Heavily concentrated in US markets';
  if (score > 40) return 'Moderate US exposure';
  return 'Geographically diversified';
}

function getSectorDescription(score: number): string {
  if (score > 60) return 'High tech/growth sector exposure';
  if (score > 35) return 'Balanced sector allocation';
  return 'Conservative sector mix';
}

function getVolatilityDescription(score: number): string {
  if (score > 70) return 'High volatility expected';
  if (score > 40) return 'Moderate volatility';
  return 'Low volatility portfolio';
}

function getLiquidityDescription(score: number): string {
  if (score > 70) return 'Highly liquid';
  if (score > 40) return 'Moderately liquid';
  return 'Limited liquidity';
}

function getIncomeGrowthDescription(score: number): string {
  if (score > 70) return 'Growth-focused';
  if (score > 40) return 'Balanced growth and income';
  return 'Income-focused';
}

function generateInterpretation(dimensions: RiskDimension[], percentages: Record<AssetType, number>): string {
  const volatility = dimensions.find((d) => d.key === 'volatility')?.score || 0;
  const incomeGrowth = dimensions.find((d) => d.key === 'incomeGrowth')?.score || 0;
  const geography = dimensions.find((d) => d.key === 'geography')?.score || 0;
  const liquidity = dimensions.find((d) => d.key === 'liquidity')?.score || 0;

  let growthType = 'balanced';
  if (incomeGrowth > 65) growthType = 'growth-oriented';
  else if (incomeGrowth < 35) growthType = 'income-focused';

  let geoFocus = 'diversified';
  if (geography > 65) geoFocus = 'US-centric';
  else if (geography > 40) geoFocus = 'US-leaning';

  let volatilityLevel = 'moderately volatile';
  if (volatility > 65) volatilityLevel = 'highly volatile';
  else if (volatility < 35) volatilityLevel = 'low volatility';

  let incomeProtection = 'moderate income';
  if (percentages['fixed-income'] + percentages['real-estate'] > 30) {
    incomeProtection = 'strong income protection';
  } else if (percentages['fixed-income'] + percentages['real-estate'] < 10) {
    incomeProtection = 'limited income protection';
  }

  return `Your portfolio is ${growthType}, ${geoFocus}, and ${volatilityLevel} with ${incomeProtection}.`;
}

function generateBadges(dimensions: RiskDimension[], percentages: Record<AssetType, number>): string[] {
  const badges: string[] = [];

  const incomeGrowth = dimensions.find((d) => d.key === 'incomeGrowth')?.score || 0;
  if (incomeGrowth > 65) badges.push('Growth-Heavy');
  else if (incomeGrowth < 35) badges.push('Income-Focused');

  const geography = dimensions.find((d) => d.key === 'geography')?.score || 0;
  if (geography > 65) badges.push('US Exposure: High');
  else if (geography < 35) badges.push('Global Diversification');

  const liquidity = dimensions.find((d) => d.key === 'liquidity')?.score || 0;
  if (liquidity > 65) badges.push('Liquidity: High');
  else if (liquidity < 35) badges.push('Liquidity: Low');
  else badges.push('Liquidity: Medium');

  const volatility = dimensions.find((d) => d.key === 'volatility')?.score || 0;
  if (volatility > 65) badges.push('High Risk');
  else if (volatility < 35) badges.push('Conservative');

  if (percentages.crypto > 20) badges.push('Crypto Exposure');
  if (percentages['real-estate'] > 30) badges.push('Real Estate Heavy');

  return badges.slice(0, 4);
}

function calculateOverallRiskLevel(dimensions: RiskDimension[]): 'Conservative' | 'Moderate' | 'Aggressive' {
  const avgScore = dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length;
  
  if (avgScore > 60) return 'Aggressive';
  if (avgScore < 35) return 'Conservative';
  return 'Moderate';
}
