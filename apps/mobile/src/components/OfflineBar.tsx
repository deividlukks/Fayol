import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { useOffline } from '../contexts/OfflineContext';

/**
 * OfflineBar
 *
 * Banner que aparece quando o app está offline
 *
 * Features:
 * - Mostra status offline
 * - Exibe número de mudanças pendentes
 * - Botão para tentar sincronizar novamente
 */

export default function OfflineBar() {
  const theme = useTheme();
  const { isOnline, pendingChanges, sync, isSyncing } = useOffline();

  // Don't show if online
  if (isOnline) {
    return null;
  }

  const handleRetrySync = async () => {
    try {
      await sync(true); // Force sync
    } catch (error) {
      console.error('Retry sync error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#ff9800' }]}>
      <View style={styles.content}>
        <IconButton icon="cloud-off-outline" size={20} iconColor="#ffffff" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>Você está offline</Text>
          {pendingChanges > 0 && (
            <Text style={styles.subText}>
              {pendingChanges} {pendingChanges === 1 ? 'mudança' : 'mudanças'} pendente
              {pendingChanges === 1 ? '' : 's'}
            </Text>
          )}
        </View>
      </View>
      <IconButton
        icon={isSyncing ? 'sync' : 'refresh'}
        size={20}
        iconColor="#ffffff"
        onPress={handleRetrySync}
        disabled={isSyncing}
        style={[styles.retryButton, isSyncing && styles.syncing]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    margin: 0,
  },
  textContainer: {
    marginLeft: 8,
    flex: 1,
  },
  mainText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subText: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.9,
  },
  retryButton: {
    margin: 0,
  },
  syncing: {
    opacity: 0.6,
  },
});
