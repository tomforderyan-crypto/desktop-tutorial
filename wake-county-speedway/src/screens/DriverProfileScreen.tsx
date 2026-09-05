import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';
import { myRacePass } from '../api/myRacePassClient';
import type { MpDriver } from '../api/types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverProfile'>;

export default function DriverProfileScreen({ route }: Props) {
  const { driverId } = route.params;
  const [driver, setDriver] = useState<MpDriver | null>(null);

  useEffect(() => {
    myRacePass.getDriver(driverId).then((d) => setDriver(d ?? null));
  }, [driverId]);

  if (!driver) {
    return (
      <ScreenContainer>
        <Text style={{ color: colors.textMuted }}>Loading driver…</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {driver.photoUrl ? <Image source={{ uri: driver.photoUrl }} style={styles.photo} /> : null}
      <Text style={styles.name}>
        {driver.firstName} {driver.lastName}
      </Text>
      <Text style={styles.meta}>
        #{driver.carNumber} · {driver.className}
        {driver.hometown ? ` · ${driver.hometown}` : ''}
      </Text>

      {driver.carPhotoUrl ? <Image source={{ uri: driver.carPhotoUrl }} style={styles.carPhoto} /> : null}

      {driver.bio ? (
        <Card>
          <Text style={styles.bio}>{driver.bio}</Text>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  photo: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: spacing.md },
  name: { ...typography.h1, color: colors.text, textAlign: 'center' },
  meta: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: spacing.md },
  carPhoto: { width: '100%', height: 180, borderRadius: 12, marginBottom: spacing.md },
  bio: { ...typography.body, color: colors.text },
});
