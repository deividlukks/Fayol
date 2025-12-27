/**
 * RecentTransactions Component
 *
 * Displays a list of recent transactions
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { TransactionCard } from './TransactionCard';

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

interface RecentTransactionsProps {
  transactions: Transaction[];
  loading?: boolean;
  onViewAll?: () => void;
  onTransactionPress?: (transaction: Transaction) => void;
}

export function RecentTransactions({
  transactions,
  loading,
  onViewAll,
  onTransactionPress,
}: RecentTransactionsProps) {
  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            Transações Recentes
          </Text>
          {onViewAll && (
            <Button mode="text" compact onPress={onViewAll}>
              Ver todas
            </Button>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text variant="bodyMedium" style={styles.loadingText}>
              Carregando transações...
            </Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Nenhuma transação encontrada
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Comece criando sua primeira transação
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onPress={() => onTransactionPress?.(transaction)}
              />
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: '600',
  },
  transactionsList: {
    marginHorizontal: -16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    opacity: 0.6,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.8,
    marginBottom: 4,
  },
  emptySubtext: {
    opacity: 0.6,
  },
});
