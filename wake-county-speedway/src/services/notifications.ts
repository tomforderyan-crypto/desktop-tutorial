import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushRegistration {
  granted: boolean;
  expoPushToken: string | null;
}

/**
 * Registers this device for rainout / schedule-change pushes and returns an
 * Expo push token. In production, POST that token (plus a topic like
 * "wake-county-speedway") to your backend's device registry so staff can
 * target it. Sending is then a single Expo Push API call per notification —
 * see docs/PUSH_NOTIFICATIONS.md for the minimal staff-side flow, no
 * dedicated admin app required.
 */
export async function registerForPushNotifications(): Promise<PushRegistration> {
  if (Platform.OS !== 'ios') {
    return { granted: false, expoPushToken: null };
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;
  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    return { granted: false, expoPushToken: null };
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  return { granted: true, expoPushToken: tokenResponse.data };
}
