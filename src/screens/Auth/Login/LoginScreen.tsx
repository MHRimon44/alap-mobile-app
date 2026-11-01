import { authFeatures } from '../../../config/authFeatures';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { z } from 'zod';
import { authErrorMessage } from '../../../utils/errorMessage';
import { persistTokenPair } from '../../../services/auth/refreshCoordinator';
import { useLoginMutation } from '../../../services/api/authApi';
import { AuthLayout } from '../../../components/AuthLayout/AuthLayout';
import { FormField } from '../../../components/FormField/FormField';
import { PrimaryButton } from '../../../components/Button/Button';
import { useToast } from '../../../components/Toast/ToastProvider';
import type { RootStackParamList } from '../../../navigation/types';
import { useAppDispatch } from '../../../store/hooks';
import { useAppTheme } from '../../../theme/ThemeProvider';

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.').max(128),
});
type Values = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { colors, spacing, typography } = useAppTheme();
  const [login, request] = useLoginMutation();
  const { control, handleSubmit } = useForm<Values>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(schema),
  });
  const submit = handleSubmit(async (values) => {
    try {
      const pair = await login(values).unwrap();
      showToast({ type: 'success', title: 'Welcome back', message: 'Signed in successfully.' });
      await persistTokenPair(pair, dispatch);
    } catch (error) {
      showToast({ type: 'error', title: 'Login failed', message: authErrorMessage(error) });
    }
  });
  return (
    <AuthLayout
      icon="message-text-outline"
      subtitle="Sign in to continue your conversations and pick up where you left off."
      title="Welcome back"
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[typography.body, { color: colors.textMuted }]}>New to আলাপ? </Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Register')}>
            <Text style={[typography.bodyMedium, { color: colors.primary }]}>Create account</Text>
          </Pressable>
        </View>
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormField
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
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <FormField
            autoComplete="password"
            error={fieldState.error?.message}
            label="Password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            showPasswordToggle
            value={field.value}
          />
        )}
      />
      <PrimaryButton
        label="Log in"
        loading={request.isLoading}
        onPress={() => {
          void submit();
        }}
      />
      {authFeatures.forgotPasswordEnabled && (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('ForgotPassword')}
          style={{ alignSelf: 'flex-end', paddingVertical: spacing.xs }}
        >
          <Text style={[typography.label, { color: colors.primary }]}>Forgot password?</Text>
        </Pressable>
      )}
    </AuthLayout>
  );
}
