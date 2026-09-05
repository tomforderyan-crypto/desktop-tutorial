import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';
import type { MoreStackParamList } from '../navigation/types';

const ITEMS: Array<{ route: keyof MoreStackParamList; label: string; emoji: string }> = [
  { route: 'Livestream', label: 'Livestream', emoji: '📺' },
  { route: 'Drivers', label: 'Drivers', emoji: '🏎️' },
  { route: 'SocialFeed', label: 'Social', emoji: '💬' },
  { route: 'FoodVendors', label: 'Food Vendors', emoji: '🌭' },
  { route: 'Gallery', label: 'Event Media Gallery', emoji: '🖼️' },
  { route: 'TrackInfo', label: 'Track Info & Rules', emoji: 'ℹ️' },
  { route: 'Settings', label: 'Notifications', emoji: '🔔' },
];

export default function MoreMenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

  return (
    <ScreenContainer>
      {ITEMS.map((item) => (
        <TouchableOpacity key={item.route} onPress={() => navigation.navigate(item.route as never)}>
          <Card style={styles.row}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emoji: { fontSize: 20 },
  label: { ...typography.h3, color: colors.text, flex: 1 },
  chevron: { ...typography.h2, color: colors.textMuted },
});
