import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, ProgressBar, useTheme } from 'react-native-paper';
import { useOffline } from '../contexts/OfflineContext';

/**
 * SyncStatusBanner
 *
 * Banner que mostra o progresso de sincronização
 *
 * Features:
 * - Mostra quando está sincronizando
 * - Progress bar animada
 * - Última sincronização
 * - Erros de sincronização
 */

export default function SyncStatusBanner() {
  const theme = useTheme();
  const { syncProgress, isSyncing, isOnline } = useOffline();
  const [visible, setVisible] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Show when syncing or if there was an error
    const shouldShow = isSyncing || syncProgress.status === 'error';

    if (shouldShow && !visible) {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!shouldShow && visible) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isSyncing, syncProgress.status, visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  const progress =
    syncProgress.totalItems > 0 ? syncProgress.syncedItems / syncProgress.totalItems : 0;

  const backgroundColor =
    syncProgress.status === 'error'
      ? '#f44336'
      : syncProgress.status === 'completed'
        ? '#4caf50'
        : theme.colors.primary;

  return (
    <Animated.View style={[styles.container, { backgroundColor, opacity: fadeAnim }]}>
      <View style={styles.content}>
        {isSyncing && (
          <>
            <Text style={styles.mainText}>
              Sincronizando... {syncProgress.syncedItems}/{syncProgress.totalItems}
            </Text>
            <ProgressBar progress={progress} color="#ffffff" style={styles.progressBar} />
          </>
        )}

        {syncProgress.status === 'error' && (
          <Text style={styles.mainText}>Erro na sincronização: {syncProgress.lastError}</Text>
        )}

        {syncProgress.status === 'completed' && !isSyncing && (
          <Text style={styles.mainText}>Sincronização concluída!</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    gap: 8,
  },
  mainText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
