import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Button, TextInput, HelperText, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { registerSchema } from '@fayol/validation-schemas';
import type { RegisterInput } from '@fayol/validation-schemas';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState<RegisterInput>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Format phone number as user types
   * Format: (XX) XXXXX-XXXX
   */
  const formatPhone = (text: string): string => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');

    // Format based on length
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    // Limit to 11 digits
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  /**
   * Handle phone input change with formatting
   */
  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setFormData({ ...formData, phone: formatted });
  };

  /**
   * Validate form data using Zod schema
   */
  const validateForm = (): boolean => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const validationErrors: {
        name?: string;
        email?: string;
        phone?: string;
        password?: string;
        confirmPassword?: string;
      } = {};

      error.errors?.forEach((err: any) => {
        const field = err.path[0] as keyof typeof validationErrors;
        validationErrors[field] = err.message;
      });

      setErrors(validationErrors);
      return false;
    }
  };

  /**
   * Handle registration submission
   */
  const handleRegister = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);

      // Show success message
      Alert.alert('Conta Criada com Sucesso!', 'Sua conta foi criada. Faça login para continuar.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error: any) {
      console.error('[RegisterScreen] Registration failed:', error);

      Alert.alert(
        'Erro no Cadastro',
        error?.message || 'Não foi possível criar sua conta. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Navigate back to Login screen
   */
  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
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
            <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.primary }]}>
              Criar Conta
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Preencha os dados abaixo para começar
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <TextInput
              label="Nome Completo"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              error={!!errors.name}
              disabled={isLoading}
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
            />
            {errors.name && (
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>
            )}

            {/* Email Input */}
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              error={!!errors.email}
              disabled={isLoading}
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
            />
            {errors.email && (
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>
            )}

            {/* Phone Input */}
            <TextInput
              label="Telefone (opcional)"
              value={formData.phone}
              onChangeText={handlePhoneChange}
              mode="outlined"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              error={!!errors.phone}
              disabled={isLoading}
              left={<TextInput.Icon icon="phone" />}
              placeholder="(XX) XXXXX-XXXX"
              style={styles.input}
            />
            {errors.phone && (
              <HelperText type="error" visible={!!errors.phone}>
                {errors.phone}
              </HelperText>
            )}

            {/* Password Input */}
            <TextInput
              label="Senha"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              mode="outlined"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoComplete="password-new"
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
            />
            {errors.password && (
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>
            )}
            <HelperText type="info" visible={!errors.password}>
              Mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial
            </HelperText>

            {/* Confirm Password Input */}
            <TextInput
              label="Confirmar Senha"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              textContentType="newPassword"
              autoComplete="password-new"
              error={!!errors.confirmPassword}
              disabled={isLoading}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              style={styles.input}
              onSubmitEditing={handleRegister}
            />
            {errors.confirmPassword && (
              <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword}
              </HelperText>
            )}

            {/* Register Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Já tem uma conta?
            </Text>
            <Button
              mode="text"
              onPress={handleNavigateToLogin}
              disabled={isLoading}
              style={styles.loginButton}
            >
              Fazer Login
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
    marginTop: 40,
    marginBottom: 24,
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
  registerButton: {
    marginTop: 24,
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
    marginBottom: 8,
    opacity: 0.7,
  },
  loginButton: {
    marginTop: 4,
  },
});
