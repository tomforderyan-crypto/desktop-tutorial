import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Card } from '../components/Card';
import { colors, radii, spacing, typography } from '../theme/theme';
import { registerForPushNotifications } from '../services/notifications';

export default function SettingsScreen() {
  const [status, setStatus] = useState<'idle' | 'enabled' | 'denied'>('idle');

  async function handleEnable() {
    const result = await registerForPushNotifications();
    setStatus(result.granted ? 'enabled' : 'denied');
  }

  return (
    <ScreenContainer>
      <Card>
        <Text style={styles.title}>Rainout & Schedule Alerts</Text>
        <Text style={styles.body}>
          Get a push notification the moment a race night is rained out, postponed, or rescheduled.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleEnable}>
          <Text style={styles.buttonText}>
            {status === 'enabled' ? 'Notifications Enabled ✓' : 'Enable Notifications'}
          </Text>
        </TouchableOpacity>
        {status === 'denied' ? (
          <Text style={styles.denied}>
            Notifications are turned off for this app in iOS Settings. Enable them there to get alerts.
          </Text>
        ) : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: 'center' },
  buttonText: { ...typography.h3, color: '#fff' },
  denied: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
});
