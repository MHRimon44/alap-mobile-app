import { resetPushTokenForLogout } from './tokenPrivacy';
import { appStore } from '../../store/store';
import { deviceApi } from '../api/deviceApi';
import { getPushDeviceMetadata } from '../auth/deviceMetadata';
import { clearPendingNotification } from '../../navigation/navigationRef';

let generation = 0;
let paused = false;
let work: Promise<void> = Promise.resolve();

export function startDeviceRegistration(): void {
  generation += 1;
  paused = false;
}

export function stopDeviceRegistration(): void {
  generation += 1;
  paused = true;
}

export function registerPushToken(token: string): Promise<void> {
  const expected = generation;
  const userId = appStore.getState().session.user?.id;
  const task = work.then(async () => {
    const metadata = await getPushDeviceMetadata();
    if (
      paused ||
      expected !== generation ||
      !userId ||
      appStore.getState().session.user?.id !== userId
    )
      return;
    const request = appStore.dispatch(
      deviceApi.endpoints.registerDevice.initiate({
        ...metadata,
        fcmToken: token,
      }),
    );
    try {
      await request.unwrap();
    } finally {
      request.reset();
    }
  });
  work = task.catch(() => {
    console.warn('[FCM] Device registration failed');
  });
  return work;
}

export async function unregisterPushDevice(): Promise<void> {
  stopDeviceRegistration();
  clearPendingNotification();
  try {
    // Complete any older POST before DELETE, so it cannot recreate the device afterward.
    await work;
    const { deviceId } = await getPushDeviceMetadata();
    const request = appStore.dispatch(deviceApi.endpoints.unregisterDevice.initiate(deviceId));
    try {
      await request.unwrap();
    } finally {
      request.reset();
    }
  } catch {
    console.warn('[FCM] Device unregister failed; continuing logout');
  } finally {
    try {
      await resetPushTokenForLogout();
    } catch {
      console.warn('[FCM] Token reset pending; continuing logout');
    }
  }
}
