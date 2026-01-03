import React, { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';

/**
 * OptimizedList
 *
 * FlatList component otimizado para performance
 *
 * Features:
 * - Virtualization otimizada
 * - Pull to refresh
 * - Infinite scroll
 * - Empty state
 * - Loading state
 * - Memoization
 */

interface OptimizedListProps<T> extends Partial<FlatListProps<T>> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  onRefresh?: () => Promise<void>;
  onLoadMore?: () => Promise<void>;
  loading?: boolean;
  refreshing?: boolean;
  hasMore?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  estimatedItemSize?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
}

function OptimizedListComponent<T>(props: OptimizedListProps<T>) {
  const {
    data,
    renderItem: renderItemProp,
    keyExtractor,
    onRefresh,
    onLoadMore,
    loading = false,
    refreshing = false,
    hasMore = false,
    emptyMessage = 'Nenhum item encontrado',
    emptyIcon,
    estimatedItemSize = 100,
    windowSize = 10,
    maxToRenderPerBatch = 10,
    updateCellsBatchingPeriod = 50,
    ...flatListProps
  } = props;

  /**
   * Optimized render item with memoization
   */
  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return renderItemProp(item, index);
    },
    [renderItemProp]
  );

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    }
  }, [onRefresh]);

  /**
   * Handle end reached (load more)
   */
  const handleEndReached = useCallback(async () => {
    if (onLoadMore && hasMore && !loading) {
      await onLoadMore();
    }
  }, [onLoadMore, hasMore, loading]);

  /**
   * Render empty component
   */
  const renderEmptyComponent = useMemo(() => {
    if (loading && data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.emptyText}>
            Carregando...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        {emptyIcon && <Text style={styles.emptyIcon}>{emptyIcon}</Text>}
        <Text variant="bodyMedium" style={styles.emptyText}>
          {emptyMessage}
        </Text>
      </View>
    );
  }, [loading, data.length, emptyMessage, emptyIcon]);

  /**
   * Render footer (loading more indicator)
   */
  const renderFooter = useMemo(() => {
    if (!loading || data.length === 0) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" />
        <Text variant="bodySmall" style={styles.footerText}>
          Carregando mais...
        </Text>
      </View>
    );
  }, [loading, data.length]);

  /**
   * Refresh control
   */
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;

    return <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />;
  }, [onRefresh, refreshing, handleRefresh]);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooter}
      refreshControl={refreshControl}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      windowSize={windowSize}
      initialNumToRender={10}
      getItemLayout={(data, index) => ({
        length: estimatedItemSize,
        offset: estimatedItemSize * index,
        index,
      })}
      {...flatListProps}
    />
  );
}

/**
 * Memoize component to prevent unnecessary re-renders
 */
export const OptimizedList = memo(OptimizedListComponent) as typeof OptimizedListComponent;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 200,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 8,
    opacity: 0.6,
  },
});
