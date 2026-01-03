import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, FAB, useTheme, ActivityIndicator, Button, Card, Chip } from 'react-native-paper';
import { useInvestments } from '../../hooks/queries/useInvestments';
import { InvestmentCard } from '../../components/investments/InvestmentCard';
import { CreateInvestmentModal } from '../../components/investments/CreateInvestmentModal';
import { EditInvestmentModal } from '../../components/investments/EditInvestmentModal';
import { PortfolioSummary } from '../../components/investments/PortfolioSummary';
import type { Investment } from '@fayol/shared-types';

export default function InvestmentsScreen() {
  const theme = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Fetch investments
  const {
    data: investmentsData,
    isLoading,
    error,
    refetch,
  } = useInvestments({ type: selectedType || undefined });

  const investments = investmentsData?.data || [];

  // Calculate portfolio summary
  const totalValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
  const totalCost = investments.reduce((sum, inv) => sum + (inv.totalCost || 0), 0);
  const totalGain = totalValue - totalCost;
  const gainPercentage = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const handleRefresh = () => {
    refetch();
  };

  const handleEditInvestment = (investment: Investment) => {
    setSelectedInvestment(investment);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedInvestment(null);
  };

  const investmentTypes = [
    { key: null, label: 'Todos' },
    { key: 'STOCK', label: 'Ações' },
    { key: 'FII', label: 'FIIs' },
    { key: 'CRYPTO', label: 'Cripto' },
    { key: 'ETF', label: 'ETFs' },
    { key: 'FIXED_INCOME', label: 'Renda Fixa' },
  ];

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
            Investimentos 📈
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Acompanhe seu portfólio
          </Text>
        </View>

        {/* Portfolio Summary */}
        {investments.length > 0 && (
          <PortfolioSummary
            totalValue={totalValue}
            totalCost={totalCost}
            totalGain={totalGain}
            gainPercentage={gainPercentage}
          />
        )}

        {/* Type Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {investmentTypes.map((type) => (
            <Chip
              key={type.key || 'all'}
              selected={selectedType === type.key}
              onPress={() => setSelectedType(type.key)}
              style={styles.filterChip}
              mode={selectedType === type.key ? 'flat' : 'outlined'}
            >
              {type.label}
            </Chip>
          ))}
        </ScrollView>

        {/* Loading State */}
        {isLoading && investments.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Carregando investimentos...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.errorTitle}>
                Erro ao carregar investimentos
              </Text>
              <Text variant="bodyMedium" style={styles.errorMessage}>
                Não foi possível carregar os investimentos. Verifique sua conexão.
              </Text>
              <Button mode="outlined" onPress={handleRefresh} style={styles.retryButton}>
                Tentar Novamente
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && investments.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              Nenhum investimento ainda 💼
            </Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              Comece a acompanhar seus investimentos e construa seu patrimônio.
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowCreateModal(true)}
              style={styles.emptyButton}
            >
              Adicionar Primeiro Investimento
            </Button>
          </View>
        )}

        {/* Investments List */}
        {investments.map((investment) => (
          <InvestmentCard
            key={investment.id}
            investment={investment}
            onPress={() => handleEditInvestment(investment)}
          />
        ))}
      </ScrollView>

      {/* FAB for creating new investment */}
      {investments.length > 0 && (
        <FAB
          icon="plus"
          label="Novo Investimento"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        />
      )}

      {/* Create Investment Modal */}
      <CreateInvestmentModal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        onSuccess={handleRefresh}
      />

      {/* Edit Investment Modal */}
      {selectedInvestment && (
        <EditInvestmentModal
          visible={showEditModal}
          investment={selectedInvestment}
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
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    marginRight: 8,
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
