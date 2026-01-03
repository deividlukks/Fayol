import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, List, Divider } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';

export default function MoreScreen() {
  const { user, logout } = useAuth();

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
          try {
            await logout();
          } catch (error) {
            console.error('[MoreScreen] Logout error:', error);
            Alert.alert('Erro', 'Não foi possível sair. Tente novamente.', [{ text: 'OK' }]);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Mais
      </Text>

      {/* User Info */}
      {user && (
        <>
          <List.Item
            title={user.name}
            description={user.email}
            left={(props) => <List.Icon {...props} icon="account-circle" />}
          />
          <Divider />
        </>
      )}

      <List.Section>
        <List.Item
          title="Orçamentos"
          description="Gerencie seus orçamentos"
          left={(props) => <List.Icon {...props} icon="chart-box" />}
          onPress={() => console.log('Orçamentos')}
        />
        <List.Item
          title="Metas"
          description="Acompanhe suas metas financeiras"
          left={(props) => <List.Icon {...props} icon="target" />}
          onPress={() => console.log('Metas')}
        />
        <List.Item
          title="Configurações"
          description="Preferências e configurações"
          left={(props) => <List.Icon {...props} icon="cog" />}
          onPress={() => console.log('Configurações')}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Item
          title="Sair"
          description="Desconectar da conta"
          left={(props) => <List.Icon {...props} icon="logout" color="#ef4444" />}
          titleStyle={{ color: '#ef4444' }}
          onPress={handleLogout}
        />
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    padding: 16,
    fontWeight: 'bold',
  },
});
