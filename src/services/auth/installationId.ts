import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuid } from 'uuid';

const key = 'alap.installation-id';
let installationId: Promise<string> | undefined;

export function getInstallationId(): Promise<string> {
  installationId ??= (async () => {
    const saved = await AsyncStorage.getItem(key);
    if (saved) return saved;
    const created = uuid();
    await AsyncStorage.setItem(key, created);
    return created;
  })().catch((error: unknown) => {
    installationId = undefined;
    throw error;
  });
  return installationId;
}
