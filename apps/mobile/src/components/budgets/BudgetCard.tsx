/**
 * BudgetCard Component
 *
 * Displays individual budget information with progress bars
 */

import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Card, Text, ProgressBar, useTheme, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  startDate: string;
  endDate: string;
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

interface BudgetCardProps {
  budget: Budget;
  onPress?: (budget: Budget) => void;
}

const PERIOD_LABELS = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
  CUSTOM: 'Personalizado',
};

export function BudgetCard({ budget, onPress }: BudgetCardProps) {
  const theme = useTheme();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate percentage spent
  const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - budget.spent;

  // Determine color based on percentage
  const getProgressColor = () => {
    if (percentage >= 100) return '#ef4444'; // Red - exceeded
    if (percentage >= 80) return '#f59e0b'; // Orange/Yellow - warning
    return '#10b981'; // Green - safe
  };

  const getStatusLabel = () => {
    if (percentage >= 100) return 'Estourado';
    if (percentage >= 80) return 'Atenção';
    return 'No limite';
  };

  const getStatusColor = () => {
    if (percentage >= 100) return '#ef4444';
    if (percentage >= 80) return '#f59e0b';
    return '#10b981';
  };

  const progressColor = getProgressColor();
  const statusLabel = getStatusLabel();
  const statusColor = getStatusColor();

  // Format period dates
  const formatPeriod = () => {
    const start = format(new Date(budget.startDate), 'dd/MM/yyyy', { locale: ptBR });
    const end = format(new Date(budget.endDate), 'dd/MM/yyyy', { locale: ptBR });
    return `${start} - ${end}`;
  };

  return (
    <Pressable onPress={() => onPress?.(budget)}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {budget.category && (
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor: budget.category.color
                        ? budget.category.color + '20'
                        : '#3b82f620',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={budget.category.icon || 'tag'}
                    size={20}
                    color={budget.category.color || '#3b82f6'}
                  />
                </View>
              )}
              <View style={styles.headerInfo}>
                <Text variant="titleMedium" style={styles.budgetName}>
                  {budget.name}
                </Text>
                {budget.category && (
                  <Text variant="bodySmall" style={styles.categoryName}>
                    {budget.category.name}
                  </Text>
                )}
              </View>
            </View>

            {/* Status Badge */}
            <Chip
              mode="flat"
              textStyle={{ fontSize: 11, color: statusColor }}
              style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
            >
              {statusLabel}
            </Chip>
          </View>

          {/* Period */}
          <View style={styles.periodRow}>
            <MaterialCommunityIcons name="calendar-range" size={14} color="#6b7280" />
            <Text variant="bodySmall" style={styles.periodText}>
              {PERIOD_LABELS[budget.period]} • {formatPeriod()}
            </Text>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.amountsRow}>
              <Text variant="bodySmall" style={styles.amountLabel}>
                Gasto
              </Text>
              <Text variant="bodySmall" style={styles.amountLabel}>
                Limite
              </Text>
            </View>
            <View style={styles.amountsRow}>
              <Text variant="titleMedium" style={[styles.spentAmount, { color: progressColor }]}>
                {formatCurrency(budget.spent)}
              </Text>
              <Text variant="titleMedium" style={styles.limitAmount}>
                {formatCurrency(budget.amount)}
              </Text>
            </View>

            {/* Progress Bar */}
            <ProgressBar
              progress={Math.min(percentage / 100, 1)}
              color={progressColor}
              style={styles.progressBar}
            />

            {/* Progress Info */}
            <View style={styles.progressInfo}>
              <Text variant="bodySmall" style={styles.percentageText}>
                {percentage.toFixed(0)}% utilizado
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.remainingText, { color: remaining >= 0 ? '#10b981' : '#ef4444' }]}
              >
                {remaining >= 0 ? 'Restam' : 'Excedeu'} {formatCurrency(Math.abs(remaining))}
              </Text>
            </View>
          </View>

          {/* Alert Badge for exceeded budgets */}
          {percentage >= 100 && (
            <View style={styles.alertBadge}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
              <Text variant="bodySmall" style={styles.alertText}>
                Orçamento estourado! Revise seus gastos.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  budgetName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryName: {
    opacity: 0.6,
    fontSize: 12,
  },
  statusChip: {
    height: 24,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  periodText: {
    opacity: 0.6,
    fontSize: 12,
  },
  progressSection: {
    marginTop: 8,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amountLabel: {
    opacity: 0.6,
    fontSize: 12,
  },
  spentAmount: {
    fontWeight: 'bold',
  },
  limitAmount: {
    fontWeight: '600',
    opacity: 0.8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentageText: {
    opacity: 0.7,
  },
  remainingText: {
    fontWeight: '600',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  alertText: {
    color: '#dc2626',
    flex: 1,
  },
});
