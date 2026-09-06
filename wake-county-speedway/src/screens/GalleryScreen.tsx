import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';
import { getGalleryEvents, type GalleryEvent } from '../api/gallery';
import type { MoreStackParamList, RootStackParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<MoreStackParamList, 'Gallery'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function GalleryScreen() {
  const navigation = useNavigation<Nav>();
  const [events, setEvents] = useState<GalleryEvent[]>([]);

  useEffect(() => {
    getGalleryEvents().then(setEvents);
  }, []);

  return (
    <ScreenContainer>
      <SectionHeader title="Event Media Gallery" subtitle="Browse photos and clips by race night" />
      {events.map((event) => (
        <TouchableOpacity
          key={event.eventId}
          onPress={() => navigation.navigate('EventGallery', { eventId: event.eventId, eventName: event.eventName })}
        >
          <Card style={styles.row}>
            {event.items[0] ? <Image source={{ uri: event.items[0].thumbnailUrl }} style={styles.thumb} /> : null}
            <Text style={styles.name}>{event.eventName}</Text>
            <Text style={styles.count}>{event.items.length} items</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.surfaceAlt },
  name: { ...typography.h3, color: colors.text, flex: 1 },
  count: { ...typography.small, color: colors.textMuted },
});
