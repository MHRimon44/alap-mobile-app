import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { environment } from '../config/environment';
import type { RootState } from './store';
import { refreshSession } from '../services/auth/refreshCoordinator';
const rawBaseQuery = fetchBaseQuery({
  baseUrl: environment.apiBaseUrl,
  prepareHeaders(headers, { getState }) {
    const token = (getState() as RootState).session.accessToken;
    if (token !== null) headers.set('authorization', `Bearer ${token}`);
    headers.set('accept', 'application/json');
    return headers;
  },
});

const baseQueryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  queryApi,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, queryApi, extraOptions);
  const url = typeof args === 'string' ? args : args.url;
  const publicAuthRoutes = [
    '/v1/auth/login',
    '/v1/auth/register',
    '/v1/auth/refresh',
    '/v1/auth/password/forgot',
    '/v1/auth/password/reset',
  ];
  // Optional push endpoints must never invalidate a working session.
  const canRefresh = !publicAuthRoutes.includes(url) && !url.startsWith('/v1/devices');
  if (result.error?.status === 401 && canRefresh) {
    const pair = await refreshSession(queryApi.dispatch);
    if (pair !== null) result = await rawBaseQuery(args, queryApi, extraOptions);
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRefresh,
  endpoints: () => ({}),
  tagTypes: ['Conversation', 'Message', 'User'],
});
