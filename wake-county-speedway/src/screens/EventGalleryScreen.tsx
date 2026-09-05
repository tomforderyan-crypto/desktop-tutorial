import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, spacing, typography } from '../theme/theme';
import { getGalleryEvents, type GalleryMediaItem } from '../api/gallery';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventGallery'>;

export default function EventGalleryScreen({ route }: Props) {
  const { eventId } = route.params;
  const [items, setItems] = useState<GalleryMediaItem[]>([]);

  useEffect(() => {
    getGalleryEvents().then((events) => {
      setItems(events.find((e) => e.eventId === eventId)?.items ?? []);
    });
  }, [eventId]);

  return (
    <ScreenContainer scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.column}
        renderItem={({ item }) => (
          <View style={styles.tile}>
            <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
            {item.type === 'video' ? (
              <View style={styles.playBadge}>
                <Text style={styles.playBadgeText}>▶</Text>
              </View>
            ) : null}
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: { padding: spacing.md },
  column: { gap: spacing.sm },
  tile: { flex: 1, marginBottom: spacing.sm },
  thumb: { width: '100%', aspectRatio: 3 / 2, borderRadius: 8, backgroundColor: colors.surfaceAlt },
  playBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadgeText: { color: colors.text, fontSize: 12 },
});
