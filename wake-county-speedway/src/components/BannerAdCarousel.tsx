import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/theme';
import { cms, type BannerAd } from '../api/cms';

/**
 * Banner content is entirely data-driven (see api/cms.ts + config/bannerAds.ts)
 * so staff can promote new events without an App Store resubmission.
 */
export function BannerAdCarousel() {
  const [ads, setAds] = useState<BannerAd[]>([]);
  const { width } = useWindowDimensions();
  const cardWidth = width - spacing.md * 2;

  useEffect(() => {
    cms.getBannerAds().then(setAds);
  }, []);

  if (ads.length === 0) return null;

  return (
    <FlatList
      data={ads}
      keyExtractor={(item) => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.list}
      renderItem={({ item }) => (
        <View style={[styles.card, { width: cardWidth }]}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
          <View style={styles.overlay}>
            <Text style={styles.headline}>{item.headline}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { marginBottom: spacing.md },
  card: {
    borderRadius: radii.md,
    overflow: 'hidden',
    height: 140,
    backgroundColor: colors.surface,
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11,12,16,0.75)',
    padding: spacing.sm,
  },
  headline: { ...typography.h3, color: colors.text },
});
