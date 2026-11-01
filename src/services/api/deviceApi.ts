import { api } from '../../store/api';

export type RegisterDeviceRequest = {
  fcmToken: string;
  platform: 'android' | 'ios';
  deviceId: string;
  deviceName: string;
};

export type RegisteredDevice = {
  id: string;
  platform: 'android' | 'ios';
  deviceId: string;
  deviceName: string;
  createdAt: string;
  updatedAt: string;
};

export const deviceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    registerDevice: builder.mutation<{ data: RegisteredDevice }, RegisterDeviceRequest>({
      query: (body) => ({
        url: '/v1/devices',
        method: 'POST',
        timeout: 5000,
        body,
      }),
    }),

    unregisterDevice: builder.mutation<void, string>({
      query: (deviceId) => ({
        url: `/v1/devices/${encodeURIComponent(deviceId)}`,
        method: 'DELETE',
        timeout: 5000,
      }),
    }),
  }),
});

export const { useRegisterDeviceMutation, useUnregisterDeviceMutation } = deviceApi;
