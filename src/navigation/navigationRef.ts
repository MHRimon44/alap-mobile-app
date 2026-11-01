import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
let authenticated = false;
let pending: RootStackParamList['Chat'] | undefined;

export function setNotificationNavigationAuthenticated(value: boolean): void {
  authenticated = value;
  flushPendingNotification();
}

export function clearPendingNotification(): void {
  pending = undefined;
}

export function flushPendingNotification(): void {
  if (!authenticated || !pending || !navigationRef.isReady()) return;
  // Container readiness alone does not guarantee the authenticated stack exists.
  if (!navigationRef.getRootState()?.routeNames.includes('Chat')) return;
  const params = pending;
  pending = undefined;
  const current = navigationRef.getCurrentRoute();
  if (
    current?.name === 'Chat' &&
    current.params &&
    'conversationId' in current.params &&
    current.params.conversationId === params.conversationId
  )
    return;
  navigationRef.navigate('Chat', params);
}

export function openChatFromNotification(data?: { [key: string]: string | object }): void {
  if (
    data?.type !== 'CHAT_MESSAGE' ||
    typeof data.conversationId !== 'string' ||
    !data.conversationId.trim() ||
    typeof data.senderId !== 'string' ||
    !data.senderId.trim()
  )
    return;
  pending = {
    conversationId: data.conversationId,
    counterpartId: data.senderId,
    title: typeof data.senderName === 'string' ? data.senderName : 'Chat',
  };
  flushPendingNotification();
}
