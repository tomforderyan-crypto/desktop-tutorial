import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/theme';

export function LiveBadge({ isLive }: { isLive: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: isLive ? colors.live : colors.surfaceAlt }]}>
      {isLive ? <View style={styles.dot} /> : null}
      <Text style={styles.text}>{isLive ? 'LIVE NOW' : 'OFFLINE'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  text: { ...typography.label, color: colors.text, letterSpacing: 0.5 },
});
