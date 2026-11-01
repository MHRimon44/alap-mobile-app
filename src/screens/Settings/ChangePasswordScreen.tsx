/* eslint-disable no-empty-pattern */
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { PrimaryButton } from '../../components/Button/Button';
import { FormField } from '../../components/FormField/FormField';
import { Screen } from '../../components/Screen/Screen';
import { useToast } from '../../components/Toast/ToastProvider';
import type { RootStackParamList } from '../../navigation/types';
import { useChangePasswordMutation } from '../../services/api/authApi';
import { unregisterPushDevice } from '../../services/notifications/deviceRegistration';
import { clearSession } from '../../services/auth/refreshCoordinator';
import { useAppDispatch } from '../../store/hooks';
import { useAppTheme } from '../../theme/ThemeProvider';
import { authErrorMessage } from '../../utils/errorMessage';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.').max(128),
    newPassword: z.string().min(6, 'Use at least 6 characters.').max(128),
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type Values = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({}: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { spacing } = useAppTheme();
  const [changePassword, request] = useChangePasswordMutation();
  const { control, handleSubmit } = useForm<Values>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    resolver: zodResolver(schema),
  });

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      await unregisterPushDevice();
      await clearSession(dispatch);
      showToast({
        type: 'success',
        title: 'Password changed',
        message: 'Your password was updated. Sign in again with the new password.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Could not change password',
        message: authErrorMessage(error),
      });
    }
  });

  return (
    <Screen
      mode="scroll"
      header={{ title: 'Change password', showBack: true }}
      contentStyle={{ gap: spacing.lg, paddingTop: spacing.lg }}
    >
      <Controller
        control={control}
        name="currentPassword"
        render={({ field, fieldState }) => (
          <FormField
            autoComplete="password"
            error={fieldState.error?.message}
            label="Current password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            showPasswordToggle
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="newPassword"
        render={({ field, fieldState }) => (
          <FormField
            autoComplete="new-password"
            error={fieldState.error?.message}
            label="New password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            showPasswordToggle
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <FormField
            autoComplete="new-password"
            error={fieldState.error?.message}
            label="Confirm new password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            showPasswordToggle
            value={field.value}
          />
        )}
      />
      <PrimaryButton
        label="Change password"
        loading={request.isLoading}
        onPress={() => void submit()}
      />
    </Screen>
  );
}
