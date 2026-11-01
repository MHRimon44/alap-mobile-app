jest.mock('./tokenPrivacy', () => ({
  resetPushTokenForLogout: jest.fn(),
  ensurePushTokenPrivacy: jest.fn(),
}));
import { appStore } from '../../store/store';
import { getPushDeviceMetadata } from '../auth/deviceMetadata';
import {
  registerPushToken,
  startDeviceRegistration,
  unregisterPushDevice,
} from './deviceRegistration';

jest.mock('../../store/store', () => ({ appStore: { getState: jest.fn(), dispatch: jest.fn() } }));
jest.mock('../api/deviceApi', () => ({
  deviceApi: {
    endpoints: {
      registerDevice: { initiate: (body: unknown) => ({ kind: 'register', body }) },
      unregisterDevice: { initiate: (id: string) => ({ kind: 'unregister', id }) },
    },
  },
}));
jest.mock('../auth/deviceMetadata', () => ({ getPushDeviceMetadata: jest.fn() }));
jest.mock('../../navigation/navigationRef', () => ({ clearPendingNotification: jest.fn() }));

beforeEach(() => {
  jest
    .mocked(appStore.getState)
    .mockReturnValue({ session: { user: { id: 'account-a' } } } as never);
  jest
    .mocked(getPushDeviceMetadata)
    .mockResolvedValue({ deviceId: 'installation', deviceName: 'Emulator', platform: 'android' });
  startDeviceRegistration();
});

test('unregister waits for in-flight registration then DELETE; later token events cannot recreate device', async () => {
  let finish: (() => void) | undefined;
  const inFlight = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const reset = jest.fn();
  jest
    .mocked(appStore.dispatch)
    .mockReturnValueOnce({ unwrap: () => inFlight, reset } as never)
    .mockReturnValueOnce({ unwrap: () => Promise.resolve(), reset } as never);
  const register = registerPushToken('test-token');
  await new Promise<void>((resolve) => setImmediate(resolve));
  const cleanup = unregisterPushDevice();
  expect(appStore.dispatch).toHaveBeenCalledTimes(1);
  finish?.();
  await Promise.all([register, cleanup]);
  expect(appStore.dispatch).toHaveBeenLastCalledWith({ kind: 'unregister', id: 'installation' });
  await registerPushToken('later-token');
  expect(appStore.dispatch).toHaveBeenCalledTimes(2);
  expect(reset).toHaveBeenCalledTimes(2);
});

test('device API failure is swallowed for registration and logout', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.mocked(appStore.dispatch).mockReturnValue({
    unwrap: () => Promise.reject(new Error('offline')),
    reset: jest.fn(),
  } as never);
  await expect(registerPushToken('test-token')).resolves.toBeUndefined();
  await expect(unregisterPushDevice()).resolves.toBeUndefined();
  warning.mockRestore();
});
