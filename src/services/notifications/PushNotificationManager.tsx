import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import {
  openChatFromNotification,
  clearPendingNotification,
  setNotificationNavigationAuthenticated,
} from '../../navigation/navigationRef';
import {
  getInitialNotification,
  initializeNotifications,
  subscribeToForegroundMessages,
  subscribeToNotificationOpened,
  subscribeToTokenRefresh,
} from './notificationService';
import {
  registerPushToken,
  startDeviceRegistration,
  stopDeviceRegistration,
} from './deviceRegistration';

export function PushNotificationManager(): null {
  const status = useAppSelector((state) => state.session.status);
  const userId = useAppSelector((state) => state.session.user?.id);

  useEffect(() => {
    setNotificationNavigationAuthenticated(status === 'authenticated');
    return () => {
      if (status === 'authenticated') clearPendingNotification();
    };
  }, [status]);

  // Capture cold-start taps even while session restoration is in progress.
  useEffect(() => {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
    const cleanups: (() => void)[] = [];
    let cancelled = false;
    try {
      cleanups.push(
        subscribeToNotificationOpened((message) => {
          openChatFromNotification(message.data);
        }),
      );
      cleanups.push(
        subscribeToForegroundMessages(() => {
          // Socket.IO remains authoritative; do not display duplicate notifications.
        }),
      );
      void getInitialNotification()
        .then((message) => {
          if (!cancelled && message) openChatFromNotification(message.data);
        })
        .catch(() => console.warn('[FCM] Initial notification unavailable'));
    } catch {
      console.warn('[FCM] Notification listeners unavailable');
    }
    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || !userId) return;
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
    startDeviceRegistration();
    let cancelled = false;
    let permitted = false;
    let initializing = false;
    const cleanups: (() => void)[] = [];
    const initialize = async (): Promise<void> => {
      if (initializing) return;
      initializing = true;
      try {
        const token = await initializeNotifications();
        permitted = token !== null;
        if (!cancelled && token) await registerPushToken(token);
      } finally {
        initializing = false;
      }
    };
    try {
      cleanups.push(
        subscribeToTokenRefresh((token) => {
          if (cancelled) return;
          if (permitted) void registerPushToken(token);
          else void initialize();
        }),
      );
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') void initialize();
      });
      cleanups.push(() => subscription.remove());
      void initialize();
    } catch {
      console.warn('[FCM] Token listener unavailable');
    }
    return () => {
      cancelled = true;
      stopDeviceRegistration();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [status, userId]);
  return null;
}
