import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Switch,
  Button,
  Card,
  List,
  Divider,
  useTheme,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { useBiometric } from '../../contexts/BiometricContext';

/**
 * BiometricSetupScreen
 *
 * Tela para configurar autenticação biométrica
 *
 * Features:
 * - Toggle para ativar/desativar biometria
 * - Informações sobre segurança
 * - Teste de biometria
 * - Instruções de configuração
 */

export default function BiometricSetupScreen() {
  const theme = useTheme();
  const {
    isAvailable,
    isEnabled,
    isLoading,
    biometricType,
    biometricTypes,
    enableBiometric: enableBiometricContext,
    disableBiometric,
    authenticate,
  } = useBiometric();

  const [testingBiometric, setTestingBiometric] = useState(false);

  /**
   * Handle toggle biometric
   */
  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      // Enable biometric
      Alert.alert(
        `Habilitar ${biometricType}?`,
        `Para usar ${biometricType}, você precisará fazer login com email e senha uma vez.`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Continuar',
            onPress: () => {
              Alert.alert(
                'Ação Necessária',
                'Faça logout e login novamente com email e senha. Você será perguntado se deseja habilitar a biometria.',
                [{ text: 'OK' }]
              );
            },
          },
        ]
      );
    } else {
      // Disable biometric
      Alert.alert('Desabilitar Biometria?', `Você precisará usar email e senha para fazer login.`, [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desabilitar',
          style: 'destructive',
          onPress: async () => {
            const success = await disableBiometric();
            if (success) {
              Alert.alert('Sucesso', 'Biometria desabilitada com sucesso.', [{ text: 'OK' }]);
            } else {
              Alert.alert('Erro', 'Não foi possível desabilitar a biometria.', [{ text: 'OK' }]);
            }
          },
        },
      ]);
    }
  };

  /**
   * Test biometric authentication
   */
  const handleTestBiometric = async () => {
    setTestingBiometric(true);
    try {
      const result = await authenticate(`Teste sua ${biometricType}`);

      if (result.success) {
        Alert.alert('Sucesso!', `${biometricType} funcionou perfeitamente!`, [{ text: 'OK' }]);
      } else {
        Alert.alert('Falha', result.error || 'Autenticação biométrica falhou.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('[BiometricSetupScreen] Test error:', error);
      Alert.alert('Erro', 'Não foi possível testar a biometria.', [{ text: 'OK' }]);
    } finally {
      setTestingBiometric(false);
    }
  };

  /**
   * Render biometric type info
   */
  const renderBiometricTypeInfo = () => {
    if (!biometricTypes) return null;

    const types: string[] = [];
    if (biometricTypes.faceId) types.push('Face ID');
    if (biometricTypes.touchId || biometricTypes.fingerprint) types.push('Impressão Digital');
    if (biometricTypes.iris) types.push('Reconhecimento de Íris');

    return (
      <Text variant="bodyMedium" style={styles.infoText}>
        Tipos disponíveis: {types.join(', ')}
      </Text>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Verificando biometria...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.header}>
            <IconButton
              icon={
                biometricTypes?.faceId
                  ? 'face-recognition'
                  : biometricTypes?.fingerprint
                    ? 'fingerprint'
                    : 'shield-lock'
              }
              size={48}
              iconColor={isAvailable ? theme.colors.primary : theme.colors.outline}
            />
            <Text variant="headlineSmall" style={styles.title}>
              Autenticação Biométrica
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Availability Status */}
      {!isAvailable ? (
        <Card style={[styles.card, styles.errorCard]} mode="elevated">
          <Card.Content>
            <List.Item
              title="Biometria Não Disponível"
              description="Seu dispositivo não suporta biometria ou você não configurou nenhuma biometria nas configurações do sistema."
              left={(props) => (
                <List.Icon {...props} icon="alert-circle" color={theme.colors.error} />
              )}
            />
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.helpText}>
              Como configurar:
            </Text>
            <Text variant="bodySmall" style={styles.helpText}>
              • iOS: Ajustes → Face ID e Código / Touch ID e Código
            </Text>
            <Text variant="bodySmall" style={styles.helpText}>
              • Android: Configurações → Segurança → Biometria
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <>
          {/* Configuration Card */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <List.Item
                title={`Usar ${biometricType} para Login`}
                description={
                  isEnabled ? 'Login rápido habilitado' : 'Faça login mais rápido com sua biometria'
                }
                left={(props) => (
                  <List.Icon {...props} icon="fingerprint" color={theme.colors.primary} />
                )}
                right={() => (
                  <Switch
                    value={isEnabled}
                    onValueChange={handleToggleBiometric}
                    disabled={isLoading}
                  />
                )}
              />

              {isEnabled && (
                <>
                  <Divider style={styles.divider} />
                  <Button
                    mode="outlined"
                    onPress={handleTestBiometric}
                    loading={testingBiometric}
                    disabled={testingBiometric}
                    style={styles.testButton}
                    icon="test-tube"
                  >
                    Testar {biometricType}
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>

          {/* Information Card */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Informações de Segurança
              </Text>

              <List.Item
                title="Criptografia de Ponta a Ponta"
                description="Suas credenciais são armazenadas de forma segura usando criptografia nativa do sistema."
                left={(props) => <List.Icon {...props} icon="lock" />}
                titleNumberOfLines={2}
                descriptionNumberOfLines={3}
              />

              <Divider style={styles.divider} />

              <List.Item
                title="Privacidade Garantida"
                description="Seus dados biométricos nunca saem do dispositivo. Apenas você tem acesso."
                left={(props) => <List.Icon {...props} icon="shield-check" />}
                titleNumberOfLines={2}
                descriptionNumberOfLines={3}
              />

              <Divider style={styles.divider} />

              <List.Item
                title="Fallback para Senha"
                description="Se a biometria falhar, você sempre pode usar sua senha."
                left={(props) => <List.Icon {...props} icon="account-key" />}
                titleNumberOfLines={2}
                descriptionNumberOfLines={3}
              />
            </Card.Content>
          </Card>

          {/* Device Info */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Informações do Dispositivo
              </Text>
              {renderBiometricTypeInfo()}
              <Text variant="bodyMedium" style={styles.infoText}>
                Status: {isAvailable ? 'Disponível' : 'Indisponível'}
              </Text>
              <Text variant="bodyMedium" style={styles.infoText}>
                Configurado: {isEnabled ? 'Sim' : 'Não'}
              </Text>
            </Card.Content>
          </Card>
        </>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Dica: Mantenha sua biometria atualizada nas configurações do sistema para melhor
          segurança.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  errorCard: {
    borderColor: '#f44336',
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  title: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    marginVertical: 4,
    opacity: 0.7,
  },
  helpText: {
    marginVertical: 2,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 12,
  },
  testButton: {
    marginTop: 8,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});
