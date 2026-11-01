import { ensurePushTokenPrivacy } from './tokenPrivacy';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  getMessaging,
  getToken,
  requestPermission,
  AuthorizationStatus,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification as initialNotification,
  type RemoteMessage,
} from '@react-native-firebase/messaging';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      if (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)) {
        return true;
      }
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      return result === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  }

  const status = await requestPermission(getMessaging());

  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

export async function getFcmToken(): Promise<string | null> {
  try {
    await ensurePushTokenPrivacy();
    const token = await getToken(getMessaging());

    if (!token) {
      return null;
    }

    return token;
  } catch {
    console.warn('[FCM] Failed to get token');
    return null;
  }
}

export async function initializeNotifications(): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();

    if (!granted) {
      return null;
    }

    const token = await getFcmToken();

    return token;
  } catch {
    console.warn('[FCM] Initialization failed');
    return null;
  }
}

export function subscribeToTokenRefresh(
  callback: (token: string) => void | Promise<void>,
): () => void {
  return onTokenRefresh(getMessaging(), (token) => {
    void callback(token);
  });
}

export function subscribeToForegroundMessages(
  callback: (message: RemoteMessage) => void | Promise<void>,
): () => void {
  return onMessage(getMessaging(), (message) => {
    void callback(message);
  });
}

export function subscribeToNotificationOpened(
  callback: (message: RemoteMessage) => void,
): () => void {
  return onNotificationOpenedApp(getMessaging(), callback);
}

export async function getInitialNotification(): Promise<RemoteMessage | null> {
  return initialNotification(getMessaging());
}
