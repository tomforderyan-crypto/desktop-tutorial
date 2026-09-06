import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { colors, radii, spacing, typography } from '../../theme/theme';
import { useCart } from '../../context/CartContext';
import {
  createMerchPaymentIntent,
  mockMerchCheckout,
  STRIPE_CHECKOUT_CONFIGURED,
  type ShippingAddress,
} from '../../services/merchCheckout';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const emptyAddress: ShippingAddress = { fullName: '', line1: '', city: '', state: '', zip: '' };

export default function CheckoutScreen({ navigation }: Props) {
  const { lines, subtotalUsd, clear } = useCart();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const addressComplete = Object.values(address).every((v) => v.trim().length > 0);

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
    setError(null);
    setPlacing(true);
    try {
      if (!STRIPE_CHECKOUT_CONFIGURED) {
        const result = await mockMerchCheckout();
        if (result.success) {
          setOrderId(result.orderId);
          clear();
        }
        return;
      }

      const { clientSecret, orderId: newOrderId } = await createMerchPaymentIntent(lines, address);

      const initResult = await initPaymentSheet({
        merchantDisplayName: 'Wake County Speedway',
        paymentIntentClientSecret: clientSecret,
      });
      if (initResult.error) throw new Error(initResult.error.message);

      const presentResult = await presentPaymentSheet();
      if (presentResult.error) {
        if (presentResult.error.code !== 'Canceled') setError(presentResult.error.message);
        return;
      }

      // Stripe's webhook (see wake-county-speedway-backend) marks the order
      // "paid" server-side once it confirms the charge; PaymentSheet
      // succeeding here means the fan's card was accepted.
      setOrderId(newOrderId);
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong placing your order.');
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
        Merch ships to you, so this checkout uses standard card payment (via Stripe) — physical goods are not
        processed through Apple's in-app purchase system.
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.placeButton, (placing || !addressComplete) && styles.placeButtonDisabled]}
        onPress={handlePlaceOrder}
        disabled={placing || !addressComplete}
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
  error: { ...typography.small, color: colors.danger, marginBottom: spacing.sm },
  placeButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: 'center' },
  placeButtonDisabled: { opacity: 0.6 },
  placeButtonText: { ...typography.h3, color: '#fff' },
  confirmTitle: { ...typography.h2, color: colors.success, marginBottom: spacing.sm },
  confirmBody: { ...typography.body, color: colors.text, marginBottom: spacing.md },
  doneButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.sm, alignItems: 'center' },
  doneButtonText: { ...typography.h3, color: '#fff' },
});
