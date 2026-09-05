import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';
import { myRacePass } from '../api/myRacePassClient';
import type { MpClass } from '../api/types';
import type { RootStackParamList } from '../navigation/types';

export default function StandingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [classes, setClasses] = useState<MpClass[]>([]);

  useEffect(() => {
    myRacePass.getClasses().then((c) => setClasses(c.sort((a, b) => a.sortOrder - b.sortOrder)));
  }, []);

  return (
    <ScreenContainer>
      <SectionHeader
        title="Point Standings"
        subtitle="Updates automatically from MyRacePass as results are posted"
      />
      {classes.map((c) => (
        <TouchableOpacity
          key={c.classId}
          onPress={() => navigation.navigate('StandingsDetail', { classId: c.classId, className: c.className })}
        >
          <Card style={styles.row}>
            <Text style={styles.className}>{c.className}</Text>
            <Text style={styles.chevron}>›</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  className: { ...typography.h3, color: colors.text },
  chevron: { ...typography.h2, color: colors.textMuted },
});
