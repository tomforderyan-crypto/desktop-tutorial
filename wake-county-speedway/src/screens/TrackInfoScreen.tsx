import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';

/**
 * Content here rarely changes, so it's plain static copy rather than a CMS
 * fetch — edit this file directly when gate times, pricing, or rules change.
 */
const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: 'Directions',
    body: 'Wake County Speedway, Raleigh, NC. Follow event-day signage from US-1 — parking attendants direct fan lots on race nights.',
  },
  {
    title: 'Gate Times',
    body: 'Gates open at 5:00 PM, practice at 5:30 PM, racing at 7:00 PM most Friday nights. Special events may vary — check the Schedule tab.',
  },
  {
    title: 'Ticket Prices',
    body: 'Adults $15, Seniors (65+) $12, Kids 6-12 $8, 5 and under free. Season passes available at the ticket office.',
  },
  {
    title: 'Parking',
    body: 'General parking is free in the main lot. Pit parking requires a pit pass, available at the pit gate.',
  },
  {
    title: 'Pit Rules',
    body: 'Closed-toe shoes and a valid pit pass required in the pit area at all times. No minors under 12 in the pit area without a guardian.',
  },
];

export default function TrackInfoScreen() {
  return (
    <ScreenContainer>
      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <Text style={styles.title}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.textMuted },
});
