import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';
import { myRacePass } from '../api/myRacePassClient';
import type { MpDriver } from '../api/types';
import type { MoreStackParamList } from '../navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<MoreStackParamList, 'Drivers'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DriverListScreen() {
  const navigation = useNavigation<Nav>();
  const [drivers, setDrivers] = useState<MpDriver[]>([]);

  useEffect(() => {
    myRacePass.getDrivers().then(setDrivers);
  }, []);

  return (
    <ScreenContainer>
      <SectionHeader title="Drivers" subtitle="Sourced from the same MyRacePass feed as standings" />
      {drivers.map((driver) => (
        <TouchableOpacity
          key={driver.driverId}
          onPress={() => navigation.navigate('DriverProfile', { driverId: driver.driverId })}
        >
          <Card style={styles.row}>
            {driver.photoUrl ? <Image source={{ uri: driver.photoUrl }} style={styles.photo} /> : null}
            <Text style={styles.name}>
              #{driver.carNumber} {driver.firstName} {driver.lastName}
            </Text>
            <Text style={styles.className}>{driver.className}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  photo: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt },
  name: { ...typography.h3, color: colors.text, flex: 1 },
  className: { ...typography.small, color: colors.textMuted },
});
