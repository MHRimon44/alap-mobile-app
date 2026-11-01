import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteToken, getMessaging } from '@react-native-firebase/messaging';

const key = 'alap.push-token-reset-required';
let reset: Promise<void> | undefined;

async function finishReset(): Promise<void> {
  reset ??= (async () => {
    await deleteToken(getMessaging());
    await AsyncStorage.removeItem(key);
  })().finally(() => {
    reset = undefined;
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      reset,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('FCM_RESET_TIMEOUT')), 5000);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function resetPushTokenForLogout(): Promise<void> {
  // Keep a durable retry marker if Firebase is offline. Never reuse that token
  // for another account until invalidation succeeds.
  await AsyncStorage.setItem(key, 'required');
  await finishReset();
}

export async function ensurePushTokenPrivacy(): Promise<void> {
  if (reset || (await AsyncStorage.getItem(key))) await finishReset();
}
