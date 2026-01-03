/**
 * AccountsScreen
 *
 * Main screen for managing financial accounts
 */

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, useTheme, ActivityIndicator, Button, Card, Chip } from 'react-native-paper';
import { useAccounts } from '../../hooks';
import { AccountCard } from '../../components/accounts/AccountCard';
import { CreateAccountModal } from '../../components/accounts/CreateAccountModal';
import { EditAccountModal } from '../../components/accounts/EditAccountModal';

interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT_CARD' | 'CASH';
  balance: number;
  currency?: string;
  creditLimit?: number;
  color?: string;
  icon?: string;
}

export default function AccountsScreen() {
  const theme = useTheme();

  // State
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Queries
  const { data: accountsData, isLoading, error, refetch } = useAccounts();

  const accounts = accountsData?.data || [];

  // Filter accounts by type
  const filteredAccounts = filterType
    ? accounts.filter((account: Account) => account.type === filterType)
    : accounts;

  // Calculate total balance
  const totalBalance = filteredAccounts.reduce((sum: number, account: Account) => {
    // For credit cards, we subtract the balance (since it's debt)
    if (account.type === 'CREDIT_CARD') {
      return sum - Math.abs(account.balance);
    }
    return sum + account.balance;
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleAccountPress = (account: Account) => {
    setEditingAccount(account);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const ACCOUNT_TYPE_FILTERS = [
    { value: 'CHECKING', label: 'Corrente', icon: 'bank' },
    { value: 'SAVINGS', label: 'Poupança', icon: 'piggy-bank' },
    { value: 'INVESTMENT', label: 'Investimento', icon: 'chart-line' },
    { value: 'CREDIT_CARD', label: 'Cartão', icon: 'credit-card' },
    { value: 'CASH', label: 'Dinheiro', icon: 'cash' },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Total Balance Card */}
      <Card style={styles.balanceCard} mode="elevated">
        <Card.Content>
          <Text variant="labelMedium" style={styles.balanceLabel}>
            Saldo Total
          </Text>
          <Text
            variant="headlineLarge"
            style={[styles.totalBalance, { color: totalBalance >= 0 ? '#10b981' : '#ef4444' }]}
          >
            {formatCurrency(totalBalance)}
          </Text>
          <Text variant="bodySmall" style={styles.accountCount}>
            {filteredAccounts.length} conta(s)
          </Text>
        </Card.Content>
      </Card>

      {/* Type Filters */}
      <View style={styles.filtersSection}>
        <Text variant="labelLarge" style={styles.filtersLabel}>
          Filtrar por Tipo
        </Text>
        <View style={styles.filtersRow}>
          <Chip
            selected={filterType === null}
            onPress={() => setFilterType(null)}
            style={styles.filterChip}
            icon="view-grid"
          >
            Todas
          </Chip>
          {ACCOUNT_TYPE_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              selected={filterType === filter.value}
              onPress={() => setFilterType(filter.value)}
              style={styles.filterChip}
              icon={filter.icon}
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      </View>

      {/* Results Count */}
      <Text variant="bodySmall" style={styles.resultsCount}>
        {filteredAccounts.length} conta(s) encontrada(s)
      </Text>
    </View>
  );

  const renderAccount = ({ item }: { item: Account }) => (
    <AccountCard account={item} onPress={() => handleAccountPress(item)} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleMedium" style={styles.emptyTitle}>
        Nenhuma conta encontrada
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        {filterType
          ? 'Tente alterar os filtros ou criar uma nova conta'
          : 'Comece criando sua primeira conta'}
      </Text>
      {!filterType && (
        <Button
          mode="contained"
          onPress={() => setShowCreateModal(true)}
          style={styles.emptyButton}
          icon="plus"
        >
          Criar Conta
        </Button>
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium" style={styles.errorTitle}>
          Erro ao carregar contas
        </Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
          Não foi possível carregar as contas. Verifique sua conexão.
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
        data={filteredAccounts}
        renderItem={renderAccount}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={[
          styles.listContent,
          filteredAccounts.length === 0 && styles.listContentEmpty,
        ]}
      />

      {/* FAB */}
      <FAB
        icon="plus"
        label="Nova Conta"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      />

      {/* Modals */}
      <CreateAccountModal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
      />

      <EditAccountModal
        visible={!!editingAccount}
        account={editingAccount}
        onDismiss={() => setEditingAccount(null)}
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
  balanceCard: {
    marginBottom: 16,
  },
  balanceLabel: {
    opacity: 0.6,
    marginBottom: 4,
  },
  totalBalance: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accountCount: {
    opacity: 0.6,
  },
  filtersSection: {
    marginBottom: 16,
  },
  filtersLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
