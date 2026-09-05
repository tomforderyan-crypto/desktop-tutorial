import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, spacing, typography } from '../theme/theme';
import { getRaceDayWeather, type WeatherSnapshot } from '../api/weather';

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    let mounted = true;
    getRaceDayWeather().then((w) => {
      if (mounted) setWeather(w);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!weather) return null;

  return (
    <Card style={styles.card}>
      <View>
        <Text style={styles.label}>Race Day Weather</Text>
        <Text style={styles.temp}>{weather.tempF}°F</Text>
        <Text style={styles.condition}>{weather.condition}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.detailText}>💧 {weather.precipChancePct}% chance</Text>
        <Text style={styles.detailText}>💨 {weather.windMph} mph wind</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.label, color: colors.textMuted, marginBottom: 4 },
  temp: { ...typography.h1, color: colors.text },
  condition: { ...typography.body, color: colors.textMuted },
  details: { alignItems: 'flex-end', gap: 4 },
  detailText: { ...typography.small, color: colors.textMuted },
});
