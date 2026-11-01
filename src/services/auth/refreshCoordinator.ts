import type { AppDispatch } from '../../store/store';
import { credentialStore } from './credentialStore';
import { sessionRestored, signedIn, signedOut } from '../../store/slices/sessionSlice';
import { environment } from '../../config/environment';
import type { ApiEnvelope, TokenPair } from '../../@types/auth';

let refreshPromise: Promise<TokenPair | null> | null = null;

async function rotateStoredCredential(): Promise<TokenPair | null> {
  const refreshToken = await credentialStore.getRefreshToken();
  if (refreshToken === null) return null;

  const response = await fetch(`${environment.apiBaseUrl}/v1/auth/refresh`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return null;

  const envelope = (await response.json()) as ApiEnvelope<TokenPair>;
  await credentialStore.setRefreshToken(envelope.data.refreshToken);
  return envelope.data;
}

export async function refreshSession(dispatch: AppDispatch): Promise<TokenPair | null> {
  if (refreshPromise === null) {
    refreshPromise = (async () => {
      try {
        const pair = await rotateStoredCredential();
        if (pair === null) {
          await credentialStore.clearRefreshToken();
          dispatch(signedOut());
          return null;
        }
        dispatch(signedIn({ accessToken: pair.accessToken, user: pair.user }));
        return pair;
      } catch {
        await credentialStore.clearRefreshToken();
        dispatch(signedOut());
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function bootstrapSession(dispatch: AppDispatch): Promise<void> {
  const pair = await refreshSession(dispatch);
  if (pair === null) dispatch(sessionRestored(null));
}

export async function persistTokenPair(pair: TokenPair, dispatch: AppDispatch): Promise<void> {
  await credentialStore.setRefreshToken(pair.refreshToken);
  dispatch(signedIn({ accessToken: pair.accessToken, user: pair.user }));
}

export async function clearSession(dispatch: AppDispatch): Promise<void> {
  try {
    await credentialStore.clearRefreshToken();
  } finally {
    dispatch(signedOut());
  }
}
