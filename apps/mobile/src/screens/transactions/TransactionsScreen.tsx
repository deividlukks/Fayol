import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  Text,
  Searchbar,
  FAB,
  IconButton,
  useTheme,
  ActivityIndicator,
  Button,
  Chip,
} from 'react-native-paper';
import { useTransactions, useCategories, useAccounts } from '../../hooks';
import { TransactionCard } from '../../components/dashboard';
import { TransactionFilters } from '../../components/transactions/TransactionFilters';
import { CreateTransactionModal } from '../../components/transactions/CreateTransactionModal';
import { EditTransactionModal } from '../../components/transactions/EditTransactionModal';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  date: string;
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  account?: {
    id: string;
    name: string;
  };
}

export default function TransactionsScreen() {
  const theme = useTheme();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Queries
  const {
    data: transactionsData,
    isLoading,
    error,
    refetch,
  } = useTransactions({
    search: searchQuery || undefined,
    ...filters,
  });

  const { data: categoriesData } = useCategories();
  const { data: accountsData } = useAccounts();

  const transactions = transactionsData?.data || [];
  const categories = categoriesData?.data || [];
  const accounts = accountsData?.data || [];

  // Filter transactions by search query locally (as backup)
  const filteredTransactions = transactions.filter((transaction: Transaction) =>
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== null && value !== undefined
  ).length;

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionCard transaction={item} onPress={() => handleTransactionPress(item)} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Buscar transações..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        icon="magnify"
      />

      {/* Filters Button */}
      <View style={styles.filtersRow}>
        <Button
          mode={activeFiltersCount > 0 ? 'contained' : 'outlined'}
          onPress={() => setShowFilters(true)}
          icon="filter"
          style={styles.filterButton}
        >
          Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            mode="text"
            onPress={() => {
              setFilters({});
              refetch();
            }}
            compact
          >
            Limpar
          </Button>
        )}
      </View>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFiltersRow}>
          {filters.type && (
            <Chip
              icon="close"
              onPress={() => setFilters({ ...filters, type: null })}
              style={styles.filterChip}
            >
              {filters.type === 'INCOME'
                ? 'Receita'
                : filters.type === 'EXPENSE'
                  ? 'Despesa'
                  : 'Transferência'}
            </Chip>
          )}
          {filters.categoryId && (
            <Chip
              icon="close"
              onPress={() => setFilters({ ...filters, categoryId: null })}
              style={styles.filterChip}
            >
              {categories.find((c: any) => c.id === filters.categoryId)?.name || 'Categoria'}
            </Chip>
          )}
          {filters.accountId && (
            <Chip
              icon="close"
              onPress={() => setFilters({ ...filters, accountId: null })}
              style={styles.filterChip}
            >
              {accounts.find((a: any) => a.id === filters.accountId)?.name || 'Conta'}
            </Chip>
          )}
        </View>
      )}

      {/* Results Count */}
      <Text variant="bodySmall" style={styles.resultsCount}>
        {filteredTransactions.length} transação(ões) encontrada(s)
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleMedium" style={styles.emptyTitle}>
        Nenhuma transação encontrada
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        {searchQuery || activeFiltersCount > 0
          ? 'Tente ajustar sua busca ou filtros'
          : 'Comece criando sua primeira transação'}
      </Text>
      {!searchQuery && activeFiltersCount === 0 && (
        <Button
          mode="contained"
          onPress={() => setShowCreateModal(true)}
          style={styles.emptyButton}
          icon="plus"
        >
          Criar Transação
        </Button>
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium" style={styles.errorTitle}>
          Erro ao carregar transações
        </Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
          Não foi possível carregar as transações. Verifique sua conexão.
        </Text>
        <Button mode="outlined" onPress={() => refetch()} style={styles.retryButton}>
          Tentar Novamente
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={[
          styles.listContent,
          filteredTransactions.length === 0 && styles.listContentEmpty,
        ]}
      />

      {/* FAB */}
      <FAB
        icon="plus"
        label="Nova Transação"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      />

      {/* Modals */}
      <TransactionFilters
        visible={showFilters}
        onDismiss={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        categories={categories}
        accounts={accounts}
        initialFilters={filters}
      />

      <CreateTransactionModal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
      />

      <EditTransactionModal
        visible={!!editingTransaction}
        transaction={editingTransaction}
        onDismiss={() => setEditingTransaction(null)}
        onSuccess={handleModalSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    marginBottom: 4,
  },
  resultsCount: {
    opacity: 0.6,
    marginBottom: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  listContentEmpty: {
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtitle: {
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
