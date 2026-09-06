import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { LiveBadge } from '../components/LiveBadge';
import { colors, radii, spacing, typography } from '../theme/theme';
import { cms, type LivestreamLink } from '../api/cms';
import { useSubscription } from '../context/SubscriptionContext';

/**
 * The stream itself is hosted entirely outside this app (whatever the
 * production partner already broadcasts to — YouTube Live, Facebook Live,
 * etc.), so this screen is just a link plus a live/offline flag staff flip
 * from the CMS backend (see cms.ts / config/livestreamLink.ts) — no video
 * player or streaming infrastructure of our own.
 */
export default function LivestreamScreen() {
  const [link, setLink] = useState<LivestreamLink | null>(null);
  const { status, loading, subscribe } = useSubscription();

  useEffect(() => {
    let mounted = true;
    cms.getLivestreamLink().then((l) => mounted && setLink(l));
    return () => {
      mounted = false;
    };
  }, []);

  if (!link) return null;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{link.label}</Text>
        <LiveBadge isLive={link.isLive} />
      </View>

      {!status.isActive ? (
        <Card>
          <Text style={styles.paywallTitle}>Fan Pass Required</Text>
          <Text style={styles.paywallBody}>
            Live race coverage is part of the Wake County Speedway Fan Pass — a flat monthly subscription
            (billed through your Apple ID) with no separate pay-per-view charges.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={subscribe} disabled={loading}>
            <Text style={styles.actionButtonText}>{loading ? 'Please wait…' : 'Subscribe — $9.99/mo'}</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <Card style={styles.watchCard}>
          <Text style={styles.watchBody}>
            {link.isLive
              ? "We're live right now — tap below to watch."
              : 'No broadcast right now. Check the schedule for the next race night.'}
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(link.url)}>
            <Text style={styles.actionButtonText}>Watch Live</Text>
          </TouchableOpacity>
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.md, gap: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  watchCard: { alignItems: 'center' },
  watchBody: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  paywallTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  paywallBody: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  actionButtonText: { ...typography.h3, color: '#fff' },
});
