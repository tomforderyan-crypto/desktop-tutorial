import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { colors, spacing, typography } from '../../theme/theme';
import { getMerchCatalog, type MerchProduct } from '../../api/merchCatalog';
import { useCart } from '../../context/CartContext';
import type { RootStackParamList } from '../../navigation/types';

export default function CatalogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const { itemCount } = useCart();

  useEffect(() => {
    getMerchCatalog().then(setProducts);
  }, []);

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Merch Store</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartButton}>
          <Text style={styles.cartText}>Cart ({itemCount})</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.column}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tile}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          >
            <Card style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.priceUsd}</Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: 0,
  },
  title: { ...typography.h1, color: colors.text },
  cartButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  cartText: { ...typography.label, color: '#fff' },
  list: { padding: spacing.md },
  column: { gap: spacing.md },
  tile: { flex: 1 },
  card: { alignItems: 'center' },
  image: { width: '100%', height: 130, borderRadius: 8, marginBottom: spacing.sm },
  name: { ...typography.body, color: colors.text, textAlign: 'center' },
  price: { ...typography.h3, color: colors.accent, marginTop: 4 },
});
