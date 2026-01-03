import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react';
import { Text, List, Divider, Card, useTheme, IconButton, Switch, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useBiometric } from '../../contexts/BiometricContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../hooks/useAuth';

/**
 * SecuritySettingsScreen
 *
 * Tela principal de configurações de segurança
 *
 * Features:
 * - Configuração de biometria
 * - Alterar senha
 * - Gerenciar sessões
 * - Atividades recentes
 * - Logout
 */

type RootStackParamList = {
  BiometricSetup: undefined;
  NotificationSettings: undefined;
  ChangePassword: undefined;
  // Add other screens here
};

type SecuritySettingsNavigationProp = StackNavigationProp<RootStackParamList>;

export default function SecuritySettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<SecuritySettingsNavigationProp>();
  const { isAvailable, isEnabled, biometricType } = useBiometric();
  const { permissions: notificationPermissions } = useNotification();
  const { logout } = useAuth();

  /**
   * Navigate to biometric setup
   */
  const handleBiometricPress = () => {
    navigation.navigate('BiometricSetup');
  };

  /**
   * Navigate to notification settings
   */
  const handleNotificationPress = () => {
    navigation.navigate('NotificationSettings');
  };

  /**
   * Navigate to change password
   */
  const handleChangePassword = () => {
    // TODO: Implement change password screen
    Alert.alert('Em Breve', 'Funcionalidade em desenvolvimento', [{ text: 'OK' }]);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  /**
   * Handle logout from all devices
   */
  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Sair de Todos os Dispositivos',
      'Esta ação vai desconectar sua conta de todos os dispositivos. Você precisará fazer login novamente.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement logout from all devices
            Alert.alert('Em Breve', 'Funcionalidade em desenvolvimento', [{ text: 'OK' }]);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.header}>
            <IconButton icon="shield-lock" size={48} iconColor={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.title}>
              Segurança
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Gerencie a segurança da sua conta
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Authentication Section */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Autenticação
          </Text>

          <List.Item
            title="Autenticação Biométrica"
            description={
              !isAvailable
                ? 'Não disponível neste dispositivo'
                : isEnabled
                  ? `${biometricType} habilitado`
                  : 'Configure para login rápido'
            }
            left={(props) => <List.Icon {...props} icon="fingerprint" />}
            right={(props) =>
              isAvailable && isEnabled ? (
                <Badge {...props} style={styles.badge}>
                  Ativo
                </Badge>
              ) : null
            }
            onPress={handleBiometricPress}
            disabled={!isAvailable}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Notificações Push"
            description={
              notificationPermissions?.granted
                ? 'Notificações habilitadas'
                : 'Configure alertas e lembretes'
            }
            left={(props) => <List.Icon {...props} icon="bell-ring" />}
            right={(props) =>
              notificationPermissions?.granted ? (
                <Badge {...props} style={styles.badge}>
                  Ativo
                </Badge>
              ) : (
                <List.Icon {...props} icon="chevron-right" />
              )
            }
            onPress={handleNotificationPress}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Alterar Senha"
            description="Atualize sua senha periodicamente"
            left={(props) => <List.Icon {...props} icon="lock-reset" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleChangePassword}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Autenticação de Dois Fatores (2FA)"
            description="Em breve - Camada extra de segurança"
            left={(props) => <List.Icon {...props} icon="two-factor-authentication" />}
            right={(props) => <Switch value={false} onValueChange={() => {}} disabled />}
            disabled
          />
        </Card.Content>
      </Card>

      {/* Sessions Section */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Sessões e Dispositivos
          </Text>

          <List.Item
            title="Dispositivos Conectados"
            description="Gerencie seus dispositivos ativos"
            left={(props) => <List.Icon {...props} icon="devices" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() =>
              Alert.alert('Em Breve', 'Funcionalidade em desenvolvimento', [{ text: 'OK' }])
            }
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Histórico de Acessos"
            description="Veja atividades recentes da sua conta"
            left={(props) => <List.Icon {...props} icon="history" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() =>
              Alert.alert('Em Breve', 'Funcionalidade em desenvolvimento', [{ text: 'OK' }])
            }
          />
        </Card.Content>
      </Card>

      {/* Advanced Security */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Segurança Avançada
          </Text>

          <List.Item
            title="Bloquear App Após Inatividade"
            description="Em breve - Tempo até exigir autenticação"
            left={(props) => <List.Icon {...props} icon="timer-lock" />}
            right={(props) => <Switch value={false} onValueChange={() => {}} disabled />}
            disabled
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Exigir Biometria em Ações Sensíveis"
            description="Em breve - Transferências, exclusões, etc."
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            right={(props) => <Switch value={false} onValueChange={() => {}} disabled />}
            disabled
          />
        </Card.Content>
      </Card>

      {/* Danger Zone */}
      <Card style={[styles.card, styles.dangerCard]} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={[styles.sectionTitle, styles.dangerTitle]}>
            Zona de Perigo
          </Text>

          <List.Item
            title="Sair de Todos os Dispositivos"
            description="Desconecte sua conta de todos os dispositivos"
            left={(props) => (
              <List.Icon {...props} icon="logout-variant" color={theme.colors.error} />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleLogoutAllDevices}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Sair da Conta"
            description="Desconectar deste dispositivo"
            left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleLogout}
          />
        </Card.Content>
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Sua segurança é nossa prioridade. Mantenha suas informações sempre protegidas.
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
  card: {
    margin: 16,
    marginBottom: 8,
  },
  dangerCard: {
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
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dangerTitle: {
    color: '#f44336',
  },
  divider: {
    marginVertical: 8,
  },
  badge: {
    backgroundColor: '#4caf50',
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
