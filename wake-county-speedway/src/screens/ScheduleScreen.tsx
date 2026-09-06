import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';
import { myRacePass } from '../api/myRacePassClient';
import type { MpEvent } from '../api/types';

const statusLabel: Record<MpEvent['status'], string> = {
  scheduled: 'Scheduled',
  'rained-out': 'Rained Out',
  postponed: 'Postponed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function ScheduleScreen() {
  const [events, setEvents] = useState<MpEvent[]>([]);

  useEffect(() => {
    myRacePass.getSchedule().then(setEvents);
  }, []);

  return (
    <ScreenContainer>
      <SectionHeader title="Race Schedule" subtitle="Recurring weekly program, updated as the season changes" />
      {events.map((event) => {
        const date = new Date(event.eventDateIso);
        const isRainedOut = event.status === 'rained-out' || event.status === 'postponed';
        return (
          <Card key={event.eventId} style={styles.card}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{date.toLocaleDateString(undefined, { day: '2-digit' })}</Text>
              <Text style={styles.dateMonth}>{date.toLocaleDateString(undefined, { month: 'short' })}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.eventName}>{event.eventName}</Text>
              <Text style={styles.meta}>
                Gates {event.gatesOpen} · Racing {event.raceTime}
              </Text>
              {isRainedOut ? <Text style={styles.rainedOut}>{statusLabel[event.status]}</Text> : null}
            </View>
          </Card>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md },
  dateBox: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: spacing.sm,
  },
  dateDay: { ...typography.h2, color: colors.text },
  dateMonth: { ...typography.label, color: colors.textMuted },
  info: { flex: 1, justifyContent: 'center' },
  eventName: { ...typography.h3, color: colors.text },
  meta: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  rainedOut: { ...typography.label, color: colors.danger, marginTop: 4 },
});
