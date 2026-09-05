import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { LiveBadge } from '../components/LiveBadge';
import { colors, radii, spacing, typography } from '../theme/theme';
import { getLiveStreamStatus, type LiveStreamStatus } from '../api/mux';
import { useSubscription } from '../context/SubscriptionContext';

export default function LivestreamScreen() {
  const [stream, setStream] = useState<LiveStreamStatus | null>(null);
  const { status, loading, subscribe } = useSubscription();

  useEffect(() => {
    let mounted = true;
    getLiveStreamStatus().then((s) => mounted && setStream(s));
    const interval = setInterval(() => {
      getLiveStreamStatus().then((s) => mounted && setStream(s));
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!stream) return null;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{stream.streamTitle}</Text>
        <LiveBadge isLive={stream.isLive} />
      </View>

      {!status.isActive ? (
        <Card>
          <Text style={styles.paywallTitle}>Fan Pass Required</Text>
          <Text style={styles.paywallBody}>
            Live race coverage is part of the Wake County Speedway Fan Pass — a flat monthly subscription
            (billed through your Apple ID) with no separate pay-per-view charges.
          </Text>
          <TouchableOpacity style={styles.subscribeButton} onPress={subscribe} disabled={loading}>
            <Text style={styles.subscribeButtonText}>{loading ? 'Please wait…' : 'Subscribe — $9.99/mo'}</Text>
          </TouchableOpacity>
        </Card>
      ) : stream.isLive && stream.hlsUrl ? (
        <Video
          source={{ uri: stream.hlsUrl }}
          style={styles.player}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
        />
      ) : (
        <Card style={styles.offlineCard}>
          <Text style={styles.offlineText}>No broadcast right now. Check the schedule for the next race night.</Text>
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.md, gap: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  player: { width: '100%', aspectRatio: 16 / 9, borderRadius: radii.md, backgroundColor: '#000' },
  offlineCard: { alignItems: 'center', paddingVertical: spacing.xl },
  offlineText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  paywallTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  paywallBody: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  subscribeButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: 'center' },
  subscribeButtonText: { ...typography.h3, color: '#fff' },
});
