import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { LiveBadge } from '../components/LiveBadge';
import { colors, radii, spacing, typography } from '../theme/theme';
import { cms, type LivestreamLink } from '../api/cms';

/**
 * The stream itself is hosted entirely outside this app (whatever the
 * production partner already broadcasts to — YouTube Live, Facebook Live,
 * etc.), so this screen is just a link plus a live/offline flag staff flip
 * from the CMS backend (see cms.ts / config/livestreamLink.ts) — no video
 * player or streaming infrastructure of our own. The whole app is free, so
 * there's no paywall here — every fan sees the same "Watch Live" button.
 */
export default function LivestreamScreen() {
  const [link, setLink] = useState<LivestreamLink | null>(null);

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.md, gap: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  watchCard: { alignItems: 'center' },
  watchBody: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  actionButtonText: { ...typography.h3, color: '#fff' },
});
