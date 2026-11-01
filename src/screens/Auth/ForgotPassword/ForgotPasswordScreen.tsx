import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { z } from 'zod';
import { useForgotPasswordMutation } from '../../../services/api/authApi';
import { authErrorMessage } from '../../../utils/errorMessage';
import { AuthLayout } from '../../../components/AuthLayout/AuthLayout';
import { FormField } from '../../../components/FormField/FormField';
import { PrimaryButton } from '../../../components/Button/Button';
import { useToast } from '../../../components/Toast/ToastProvider';
import type { RootStackParamList } from '../../../navigation/types';
import { useAppTheme } from '../../../theme/ThemeProvider';

const schema = z.object({ email: z.email('Enter a valid email address.') });
type Values = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props): React.JSX.Element {
  const { showToast } = useToast();
  const { colors, typography } = useAppTheme();
  const [forgot, request] = useForgotPasswordMutation();
  const { control, handleSubmit } = useForm<Values>({
    defaultValues: { email: '' },
    resolver: zodResolver(schema),
  });

  const submit = handleSubmit(async (values) => {
    const email = values.email.trim().toLowerCase();
    try {
      await forgot({ email }).unwrap();
      showToast({
        type: 'success',
        title: 'Check your email',
        message: 'If the account exists, a 6-digit reset code has been sent.',
      });
      navigation.navigate('VerifyResetOtp', { email });
    } catch (error) {
      showToast({ type: 'error', title: 'Request failed', message: authErrorMessage(error) });
    }
  });

  return (
    <AuthLayout
      icon="lock-reset"
      subtitle="Enter your email and we’ll send a 6-digit code to reset your password."
      title="Forgot your password?"
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[typography.body, { color: colors.textMuted }]}>Remembered it? </Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
            <Text style={[typography.bodyMedium, { color: colors.primary }]}>Back to sign in</Text>
          </Pressable>
        </View>
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormField
            autoCapitalize="none"
            autoComplete="email"
            error={fieldState.error?.message}
            keyboardType="email-address"
            label="Email"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
      <PrimaryButton
        label="Send reset code"
        loading={request.isLoading}
        onPress={() => {
          void submit();
        }}
      />
    </AuthLayout>
  );
}
