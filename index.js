/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

import 'react-native-get-random-values';

import App from './App';
import { name as appName } from './app.json';

try {
  setBackgroundMessageHandler(getMessaging(), async () => {
    // Android displays notification payloads; Socket.IO handles chat synchronization.
  });
} catch {
  console.warn('[FCM] Background handler unavailable');
}

AppRegistry.registerComponent(appName, () => App);
