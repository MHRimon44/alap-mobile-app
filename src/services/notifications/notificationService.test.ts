jest.mock('./tokenPrivacy', () => ({
  resetPushTokenForLogout: jest.fn(),
  ensurePushTokenPrivacy: jest.fn(),
}));
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification as initialNotification,
} from '@react-native-firebase/messaging';
import {
  initializeNotifications,
  subscribeToTokenRefresh,
  subscribeToNotificationOpened,
  getInitialNotification,
} from './notificationService';
import { PermissionsAndroid } from 'react-native';

jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 36 },
  PermissionsAndroid: {
    check: jest.fn(),
    request: jest.fn(),
    PERMISSIONS: { POST_NOTIFICATIONS: 'notifications' },
    RESULTS: { GRANTED: 'granted' },
  },
}));
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(),
  onTokenRefresh: jest.fn(),
  onNotificationOpenedApp: jest.fn(),
  getInitialNotification: jest.fn(),
}));

test('permission denial never requests an FCM token or rejects initialization', async () => {
  jest.mocked(PermissionsAndroid.check).mockResolvedValue(false);
  jest.mocked(PermissionsAndroid.request).mockResolvedValue('denied');
  expect(await initializeNotifications()).toBeNull();
  expect(getToken).not.toHaveBeenCalled();
});

test('granted permission obtains a token; Firebase failures stay nonfatal', async () => {
  jest.mocked(PermissionsAndroid.check).mockResolvedValue(true);
  jest
    .mocked(getToken)
    .mockResolvedValueOnce('test-token')
    .mockRejectedValueOnce(new Error('offline'));
  expect(await initializeNotifications()).toBe('test-token');
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  expect(await initializeNotifications()).toBeNull();
  warning.mockRestore();
});

test('token refresh forwards new tokens and exposes listener cleanup', () => {
  const unsubscribe = jest.fn();
  jest.mocked(onTokenRefresh).mockReturnValue(unsubscribe);
  const callback = jest.fn();
  expect(subscribeToTokenRefresh(callback)).toBe(unsubscribe);
  jest.mocked(onTokenRefresh).mock.calls[0]![1]('rotated-token');
  expect(callback).toHaveBeenCalledWith('rotated-token');
  expect(getMessaging).toHaveBeenCalled();
});

test('background tap and initial notification use Firebase APIs', async () => {
  const callback = jest.fn();
  subscribeToNotificationOpened(callback);
  expect(onNotificationOpenedApp).toHaveBeenCalledWith(expect.anything(), callback);
  jest.mocked(initialNotification).mockResolvedValueOnce(null);
  expect(await getInitialNotification()).toBeNull();
});
