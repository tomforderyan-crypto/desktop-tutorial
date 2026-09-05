import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { BannerAdCarousel } from '../components/BannerAdCarousel';
import { WeatherWidget } from '../components/WeatherWidget';
import { LiveBadge } from '../components/LiveBadge';
import { colors, spacing, typography } from '../theme/theme';
import { myRacePass } from '../api/myRacePassClient';
import { getLiveStreamStatus } from '../api/mux';
import type { MpEvent } from '../api/types';
import type { TabParamList } from '../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [nextEvent, setNextEvent] = useState<MpEvent | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    myRacePass.getSchedule().then((events) => setNextEvent(events[0] ?? null));
    getLiveStreamStatus().then((s) => setIsLive(s.isLive));
  }, []);

  return (
    <ScreenContainer>
      <Text style={styles.trackName}>Wake County Speedway</Text>

      <BannerAdCarousel />
      <WeatherWidget />

      <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'Livestream' })}>
        <Card style={styles.liveRow}>
          <View>
            <Text style={styles.liveTitle}>Race Coverage</Text>
            <Text style={styles.liveSubtitle}>{isLive ? 'Watch now' : 'Tap for schedule & replays'}</Text>
          </View>
          <LiveBadge isLive={isLive} />
        </Card>
      </TouchableOpacity>

      {nextEvent ? (
        <Card>
          <SectionHeader title="Next Race Night" />
          <Text style={styles.eventName}>{nextEvent.eventName}</Text>
          <Text style={styles.eventMeta}>
            {new Date(nextEvent.eventDateIso).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}{' '}
            · Gates {nextEvent.gatesOpen}
          </Text>
        </Card>
      ) : null}

      <View style={styles.quickLinks}>
        <QuickLink label="🏆 Standings" onPress={() => navigation.navigate('Standings')} />
        <QuickLink label="📅 Schedule" onPress={() => navigation.navigate('Schedule')} />
        <QuickLink label="🛍️ Merch" onPress={() => navigation.navigate('Merch')} />
        <QuickLink label="🌭 Food" onPress={() => navigation.navigate('More', { screen: 'FoodVendors' })} />
      </View>
    </ScreenContainer>
  );
}

function QuickLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickLink} onPress={onPress}>
      <Text style={styles.quickLinkText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trackName: { ...typography.h1, color: colors.text, marginBottom: spacing.md },
  liveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveTitle: { ...typography.h3, color: colors.text },
  liveSubtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  eventName: { ...typography.h3, color: colors.text },
  eventMeta: { ...typography.small, color: colors.textMuted, marginTop: 4 },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  quickLink: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  quickLinkText: { ...typography.body, color: colors.text },
});
