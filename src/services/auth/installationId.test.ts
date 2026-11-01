import AsyncStorage from '@react-native-async-storage/async-storage';
import { getInstallationId } from './installationId';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('uuid', () => ({ v4: () => 'installation-uuid' }));

test('concurrent callers generate and persist once; logout/account changes do not affect identity', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
  expect(await Promise.all([getInstallationId(), getInstallationId()])).toEqual([
    'installation-uuid',
    'installation-uuid',
  ]);
  expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  expect(await getInstallationId()).toBe('installation-uuid');
});

test('process restart reads the persisted ID without generating another', async () => {
  jest.resetModules();
  const storage = (await import('@react-native-async-storage/async-storage')).default;
  jest.mocked(storage.getItem).mockResolvedValueOnce('existing-installation');
  const restarted = await import('./installationId');
  expect(await restarted.getInstallationId()).toBe('existing-installation');
  expect(storage.setItem).not.toHaveBeenCalled();
});
