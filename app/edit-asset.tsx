import { router, useLocalSearchParams } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { usePortfolio } from '@/contexts/PortfolioContext';

export default function EditAssetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets, updateAsset } = usePortfolio();

  const asset = assets.find((a) => a.id === id);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('')
  const [symbol, setSymbol] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setSymbol(asset.symbol || '');
      setAddress(asset.address || '');
      setPurchasePrice(asset.purchasePrice?.toString() || '');
      setCurrentPrice(asset.currentPrice?.toString() || '');
      setQuantity(asset.quantity?.toString() || '');
    }
  }, [asset]);

  if (!asset) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Asset</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Asset not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = () => {
    updateAsset(asset.id, {
      name: name.trim() || asset.name,
      address: address.trim() || undefined,
      symbol: symbol.trim() || undefined,
      purchasePrice: parseFloat(purchasePrice) || asset.purchasePrice,
      currentPrice: parseFloat(currentPrice) || asset.currentPrice,
      quantity: parseFloat(quantity) || asset.quantity,
    });
    router.back();
  };

  const isFormValid = name.trim() !== '' &&
    !isNaN(parseFloat(purchasePrice)) &&
    !isNaN(parseFloat(quantity));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Asset</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Asset name"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            {asset.type === 'real-estate' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="e.g., 123 Main St, New York, NY"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCorrect={false}
                  autoComplete="street-address"
                  textContentType="fullStreetAddress"
                  keyboardType="default"
                  multiline={true}
                  numberOfLines={2}
                />
              </View>
            )}

            {(asset.type === 'stocks' || asset.type === 'crypto') && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Symbol</Text>
                <TextInput
                  style={styles.input}
                  value={symbol}
                  onChangeText={setSymbol}
                  placeholder="e.g., AAPL, BTC"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="characters"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purchase Price</Text>
              <TextInput
                style={styles.input}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="0.00"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Price</Text>
              <TextInput
                style={styles.input}
                value={currentPrice}
                onChangeText={setCurrentPrice}
                placeholder="0.00"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid}
            activeOpacity={0.8}
          >
            <Check size={20} color={Colors.card} strokeWidth={2.5} />
            <Text style={styles.submitButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
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
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    ...typography.subhead,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...typography.body,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.background,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.headline,
    color: Colors.card,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: Colors.text.secondary,
  },
});
