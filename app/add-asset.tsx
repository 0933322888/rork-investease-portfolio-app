import { router } from 'expo-router';
import { X, TrendingUp, Bitcoin, Gem, Receipt, Home, Wallet, Package, Check, Link2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { AssetType, ASSET_TYPES } from '@/types/assets';

const ICONS = {
  TrendingUp,
  Bitcoin,
  Gem,
  Receipt,
  Home,
  Wallet,
  Package,
};

export default function AddAssetScreen() {
  const { addAsset } = usePortfolio();
  const [step, setStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<AssetType | null>(null);
  const [symbol, setSymbol] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isRented, setIsRented] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [marketValue, setMarketValue] = useState('');
  const [interestRate, setInterestRate] = useState('');

  const handleSelectType = (type: AssetType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    const baseAsset = {
      type: selectedType,
      name: '',
      symbol: undefined as string | undefined,
      quantity: 0,
      address: undefined as string | undefined,
      purchasePrice: 0,
      currentPrice: 0,
      currency: 'USD',
      isRented: undefined as boolean | undefined,
      monthlyRent: undefined as number | undefined,
      monthlyIncome: undefined as number | undefined,
      dueDate: undefined as string | undefined,
      estimatedValue: undefined as number | undefined,
      interestRate: undefined as number | undefined,
    };

    if (selectedType === 'stocks') {
      if (!symbol.trim() || !purchasePrice.trim() || !quantity.trim()) return;
      const mockCurrentPrice = parseFloat(purchasePrice) * (1 + (Math.random() * 0.2 - 0.1));
      baseAsset.name = symbol.toUpperCase();
      baseAsset.symbol = symbol.toUpperCase();
      baseAsset.quantity = parseFloat(quantity);
      baseAsset.purchasePrice = parseFloat(purchasePrice);
      baseAsset.currentPrice = parseFloat(mockCurrentPrice.toFixed(2));
    } else if (selectedType === 'crypto') {
      if (!symbol.trim() || !purchasePrice.trim() || !quantity.trim()) return;
      const mockCurrentPrice = parseFloat(purchasePrice) * (1 + (Math.random() * 0.2 - 0.1));
      baseAsset.name = symbol.toUpperCase();
      baseAsset.symbol = symbol.toUpperCase();
      baseAsset.quantity = parseFloat(quantity);
      baseAsset.purchasePrice = parseFloat(purchasePrice);
      baseAsset.currentPrice = parseFloat(mockCurrentPrice.toFixed(2));
    } else if (selectedType === 'real-estate') {
      if (!symbol.trim() || !purchasePrice.trim()) return;
      if (isRented && !monthlyRent.trim()) return;
      const mockCurrentPrice = parseFloat(purchasePrice) * (1 + (Math.random() * 0.05));
      baseAsset.name = symbol;
      baseAsset.quantity = 1;
      baseAsset.address = address;
      baseAsset.purchasePrice = parseFloat(purchasePrice);
      baseAsset.currentPrice = parseFloat(mockCurrentPrice.toFixed(2));
      baseAsset.isRented = isRented;
      baseAsset.monthlyRent = isRented && monthlyRent.trim() ? parseFloat(monthlyRent) : undefined;
    } else if (selectedType === 'cash') {
      if (!symbol.trim() || !quantity.trim()) return;
      const amount = parseFloat(quantity);
      baseAsset.name = symbol;
      baseAsset.quantity = amount;
      baseAsset.purchasePrice = 1;
      baseAsset.currentPrice = 1;
      if (interestRate.trim()) {
        baseAsset.interestRate = parseFloat(interestRate);
      }
    } else if (selectedType === 'commodities') {
      if (!symbol.trim() || !estimatedValue.trim()) return;
      baseAsset.name = symbol;
      baseAsset.quantity = 1;
      baseAsset.purchasePrice = parseFloat(estimatedValue);
      baseAsset.currentPrice = parseFloat(estimatedValue);
      baseAsset.estimatedValue = parseFloat(estimatedValue);
    } else if (selectedType === 'fixed-income') {
      if (!symbol.trim() || !monthlyIncome.trim() || !dueDate.trim()) return;
      baseAsset.name = symbol;
      baseAsset.quantity = 1;
      baseAsset.purchasePrice = 0;
      baseAsset.currentPrice = 0;
      baseAsset.monthlyIncome = parseFloat(monthlyIncome);
      baseAsset.dueDate = dueDate;
    } else if (selectedType === 'other') {
      if (!symbol.trim() || !purchasePrice.trim() || !quantity.trim() || !marketValue.trim()) return;
      baseAsset.name = symbol;
      baseAsset.quantity = parseFloat(quantity);
      baseAsset.purchasePrice = parseFloat(purchasePrice);
      baseAsset.currentPrice = parseFloat(marketValue);
    }

    addAsset(baseAsset);
    router.back();
  };

  const isFormValid = (() => {
    if (!selectedType || !symbol.trim()) return false;
    
    if (selectedType === 'stocks' || selectedType === 'crypto') {
      return purchasePrice.trim() !== '' && !isNaN(parseFloat(purchasePrice)) &&
             quantity.trim() !== '' && !isNaN(parseFloat(quantity));
    } else if (selectedType === 'real-estate') {
      const baseValid = purchasePrice.trim() !== '' && !isNaN(parseFloat(purchasePrice));
      if (isRented) {
        return baseValid && monthlyRent.trim() !== '' && !isNaN(parseFloat(monthlyRent));
      }
      return baseValid;
    } else if (selectedType === 'cash') {
      return quantity.trim() !== '' && !isNaN(parseFloat(quantity));
    } else if (selectedType === 'commodities') {
      return estimatedValue.trim() !== '' && !isNaN(parseFloat(estimatedValue));
    } else if (selectedType === 'fixed-income') {
      return monthlyIncome.trim() !== '' && !isNaN(parseFloat(monthlyIncome)) &&
             dueDate.trim() !== '';
    } else if (selectedType === 'other') {
      return purchasePrice.trim() !== '' && !isNaN(parseFloat(purchasePrice)) &&
             quantity.trim() !== '' && !isNaN(parseFloat(quantity)) &&
             marketValue.trim() !== '' && !isNaN(parseFloat(marketValue));
    }
    return false;
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Asset</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {step === 1 ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepTitle}>Select Asset Type</Text>
            <View style={styles.typeGrid}>
              {ASSET_TYPES.map((type) => {
                const IconComponent = ICONS[type.icon as keyof typeof ICONS];
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={styles.typeCard}
                    onPress={() => handleSelectType(type.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.typeIcon}>
                      <IconComponent size={28} color={Colors.accent} strokeWidth={2} />
                    </View>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepTitle}>Enter Details</Text>
            <View style={styles.form}>
              {selectedType === 'stocks' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Stock Symbol</Text>
                    <TextInput
                      style={styles.inputLarge}
                      value={symbol}
                      onChangeText={setSymbol}
                      placeholder="AAPL"
                      placeholderTextColor={Colors.text.tertiary}
                      autoCapitalize="characters"
                      autoFocus
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="10"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Purchase Price (USD)</Text>
                    <TextInput
                      style={styles.input}
                      value={purchasePrice}
                      onChangeText={setPurchasePrice}
                      placeholder="150.00"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>Current price will be fetched automatically</Text>
                  </View>
                </>
              )}
              {selectedType === 'crypto' && (
                <>
                  <TouchableOpacity
                    style={styles.coinbaseConnectCard}
                    onPress={() => router.push('/connect-coinbase' as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.coinbaseLeft}>
                      <View style={styles.coinbaseLogo}>
                        <Text style={styles.coinbaseLogoText}>C</Text>
                      </View>
                      <View>
                        <Text style={styles.coinbaseTitle}>Connect Coinbase</Text>
                        <Text style={styles.coinbaseSubtitle}>Auto-import crypto balances</Text>
                      </View>
                    </View>
                    <Link2 size={18} color={Colors.accent} />
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or add manually</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Crypto Symbol</Text>
                    <TextInput
                      style={styles.inputLarge}
                      value={symbol}
                      onChangeText={setSymbol}
                      placeholder="BTC"
                      placeholderTextColor={Colors.text.tertiary}
                      autoCapitalize="characters"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="0.5"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Purchase Price (USD)</Text>
                    <TextInput
                      style={styles.input}
                      value={purchasePrice}
                      onChangeText={setPurchasePrice}
                      placeholder="45000.00"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>Current price will be fetched automatically</Text>
                  </View>
                </>
              )}
              {selectedType === 'real-estate' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Name</Text>
                    <TextInput
                      style={styles.inputLarge}
                      value={symbol}
                      onChangeText={setSymbol}
                      placeholder="Downtown Apartment"
                      placeholderTextColor={Colors.text.tertiary}
                      autoFocus
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Address</Text>
                    <TextInput
                      style={styles.inputLarge}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="123 Central Ave, New York, NY"
                      placeholderTextColor={Colors.text.tertiary}
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Purchase Price (USD)</Text>
                    <TextInput
                      style={styles.input}
                      value={purchasePrice}
                      onChangeText={setPurchasePrice}
                      placeholder="350000.00"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>This property is rented</Text>
                    <Switch
                      value={isRented}
                      onValueChange={setIsRented}
                      trackColor={{ false: Colors.border.light, true: Colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  {isRented && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Monthly Rent Income (USD)</Text>
                      <TextInput
                        style={styles.input}
                        value={monthlyRent}
                        onChangeText={setMonthlyRent}
                        placeholder="2500.00"
                        placeholderTextColor={Colors.text.tertiary}
                        keyboardType="decimal-pad"
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                      />
                    </View>
                  )}
                </>
              )}
              {selectedType === 'cash' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Name</Text>
                    <TextInput
                      style={styles.inputLarge}
                      value={symbol}
                      onChangeText={setSymbol}
                      placeholder="Savings Account"
                      placeholderTextColor={Colors.text.tertiary}
                      autoFocus
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Amount (USD)</Text>
                    <TextInput
                      style={styles.input}
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="10000.00"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Interest Rate (%)</Text>
                    <TextInput
                      style={styles.input}
                      value={interestRate}
                      onChangeText={setInterestRate}
                      placeholder="4.50"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>
                </>
              )}
              {selectedType === 'commodities' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Name</Text>
                    <TextInput
                      style={styles.inputLarge}
                      value={symbol}
                      onChangeText={setSymbol}
                      placeholder="Gold Bars"
                      placeholderTextColor={Colors.text.tertiary}
                      autoFocus
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Estimated Value (USD)</Text>
                    <TextInput
                      style={styles.input}
                      value={estimatedValue}
                      onChangeText={setEstimatedValue}
                      placeholder="50000.00"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>
                </>
              )}
              {selectedType === 'fixed-income' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Name</Text>
                    <TextInput
                      style={styles.inputLarge}
                      value={symbol}
                      onChangeText={setSymbol}
                      placeholder="Treasury Bond"
                      placeholderTextColor={Colors.text.tertiary}
                      autoFocus
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Monthly Income (USD)</Text>
                    <TextInput
                      style={styles.input}
                      value={monthlyIncome}
                      onChangeText={setMonthlyIncome}
                      placeholder="500.00"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Due Date</Text>
                    <TextInput
                      style={styles.input}
                      value={dueDate}
                      onChangeText={setDueDate}
                      placeholder="2030-12-31"
                      placeholderTextColor={Colors.text.tertiary}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>
                </>
              )}
              {selectedType === 'other' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Name</Text>
                    <TextInput
                      style={styles.inputLarge}
                      value={symbol}
                      onChangeText={setSymbol}
                      placeholder="Vintage Watch"
                      placeholderTextColor={Colors.text.tertiary}
                      autoFocus
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Purchase Value (USD)</Text>
                    <TextInput
                      style={styles.input}
                      value={purchasePrice}
                      onChangeText={setPurchasePrice}
                      placeholder="5000.00"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="1"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Market Value (USD)</Text>
                    <TextInput
                      style={styles.input}
                      value={marketValue}
                      onChangeText={setMarketValue}
                      placeholder="7500.00"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        )}

        {step === 2 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, !isFormValid && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid}
              activeOpacity={0.8}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Add Asset</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headline,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  stepTitle: {
    ...typography.title2,
    color: Colors.text.primary,
    marginBottom: spacing.lg,
  },
  typeGrid: {
    gap: spacing.md,
  },
  typeCard: {
    backgroundColor: Colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  typeLabel: {
    ...typography.headline,
    color: Colors.text.primary,
    marginBottom: spacing.xs,
  },
  typeDescription: {
    ...typography.footnote,
    color: Colors.text.secondary,
  },
  form: {
    gap: spacing.lg,
  },
  formGroup: {
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  switchLabel: {
    ...typography.body,
    color: Colors.text.primary,
    fontWeight: '500' as const,
  },
  formLabel: {
    ...typography.subhead,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: Colors.text.primary,
  },
  inputLarge: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    fontSize: 32,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    textAlign: 'center' as const,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.border.medium,
    shadowOpacity: 0,
  },
  buttonText: {
    ...typography.headline,
    color: '#FFFFFF',
  },
  noteContainer: {
    backgroundColor: Colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  noteText: {
    ...typography.footnote,
    color: Colors.text.secondary,
    textAlign: 'center' as const,
  },
  coinbaseConnectCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  coinbaseLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
  },
  coinbaseLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0052FF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  coinbaseLogoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  coinbaseTitle: {
    ...typography.subhead,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  coinbaseSubtitle: {
    ...typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    ...typography.caption,
    color: Colors.text.tertiary,
  },
});
