import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { AppBrand } from '../../components/AppBrand/AppBrand';
import { ChoicePills } from '../../components/Settings/ChoicePills';
import { ProfileSettingsCard } from '../../components/Settings/ProfileSettingsCard';
import { SettingsAction } from '../../components/Settings/SettingsAction';
import { SettingsRow } from '../../components/Settings/SettingsRow';
import { SettingsSection } from '../../components/Settings/SettingsSection';
import { Screen } from '../../components/Screen/Screen';
import { useToast } from '../../components/Toast/ToastProvider';
import type { RootStackParamList } from '../../navigation/types';
import { useLogoutAllMutation, useLogoutMutation } from '../../services/api/authApi';
import { unregisterPushDevice } from '../../services/notifications/deviceRegistration';
import { clearSession } from '../../services/auth/refreshCoordinator';
import { socketManager } from '../../services/realtime/socketManager';
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  type PresenceVisibility,
} from '../../services/api/profileApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAppTheme, type ThemePreference } from '../../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const sessionUser = useAppSelector((state) => state.session.user);
  const profile = useGetMyProfileQuery();
  const [updateProfile, update] = useUpdateMyProfileMutation();
  const [logout, logoutState] = useLogoutMutation();
  const [logoutAll, logoutAllState] = useLogoutAllMutation();
  const { preference, setPreference, spacing } = useAppTheme();
  const user = profile.data ?? sessionUser;


  const changeTheme = async (value: ThemePreference): Promise<void> => {
    try {
      await setPreference(value);
      showToast({ type: 'success', title: 'Theme updated', message: `Alap is using ${value} mode.` });
    } catch {
      showToast({ type: 'error', title: 'Theme update failed', message: 'Please try again.' });
    }
  };

  const changePresence = async (value: PresenceVisibility): Promise<void> => {
    try {
      await updateProfile({ presenceVisibility: value }).unwrap();
      void socketManager.emitWithAck('presence:visibilityChanged', {}).catch(() => undefined);
      showToast({ type: 'success', title: 'Privacy updated', message: `Online status visibility: ${value}.` });
    } catch {
      showToast({ type: 'error', title: 'Could not update privacy', message: 'Please try again.' });
    }
  };

  const signOut = async (allDevices: boolean): Promise<void> => {
    try {
      await unregisterPushDevice();
      if (allDevices) await logoutAll().unwrap();
      else await logout().unwrap();
    } catch {
      showToast({ type: 'warning', title: 'Signed out locally', message: 'The server could not confirm the logout.' });
    } finally {
      await clearSession(dispatch);
    }
  };

  const confirmLogoutAll = (): void => {
    Alert.alert(
      'Log out everywhere?',
      'You will be signed out from every device using this account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => void signOut(true) },
      ],
    );
  };

  return (
    <Screen
      mode="scroll"
      header={{ title: 'Settings', showBack: true }}
      contentStyle={{ gap: spacing.xl, paddingTop: spacing.md }}
      keyboardAvoiding={false}
    >
      <ProfileSettingsCard
        userId={user?.id}
        displayName={user?.displayName ?? 'Your profile'}
        username={user?.username}
        email={user?.email}
        onPress={() => navigation.navigate('MyProfile')}
      />

      <SettingsSection title="Appearance">
        <SettingsRow icon="theme-light-dark" title="Theme" subtitle="Choose how Alap looks" last>
          <ChoicePills<ThemePreference>
            options={['system', 'light', 'dark']}
            selected={preference}
            onSelect={(value) => void changeTheme(value)}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Privacy">
        <SettingsRow
          icon="eye-outline"
          title="Online status"
          subtitle="Who can see when you're online"
          last
        >
          <ChoicePills<PresenceVisibility>
            options={['everyone', 'contacts', 'nobody']}
            selected={profile.data?.presenceVisibility ?? 'everyone'}
            disabled={update.isLoading}
            onSelect={(value) => void changePresence(value)}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Chats">
        <SettingsAction
          icon="eye-off-outline"
          title="Hidden chats"
          onPress={() => navigation.navigate('HiddenChats')}
          last
        />
      </SettingsSection>

      <SettingsSection title="Account">
        <SettingsAction
          icon="lock-reset"
          title="Change password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <SettingsAction
          icon="logout"
          title="Log out"
          onPress={() => void signOut(false)}
          loading={logoutState.isLoading}
        />
        <SettingsAction
          icon="logout-variant"
          title="Log out on all devices"
          danger
          onPress={confirmLogoutAll}
          loading={logoutAllState.isLoading}
          last
        />
      </SettingsSection>

      <AppBrand size={28} showVersion horizontal={false} />
    </Screen>
  );
}
