import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Button, useTheme, FAB } from 'react-native-paper';
import {
  useDashboardSummary,
  useAccounts,
  useTransactions,
  useExpensesByCategory,
  useInsights,
} from '../../hooks';
import { useAuth } from '../../hooks/useAuth';
import {
  BalanceCard,
  RevenueExpensesChart,
  RecentTransactions,
  TopCategories,
  InsightsCard,
} from '../../components/dashboard';
import { CreateTransactionModal } from '../../components/transactions';

export default function DashboardScreen() {
  const { user } = useAuth();
  const theme = useTheme();

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch dashboard data using React Query hooks
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useDashboardSummary();

  const {
    data: accountsData,
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = useAccounts();

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useTransactions({ limit: 5 });

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useExpensesByCategory({ limit: 5 });

  const {
    data: insightsData,
    isLoading: insightsLoading,
    refetch: refetchInsights,
  } = useInsights();

  // Combine loading states
  const isRefreshing =
    summaryLoading ||
    accountsLoading ||
    transactionsLoading ||
    categoriesLoading ||
    insightsLoading;

  // Handle pull-to-refresh
  const handleRefresh = () => {
    refetchSummary();
    refetchAccounts();
    refetchTransactions();
    refetchCategories();
    refetchInsights();
  };

  // Extract data from API responses
  const summary = summaryData?.data;
  const transactions = transactionsData?.data || [];
  const topCategories = categoriesData?.data || [];
  const insights = insightsData?.data || [];

  // Prepare chart data (mock for now - will use real data from API)
  const chartData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    revenues: [3000, 3500, 2800, 4000, 3200, 4500],
    expenses: [2500, 2800, 2200, 3000, 2900, 3200],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Olá, {user?.name?.split(' ')[0] || 'Usuário'}! 👋
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Aqui está seu resumo financeiro
          </Text>
        </View>

        {/* Loading State */}
        {summaryLoading && !summaryData && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Carregando dashboard...
            </Text>
          </View>
        )}

        {/* Error State */}
        {summaryError && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.errorTitle}>
                Erro ao carregar dados
              </Text>
              <Text variant="bodyMedium" style={styles.errorMessage}>
                Não foi possível carregar o dashboard. Verifique sua conexão.
              </Text>
              <Button mode="outlined" onPress={handleRefresh} style={styles.retryButton}>
                Tentar Novamente
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Balance Card */}
        <BalanceCard
          balance={summary?.totalBalance || 0}
          income={summary?.totalIncome || 0}
          expenses={summary?.totalExpenses || 0}
          loading={summaryLoading}
        />

        {/* Revenue vs Expenses Chart */}
        <RevenueExpensesChart data={chartData} loading={summaryLoading} />

        {/* Recent Transactions */}
        <RecentTransactions
          transactions={transactions}
          loading={transactionsLoading}
          onViewAll={() => console.log('Navigate to transactions')}
          onTransactionPress={(transaction) => console.log('Transaction pressed:', transaction.id)}
        />

        {/* Top Categories */}
        <TopCategories
          categories={topCategories}
          loading={categoriesLoading}
          onViewAll={() => console.log('Navigate to categories')}
        />

        {/* AI Insights */}
        <InsightsCard insights={insights} loading={insightsLoading} />
      </View>

      {/* FAB for quick transaction creation */}
      <FAB
        icon="plus"
        label="Nova Transação"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      />

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        onSuccess={handleRefresh}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorTitle: {
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    marginBottom: 16,
    opacity: 0.7,
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
