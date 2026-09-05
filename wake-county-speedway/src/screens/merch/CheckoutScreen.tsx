import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { colors, radii, spacing, typography } from '../../theme/theme';
import { useCart } from '../../context/CartContext';
import { processMerchCheckout, type ShippingAddress } from '../../services/merchCheckout';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const emptyAddress: ShippingAddress = { fullName: '', line1: '', city: '', state: '', zip: '' };

export default function CheckoutScreen({ navigation }: Props) {
  const { subtotalUsd, clear } = useCart();
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  function field(key: keyof ShippingAddress, label: string) {
    return (
      <TextInput
        key={key}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={address[key]}
        onChangeText={(text) => setAddress((prev) => ({ ...prev, [key]: text }))}
      />
    );
  }

  async function handlePlaceOrder() {
    setPlacing(true);
    try {
      const result = await processMerchCheckout(subtotalUsd, address);
      if (result.success) {
        setOrderId(result.orderId);
        clear();
      }
    } finally {
      setPlacing(false);
    }
  }

  if (orderId) {
    return (
      <ScreenContainer>
        <Card>
          <Text style={styles.confirmTitle}>Order Placed!</Text>
          <Text style={styles.confirmBody}>
            Order #{orderId} is confirmed. You'll get a shipping confirmation email once it's on the way.
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => navigation.popToTop()}>
            <Text style={styles.doneButtonText}>Back to Store</Text>
          </TouchableOpacity>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.note}>
        Merch ships to you, so this checkout uses standard card payment — physical goods are not processed
        through Apple's in-app purchase system.
      </Text>

      <Card>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        {field('fullName', 'Full name')}
        {field('line1', 'Street address')}
        {field('city', 'City')}
        {field('state', 'State')}
        {field('zip', 'ZIP code')}
      </Card>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total</Text>
        <Text style={styles.summaryValue}>${subtotalUsd.toFixed(2)}</Text>
      </Card>

      <TouchableOpacity
        style={[styles.placeButton, placing && styles.placeButtonDisabled]}
        onPress={handlePlaceOrder}
        disabled={placing}
      >
        <Text style={styles.placeButtonText}>{placing ? 'Placing Order…' : 'Place Order'}</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  note: { ...typography.small, color: colors.textMuted, marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...typography.h3, color: colors.text },
  summaryValue: { ...typography.h2, color: colors.text },
  placeButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: 'center' },
  placeButtonDisabled: { opacity: 0.6 },
  placeButtonText: { ...typography.h3, color: '#fff' },
  confirmTitle: { ...typography.h2, color: colors.success, marginBottom: spacing.sm },
  confirmBody: { ...typography.body, color: colors.text, marginBottom: spacing.md },
  doneButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.sm, alignItems: 'center' },
  doneButtonText: { ...typography.h3, color: '#fff' },
});
