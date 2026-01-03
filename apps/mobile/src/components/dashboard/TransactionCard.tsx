/**
 * TransactionCard Component
 *
 * Displays a single transaction item
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionCard({ transaction, onPress }: TransactionCardProps) {
  const theme = useTheme();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMM", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getTypeColor = () => {
    switch (transaction.type) {
      case 'INCOME':
        return '#10b981';
      case 'EXPENSE':
        return '#ef4444';
      case 'TRANSFER':
        return '#3b82f6';
      default:
        return theme.colors.onSurface;
    }
  };

  const getTypeIcon = () => {
    switch (transaction.type) {
      case 'INCOME':
        return 'arrow-down-circle';
      case 'EXPENSE':
        return 'arrow-up-circle';
      case 'TRANSFER':
        return 'swap-horizontal-circle';
      default:
        return 'circle';
    }
  };

  const getCategoryIcon = () => {
    return transaction.category?.icon || 'tag';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: theme.colors.outline }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: transaction.category?.color || theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons name={getCategoryIcon()} size={24} color={theme.colors.primary} />
        </View>

        <View style={styles.infoContainer}>
          <Text variant="bodyLarge" style={styles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={styles.metaRow}>
            {transaction.category && (
              <Text variant="labelSmall" style={styles.metaText}>
                {transaction.category.name}
              </Text>
            )}
            {transaction.category && transaction.account && (
              <Text variant="labelSmall" style={styles.metaText}>
                •
              </Text>
            )}
            {transaction.account && (
              <Text variant="labelSmall" style={styles.metaText}>
                {transaction.account.name}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.amountRow}>
          <MaterialCommunityIcons name={getTypeIcon()} size={16} color={getTypeColor()} />
          <Text variant="bodyLarge" style={[styles.amount, { color: getTypeColor() }]}>
            {transaction.type === 'EXPENSE' ? '-' : '+'} {formatCurrency(transaction.amount)}
          </Text>
        </View>
        <Text variant="labelSmall" style={styles.date}>
          {formatDate(transaction.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  description: {
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    opacity: 0.6,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontWeight: 'bold',
  },
  date: {
    opacity: 0.6,
  },
});
