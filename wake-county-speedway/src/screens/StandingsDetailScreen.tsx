import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';
import { myRacePass } from '../api/myRacePassClient';
import type { MpPointStandingEntry } from '../api/types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'StandingsDetail'>;

export default function StandingsDetailScreen({ route, navigation }: Props) {
  const { classId } = route.params;
  const [entries, setEntries] = useState<MpPointStandingEntry[]>([]);

  useEffect(() => {
    myRacePass.getPointStandings(classId).then(setEntries);
  }, [classId]);

  return (
    <ScreenContainer>
      {entries.map((entry) => (
        <TouchableOpacity
          key={entry.driverId}
          onPress={() => navigation.navigate('DriverProfile', { driverId: entry.driverId })}
        >
          <Card style={styles.row}>
            <Text style={styles.position}>{entry.position}</Text>
            {entry.photoUrl ? (
              <Image source={{ uri: entry.photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photo} />
            )}
            <View style={styles.info}>
              <Text style={styles.name}>
                {entry.driverName} <Text style={styles.carNumber}>#{entry.carNumber}</Text>
              </Text>
              <Text style={styles.stats}>
                {entry.wins} wins · {entry.top5} top-5s · {entry.starts} starts
              </Text>
            </View>
            <Text style={styles.points}>{entry.points}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  position: { ...typography.h3, color: colors.textMuted, width: 24 },
  photo: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt },
  info: { flex: 1 },
  name: { ...typography.h3, color: colors.text },
  carNumber: { color: colors.accent },
  stats: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  points: { ...typography.h2, color: colors.primary },
});
