import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';
import { cms, type FoodVendor } from '../api/cms';

export default function FoodVendorsScreen() {
  const [vendors, setVendors] = useState<FoodVendor[]>([]);

  useEffect(() => {
    cms.getFoodVendors().then(setVendors);
  }, []);

  return (
    <ScreenContainer>
      <SectionHeader title="Food Vendors" subtitle="What's cooking at the track tonight" />
      {vendors.map((vendor) => (
        <Card key={vendor.id}>
          {vendor.photoUrl ? <Image source={{ uri: vendor.photoUrl }} style={styles.image} /> : null}
          <Text style={styles.name}>{vendor.name}</Text>
          <Text style={styles.description}>{vendor.description}</Text>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 160, borderRadius: 8, marginBottom: spacing.sm },
  name: { ...typography.h3, color: colors.text },
  description: { ...typography.body, color: colors.textMuted, marginTop: 4 },
});
