import {
  navigationRef,
  openChatFromNotification,
  flushPendingNotification,
  setNotificationNavigationAuthenticated,
  clearPendingNotification,
} from './navigationRef';

jest.mock('@react-navigation/native', () => ({
  createNavigationContainerRef: () => ({
    isReady: jest.fn(),
    getRootState: jest.fn(),
    getCurrentRoute: jest.fn(),
    navigate: jest.fn(),
  }),
}));
const payload = {
  type: 'CHAT_MESSAGE',
  conversationId: 'conversation',
  senderId: 'sender',
  senderName: 'Sender',
};
beforeEach(() => {
  clearPendingNotification();
  setNotificationNavigationAuthenticated(false);
  jest.mocked(navigationRef.isReady).mockReturnValue(false);
});

test('cold-start tap waits for authentication, container, and Chat route', () => {
  openChatFromNotification(payload);
  expect(navigationRef.navigate).not.toHaveBeenCalled();
  setNotificationNavigationAuthenticated(true);
  jest.mocked(navigationRef.isReady).mockReturnValue(true);
  jest.mocked(navigationRef.getRootState).mockReturnValue({ routeNames: ['Login'] } as never);
  flushPendingNotification();
  expect(navigationRef.navigate).not.toHaveBeenCalled();
  jest.mocked(navigationRef.getRootState).mockReturnValue({ routeNames: ['Chat'] } as never);
  flushPendingNotification();
  expect(navigationRef.navigate).toHaveBeenCalledWith('Chat', {
    conversationId: 'conversation',
    counterpartId: 'sender',
    title: 'Sender',
  });
  flushPendingNotification();
  expect(navigationRef.navigate).toHaveBeenCalledTimes(1);
});

test('logout discards pending taps and malformed payloads are ignored', () => {
  openChatFromNotification(payload);
  clearPendingNotification();
  openChatFromNotification({ ...payload, conversationId: '' });
  jest.mocked(navigationRef.isReady).mockReturnValue(true);
  jest.mocked(navigationRef.getRootState).mockReturnValue({ routeNames: ['Chat'] } as never);
  setNotificationNavigationAuthenticated(true);
  expect(navigationRef.navigate).not.toHaveBeenCalled();
});
