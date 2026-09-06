import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { colors, radii, spacing, typography } from '../../theme/theme';
import { useCart } from '../../context/CartContext';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export default function CartScreen({ navigation }: Props) {
  const { lines, removeLine, updateQuantity, subtotalUsd } = useCart();

  if (lines.length === 0) {
    return (
      <ScreenContainer>
        <Text style={styles.empty}>Your cart is empty.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {lines.map((line, index) => (
        <Card key={`${line.product.id}-${line.size ?? ''}`} style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>{line.product.name}</Text>
            {line.size ? <Text style={styles.meta}>Size {line.size}</Text> : null}
            <View style={styles.qtyRow}>
              <TouchableOpacity
                onPress={() => updateQuantity(index, Math.max(1, line.quantity - 1))}
                style={styles.qtyButton}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{line.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(index, line.quantity + 1)} style={styles.qtyButton}>
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.right}>
            <Text style={styles.lineTotal}>${(line.product.priceUsd * line.quantity).toFixed(2)}</Text>
            <TouchableOpacity onPress={() => removeLine(index)}>
              <Text style={styles.remove}>Remove</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>${subtotalUsd.toFixed(2)}</Text>
      </Card>

      <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate('Checkout')}>
        <Text style={styles.checkoutText}>Checkout</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { flex: 1 },
  name: { ...typography.h3, color: colors.text },
  meta: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: { ...typography.h3, color: colors.text },
  qty: { ...typography.body, color: colors.text, minWidth: 20, textAlign: 'center' },
  right: { alignItems: 'flex-end', justifyContent: 'space-between' },
  lineTotal: { ...typography.h3, color: colors.accent },
  remove: { ...typography.small, color: colors.danger },
  summaryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...typography.h3, color: colors.text },
  summaryValue: { ...typography.h2, color: colors.text },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  checkoutText: { ...typography.h3, color: '#fff' },
});
