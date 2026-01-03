import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  List,
  Switch,
  Button,
  Divider,
  useTheme,
  IconButton,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * NotificationSettingsScreen
 *
 * Tela de configurações de Push Notifications
 *
 * Features:
 * - Solicitar/verificar permissões
 * - Visualizar push token
 * - Configurar tipos de notificação
 * - Testar notificações locais
 * - Ver notificações agendadas
 */

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const {
    isSupported,
    permissions,
    pushToken,
    isLoading,
    preferences,
    requestPermissions,
    registerForPushNotifications,
    scheduleNotification,
    updatePreferences,
    setBadgeCount,
    clearBadgeCount,
  } = useNotification();

  const [testingNotification, setTestingNotification] = useState(false);

  /**
   * Request notification permissions
   */
  const handleRequestPermissions = async () => {
    try {
      const result = await requestPermissions();

      if (result.granted) {
        Alert.alert(
          'Permissão Concedida!',
          'Você receberá notificações importantes sobre suas finanças.',
          [{ text: 'OK' }]
        );

        // Register for push notifications
        await registerForPushNotifications();
      } else if (!result.canAskAgain) {
        Alert.alert(
          'Permissão Negada',
          'Você negou permanentemente as notificações. Para habilitar, vá em Configurações do dispositivo.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Permissão Negada', 'Você pode habilitar depois nas configurações.', [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível solicitar permissões de notificação.', [
        { text: 'OK' },
      ]);
    }
  };

  /**
   * Register for push notifications
   */
  const handleRegisterPush = async () => {
    try {
      const token = await registerForPushNotifications();

      if (token) {
        Alert.alert('Sucesso!', 'Você está registrado para receber push notifications.', [
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Falha', 'Não foi possível obter o token de push. Verifique as permissões.', [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao registrar para push notifications.', [{ text: 'OK' }]);
    }
  };

  /**
   * Test local notification
   */
  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
      const identifier = await scheduleNotification(
        {
          title: '🎉 Teste de Notificação',
          body: 'Esta é uma notificação de teste do Fayol!',
          data: { screen: 'NotificationSettings', test: true },
          sound: 'default',
        },
        {
          seconds: 3,
          channelId: 'default',
        }
      );

      if (identifier) {
        Alert.alert(
          'Notificação Agendada!',
          'Você receberá uma notificação de teste em 3 segundos.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Falha', 'Não foi possível agendar a notificação de teste.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao testar notificação.', [{ text: 'OK' }]);
    } finally {
      setTestingNotification(false);
    }
  };

  /**
   * Test budget alert notification
   */
  const handleTestBudgetAlert = async () => {
    setTestingNotification(true);
    try {
      await scheduleNotification(
        {
          title: '⚠️ Alerta de Orçamento',
          body: 'Você já gastou 85% do orçamento de Alimentação este mês!',
          data: { screen: 'BudgetDetails', budgetId: 'test', type: 'budget-alert' },
          sound: 'default',
          badge: 1,
        },
        {
          seconds: 3,
          channelId: 'budget-alerts',
        }
      );

      Alert.alert('Alerta Agendado!', 'Você receberá um alerta de orçamento em 3 segundos.', [
        { text: 'OK' },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao testar alerta de orçamento.', [{ text: 'OK' }]);
    } finally {
      setTestingNotification(false);
    }
  };

  /**
   * Test goal alert notification
   */
  const handleTestGoalAlert = async () => {
    setTestingNotification(true);
    try {
      await scheduleNotification(
        {
          title: '🎯 Meta Atingida!',
          body: 'Parabéns! Você atingiu 100% da sua meta de economia este mês!',
          data: { screen: 'GoalDetails', goalId: 'test', type: 'goal-alert' },
          sound: 'default',
          badge: 1,
        },
        {
          seconds: 3,
          channelId: 'goal-alerts',
        }
      );

      Alert.alert('Alerta Agendado!', 'Você receberá um alerta de meta em 3 segundos.', [
        { text: 'OK' },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao testar alerta de meta.', [{ text: 'OK' }]);
    } finally {
      setTestingNotification(false);
    }
  };

  /**
   * Test AI insight notification
   */
  const handleTestInsight = async () => {
    setTestingNotification(true);
    try {
      await scheduleNotification(
        {
          title: '💡 Insight Financeiro',
          body: 'Você economizou 23% mais este mês comparado ao anterior. Continue assim!',
          data: { screen: 'Insights', type: 'insight' },
          sound: 'default',
          badge: 1,
        },
        {
          seconds: 3,
          channelId: 'insights',
        }
      );

      Alert.alert('Insight Agendado!', 'Você receberá um insight em 3 segundos.', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao testar insight.', [{ text: 'OK' }]);
    } finally {
      setTestingNotification(false);
    }
  };

  /**
   * Update preference
   */
  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  /**
   * Copy push token
   */
  const handleCopyToken = () => {
    if (pushToken) {
      // TODO: Implement clipboard copy
      Alert.alert('Token Copiado!', 'O token foi copiado para a área de transferência.', [
        { text: 'OK' },
      ]);
    }
  };

  /**
   * Get permission status color
   */
  const getPermissionStatusColor = (): string => {
    if (!permissions) return theme.colors.outline;
    if (permissions.granted) return '#4caf50';
    if (permissions.status === 'denied') return '#f44336';
    return theme.colors.outline;
  };

  /**
   * Get permission status text
   */
  const getPermissionStatusText = (): string => {
    if (!permissions) return 'Verificando...';
    if (permissions.granted) return 'Concedida';
    if (permissions.status === 'denied') return 'Negada';
    return 'Não solicitada';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Verificando configurações...
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
            <IconButton icon="bell-ring" size={48} iconColor={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.title}>
              Notificações
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Configure alertas e lembretes financeiros
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Not Supported Warning */}
      {!isSupported && (
        <Card style={[styles.card, styles.warningCard]} mode="elevated">
          <Card.Content>
            <View style={styles.warningContent}>
              <IconButton icon="alert-circle" size={32} iconColor="#ff9800" />
              <Text variant="titleMedium" style={styles.warningTitle}>
                Notificações Não Disponíveis
              </Text>
              <Text variant="bodyMedium" style={styles.warningText}>
                Push notifications não funcionam em simuladores/emuladores. Use um dispositivo real
                para testar.
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Permission Status Card */}
      {isSupported && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Status de Permissões
            </Text>

            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <Text variant="bodyLarge" style={styles.statusLabel}>
                  Permissão de Notificação
                </Text>
                <Chip
                  mode="flat"
                  textStyle={{ color: getPermissionStatusColor() }}
                  style={[styles.statusChip, { borderColor: getPermissionStatusColor() }]}
                >
                  {getPermissionStatusText()}
                </Chip>
              </View>
            </View>

            {!permissions?.granted && (
              <>
                <Divider style={styles.divider} />
                <Button
                  mode="contained"
                  icon="bell-check"
                  onPress={handleRequestPermissions}
                  style={styles.button}
                >
                  Solicitar Permissão
                </Button>
              </>
            )}

            {permissions?.granted && !pushToken && (
              <>
                <Divider style={styles.divider} />
                <Button
                  mode="contained"
                  icon="cloud-upload"
                  onPress={handleRegisterPush}
                  style={styles.button}
                >
                  Registrar para Push Notifications
                </Button>
              </>
            )}

            {pushToken && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.tokenContainer}>
                  <Text variant="bodySmall" style={styles.tokenLabel}>
                    Push Token (para debug):
                  </Text>
                  <Text variant="bodySmall" style={styles.tokenText} numberOfLines={2}>
                    {pushToken}
                  </Text>
                  <Button
                    mode="outlined"
                    icon="content-copy"
                    onPress={handleCopyToken}
                    style={styles.copyButton}
                    compact
                  >
                    Copiar
                  </Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Notification Preferences */}
      {isSupported && permissions?.granted && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Tipos de Notificação
            </Text>

            <List.Item
              title="Alertas de Orçamento"
              description="Quando você atingir limites de gastos"
              left={(props) => <List.Icon {...props} icon="chart-box" />}
              right={() => (
                <Switch
                  value={preferences.budgetAlerts}
                  onValueChange={(value) => handlePreferenceChange('budgetAlerts', value)}
                />
              )}
            />

            <Divider style={styles.divider} />

            <List.Item
              title="Alertas de Metas"
              description="Quando você atingir suas metas financeiras"
              left={(props) => <List.Icon {...props} icon="target" />}
              right={() => (
                <Switch
                  value={preferences.goalAlerts}
                  onValueChange={(value) => handlePreferenceChange('goalAlerts', value)}
                />
              )}
            />

            <Divider style={styles.divider} />

            <List.Item
              title="Insights Financeiros"
              description="Dicas e análises da IA sobre suas finanças"
              left={(props) => <List.Icon {...props} icon="lightbulb-on" />}
              right={() => (
                <Switch
                  value={preferences.insights}
                  onValueChange={(value) => handlePreferenceChange('insights', value)}
                />
              )}
            />

            <Divider style={styles.divider} />

            <List.Item
              title="Notificações Gerais"
              description="Atualizações e lembretes do app"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={preferences.generalNotifications}
                  onValueChange={(value) => handlePreferenceChange('generalNotifications', value)}
                />
              )}
            />
          </Card.Content>
        </Card>
      )}

      {/* Test Notifications */}
      {isSupported && permissions?.granted && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Testar Notificações
            </Text>

            <Text variant="bodyMedium" style={styles.testDescription}>
              Envie notificações de teste para verificar como elas aparecem
            </Text>

            <Button
              mode="outlined"
              icon="bell-ring"
              onPress={handleTestNotification}
              style={styles.testButton}
              loading={testingNotification}
              disabled={testingNotification}
            >
              Notificação Geral
            </Button>

            <Button
              mode="outlined"
              icon="chart-box-outline"
              onPress={handleTestBudgetAlert}
              style={styles.testButton}
              loading={testingNotification}
              disabled={testingNotification}
            >
              Alerta de Orçamento
            </Button>

            <Button
              mode="outlined"
              icon="target"
              onPress={handleTestGoalAlert}
              style={styles.testButton}
              loading={testingNotification}
              disabled={testingNotification}
            >
              Alerta de Meta
            </Button>

            <Button
              mode="outlined"
              icon="lightbulb-on-outline"
              onPress={handleTestInsight}
              style={styles.testButton}
              loading={testingNotification}
              disabled={testingNotification}
            >
              Insight Financeiro
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Badge Management */}
      {isSupported && permissions?.granted && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Badge do App
            </Text>

            <Text variant="bodyMedium" style={styles.badgeDescription}>
              Gerencie o número vermelho que aparece no ícone do app
            </Text>

            <View style={styles.badgeActions}>
              <Button
                mode="outlined"
                icon="numeric-1-circle"
                onPress={() => setBadgeCount(1)}
                style={styles.badgeButton}
              >
                Definir 1
              </Button>

              <Button
                mode="outlined"
                icon="numeric-5-circle"
                onPress={() => setBadgeCount(5)}
                style={styles.badgeButton}
              >
                Definir 5
              </Button>

              <Button
                mode="outlined"
                icon="close-circle"
                onPress={clearBadgeCount}
                style={styles.badgeButton}
              >
                Limpar
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Info Card */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📱 Sobre as Notificações
          </Text>

          <View style={styles.infoItem}>
            <List.Icon icon="shield-check" color="#4caf50" />
            <View style={styles.infoContent}>
              <Text variant="titleSmall" style={styles.infoTitle}>
                Privacidade Garantida
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                Suas notificações são criptografadas e enviadas diretamente do servidor Fayol
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <List.Icon icon="battery" color="#4caf50" />
            <View style={styles.infoContent}>
              <Text variant="titleSmall" style={styles.infoTitle}>
                Otimização de Bateria
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                Usamos Firebase Cloud Messaging para economizar bateria
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <List.Icon icon="cog" color="#2196f3" />
            <View style={styles.infoContent}>
              <Text variant="titleSmall" style={styles.infoTitle}>
                Controle Total
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                Você escolhe exatamente quais notificações quer receber
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          As notificações ajudam você a manter suas finanças em dia e alcançar suas metas.
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  warningCard: {
    borderColor: '#ff9800',
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
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
    textAlign: 'center',
  },
  warningContent: {
    alignItems: 'center',
    padding: 8,
  },
  warningTitle: {
    fontWeight: 'bold',
    color: '#ff9800',
    marginTop: 8,
  },
  warningText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  divider: {
    marginVertical: 12,
  },
  button: {
    marginTop: 8,
  },
  tokenContainer: {
    marginTop: 8,
  },
  tokenLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  tokenText: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  copyButton: {
    marginTop: 4,
  },
  testDescription: {
    opacity: 0.7,
    marginBottom: 16,
  },
  testButton: {
    marginTop: 8,
  },
  badgeDescription: {
    opacity: 0.7,
    marginBottom: 16,
  },
  badgeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeButton: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 8,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    opacity: 0.7,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});
