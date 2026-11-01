import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getInstallationId } from './installationId';

import type { DeviceMetadata } from '../../@types/auth';

export function getDeviceMetadata(): DeviceMetadata {
  return {
    appVersion: DeviceInfo.getVersion(),
    deviceName: `${Platform.OS} device`,
    platform: Platform.OS === 'android' ? 'android' : 'ios',
  };
}

export async function getPushDeviceMetadata(): Promise<{
  deviceId: string;
  deviceName: string;
  platform: 'android' | 'ios';
}> {
  const deviceName = await DeviceInfo.getDeviceName();

  return {
    deviceId: await getInstallationId(),
    deviceName,
    platform: Platform.OS === 'android' ? 'android' : 'ios',
  };
}
