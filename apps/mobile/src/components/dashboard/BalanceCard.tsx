/**
 * BalanceCard Component
 *
 * Displays the total balance across all accounts
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface BalanceCardProps {
  balance: number;
  income?: number;
  expenses?: number;
  loading?: boolean;
}

export function BalanceCard({ balance, income, expenses, loading }: BalanceCardProps) {
  const theme = useTheme();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="wallet" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.title}>
              Saldo Total
            </Text>
          </View>
        </View>

        <Text variant="displaySmall" style={[styles.balance, { color: theme.colors.primary }]}>
          {loading ? '...' : formatCurrency(balance)}
        </Text>

        {(income !== undefined || expenses !== undefined) && (
          <View style={styles.detailsRow}>
            {income !== undefined && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="arrow-up" size={20} color="#10b981" />
                <View style={styles.detailTextContainer}>
                  <Text variant="labelSmall" style={styles.detailLabel}>
                    Receitas
                  </Text>
                  <Text variant="bodyMedium" style={[styles.detailValue, { color: '#10b981' }]}>
                    {formatCurrency(income)}
                  </Text>
                </View>
              </View>
            )}

            {expenses !== undefined && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="arrow-down" size={20} color="#ef4444" />
                <View style={styles.detailTextContainer}>
                  <Text variant="labelSmall" style={styles.detailLabel}>
                    Despesas
                  </Text>
                  <Text variant="bodyMedium" style={[styles.detailValue, { color: '#ef4444' }]}>
                    {formatCurrency(expenses)}
                  </Text>
                </View>
              </View>
            )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '600',
  },
  balance: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    opacity: 0.7,
    marginBottom: 2,
  },
  detailValue: {
    fontWeight: '600',
  },
});
