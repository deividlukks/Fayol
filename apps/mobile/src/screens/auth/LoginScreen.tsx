import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Button, TextInput, HelperText, useTheme, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { loginSchema } from '@fayol/validation-schemas';
import type { LoginInput } from '@fayol/validation-schemas';
import { useAuth } from '../../hooks/useAuth';
import { useBiometric } from '../../contexts/BiometricContext';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const theme = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isLoading } = useAuth();
  const {
    isAvailable: biometricAvailable,
    isEnabled: biometricEnabled,
    biometricType,
    enableBiometric,
    authenticate,
    getStoredCredentials,
  } = useBiometric();

  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Validate form data using Zod schema
   */
  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const validationErrors: { email?: string; password?: string } = {};

      error.errors?.forEach((err: any) => {
        const field = err.path[0] as keyof typeof validationErrors;
        validationErrors[field] = err.message;
      });

      setErrors(validationErrors);
      return false;
    }
  };

  /**
   * Handle login submission
   */
  const handleLogin = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);

      // Offer biometric setup after successful login
      await offerBiometricSetup();

      // Navigation will be handled automatically by RootNavigator when isAuthenticated changes
    } catch (error: any) {
      console.error('[LoginScreen] Login failed:', error);

      Alert.alert(
        'Erro no Login',
        error?.message ||
          'Não foi possível fazer login. Verifique suas credenciais e tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Navigate to Register screen
   */
  const handleNavigateToRegister = () => {
    navigation.navigate('Register');
  };

  /**
   * Handle biometric login
   */
  const handleBiometricLogin = async () => {
    try {
      if (!biometricAvailable || !biometricEnabled) {
        Alert.alert(
          'Biometria Não Configurada',
          'Configure a biometria nas configurações ou faça login com email e senha.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get stored credentials (will authenticate biometric automatically)
      const credentials = await getStoredCredentials();

      if (!credentials) {
        Alert.alert(
          'Falha na Autenticação',
          'Não foi possível autenticar ou recuperar credenciais.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Login with stored credentials
      await login({
        email: credentials.email,
        password: credentials.password,
      });
    } catch (error: any) {
      console.error('[LoginScreen] Biometric login error:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível autenticar com biometria.', [
        { text: 'OK' },
      ]);
    }
  };

  /**
   * Offer to enable biometric after successful login
   */
  const offerBiometricSetup = async () => {
    // Only offer if available but not yet enabled
    if (biometricAvailable && !biometricEnabled) {
      Alert.alert(
        `Habilitar ${biometricType}?`,
        `Deseja usar ${biometricType} para fazer login mais rapidamente na próxima vez?`,
        [
          {
            text: 'Agora Não',
            style: 'cancel',
          },
          {
            text: 'Habilitar',
            onPress: async () => {
              try {
                const success = await enableBiometric(formData.email, formData.password);

                if (success) {
                  Alert.alert('Sucesso!', `${biometricType} habilitada com sucesso!`, [
                    { text: 'OK' },
                  ]);
                } else {
                  Alert.alert('Erro', 'Não foi possível habilitar a biometria.', [{ text: 'OK' }]);
                }
              } catch (error) {
                console.error('[LoginScreen] Error enabling biometric:', error);
                Alert.alert('Erro', 'Não foi possível habilitar a biometria.', [{ text: 'OK' }]);
              }
            },
          },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
              Fayol
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              Gestão Financeira Pessoal
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email/Phone Input */}
            <TextInput
              label="Email ou Telefone"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              error={!!errors.email}
              disabled={isLoading}
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
            />
            {errors.email && (
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>
            )}

            {/* Password Input */}
            <TextInput
              label="Senha"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              mode="outlined"
              secureTextEntry={!showPassword}
              textContentType="password"
              autoComplete="password"
              error={!!errors.password}
              disabled={isLoading}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              onSubmitEditing={handleLogin}
            />
            {errors.password && (
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>
            )}

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            {/* Biometric Login Button */}
            {biometricAvailable && biometricEnabled && (
              <View style={styles.biometricContainer}>
                <Text variant="bodySmall" style={styles.orText}>
                  ou
                </Text>
                <IconButton
                  icon="fingerprint"
                  size={48}
                  iconColor={theme.colors.primary}
                  onPress={handleBiometricLogin}
                  disabled={isLoading}
                  style={styles.biometricButton}
                />
                <Text variant="labelSmall" style={styles.biometricText}>
                  Entrar com {biometricType}
                </Text>
              </View>
            )}

            {/* Forgot Password Link */}
            <Button
              mode="text"
              onPress={() => console.log('Forgot password')}
              disabled={isLoading}
              style={styles.forgotButton}
            >
              Esqueci minha senha
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Ainda não tem uma conta?
            </Text>
            <Button
              mode="outlined"
              onPress={handleNavigateToRegister}
              disabled={isLoading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
            >
              Criar Conta
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  form: {
    flex: 1,
  },
  input: {
    marginTop: 12,
  },
  loginButton: {
    marginTop: 24,
  },
  biometricContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  orText: {
    opacity: 0.5,
    marginBottom: 8,
  },
  biometricButton: {
    marginVertical: 4,
  },
  biometricText: {
    opacity: 0.7,
    marginTop: 4,
  },
  forgotButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  footerText: {
    marginBottom: 12,
    opacity: 0.7,
  },
  registerButton: {
    width: '100%',
  },
});
