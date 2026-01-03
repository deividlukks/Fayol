import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, FAB, useTheme, ActivityIndicator, Button, Card } from 'react-native-paper';
import { useBudgets } from '../../hooks/queries/useBudgets';
import { BudgetCard } from '../../components/budgets/BudgetCard';
import { CreateBudgetModal } from '../../components/budgets/CreateBudgetModal';
import { EditBudgetModal } from '../../components/budgets/EditBudgetModal';
import type { Budget } from '@fayol/shared-types';

export default function BudgetsScreen() {
  const theme = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch budgets
  const { data: budgetsData, isLoading, error, refetch } = useBudgets();

  const budgets = budgetsData?.data || [];

  const handleRefresh = () => {
    refetch();
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedBudget(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Orçamentos 💰
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Gerencie seus limites de gastos
          </Text>
        </View>

        {/* Loading State */}
        {isLoading && budgets.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Carregando orçamentos...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.errorTitle}>
                Erro ao carregar orçamentos
              </Text>
              <Text variant="bodyMedium" style={styles.errorMessage}>
                Não foi possível carregar os orçamentos. Verifique sua conexão.
              </Text>
              <Button mode="outlined" onPress={handleRefresh} style={styles.retryButton}>
                Tentar Novamente
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && budgets.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              Nenhum orçamento ainda 📊
            </Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              Crie seu primeiro orçamento para começar a controlar seus gastos por categoria.
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowCreateModal(true)}
              style={styles.emptyButton}
            >
              Criar Primeiro Orçamento
            </Button>
          </View>
        )}

        {/* Budgets List */}
        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} onPress={() => handleEditBudget(budget)} />
        ))}
      </ScrollView>

      {/* FAB for creating new budget */}
      {budgets.length > 0 && (
        <FAB
          icon="plus"
          label="Novo Orçamento"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        />
      )}

      {/* Create Budget Modal */}
      <CreateBudgetModal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        onSuccess={handleRefresh}
      />

      {/* Edit Budget Modal */}
      {selectedBudget && (
        <EditBudgetModal
          visible={showEditModal}
          budget={selectedBudget}
          onDismiss={handleCloseEditModal}
          onSuccess={() => {
            handleCloseEditModal();
            handleRefresh();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorCard: {
    marginBottom: 16,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
