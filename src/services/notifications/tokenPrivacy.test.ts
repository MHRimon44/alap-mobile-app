import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteToken } from '@react-native-firebase/messaging';
import { ensurePushTokenPrivacy, resetPushTokenForLogout } from './tokenPrivacy';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: () => ({}),
  deleteToken: jest.fn(),
}));

test('logout marks token invalid before deleting it; successful reset removes retry marker', async () => {
  await resetPushTokenForLogout();
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('alap.push-token-reset-required', 'required');
  expect(deleteToken).toHaveBeenCalledTimes(1);
  expect(AsyncStorage.removeItem).toHaveBeenCalledWith('alap.push-token-reset-required');
  expect(jest.mocked(AsyncStorage.setItem).mock.invocationCallOrder[0]).toBeLessThan(
    jest.mocked(deleteToken).mock.invocationCallOrder[0]!,
  );
});

test('failed invalidation keeps marker and next initialization retries before obtaining another token', async () => {
  jest.mocked(deleteToken).mockRejectedValueOnce(new Error('offline'));
  await expect(resetPushTokenForLogout()).rejects.toThrow('offline');
  expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('required');
  await ensurePushTokenPrivacy();
  expect(deleteToken).toHaveBeenCalledTimes(2);
  expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
});
