import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, radii, spacing, typography } from '../../theme/theme';
import { getMerchCatalog, type MerchProduct } from '../../api/merchCatalog';
import { useCart } from '../../context/CartContext';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<MerchProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const { addItem } = useCart();

  useEffect(() => {
    getMerchCatalog().then((all) => {
      const found = all.find((p) => p.id === productId) ?? null;
      setProduct(found);
      setSelectedSize(found?.sizes?.[0]);
    });
  }, [productId]);

  if (!product) return <ScreenContainer><Text style={{ color: colors.textMuted }}>Loading…</Text></ScreenContainer>;

  return (
    <ScreenContainer>
      <Image source={{ uri: product.imageUrl }} style={styles.image} />
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>${product.priceUsd}</Text>
      <Text style={styles.description}>{product.description}</Text>

      {product.sizes ? (
        <View style={styles.sizeRow}>
          {product.sizes.map((size) => (
            <TouchableOpacity
              key={size}
              onPress={() => setSelectedSize(size)}
              style={[styles.sizeChip, selectedSize === size && styles.sizeChipActive]}
            >
              <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextActive]}>{size}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          addItem(product, selectedSize, 1);
          navigation.navigate('Cart');
        }}
      >
        <Text style={styles.addButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 260, borderRadius: radii.md, marginBottom: spacing.md },
  name: { ...typography.h1, color: colors.text },
  price: { ...typography.h2, color: colors.accent, marginVertical: spacing.xs },
  description: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  sizeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  sizeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeText: { ...typography.body, color: colors.text },
  sizeTextActive: { color: '#fff', fontWeight: '700' },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addButtonText: { ...typography.h3, color: '#fff' },
});
