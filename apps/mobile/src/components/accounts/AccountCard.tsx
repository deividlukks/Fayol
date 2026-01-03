/**
 * AccountCard Component
 *
 * Displays individual account information with type-specific styling
 */

import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT_CARD' | 'CASH';
  balance: number;
  currency?: string;
  color?: string;
  icon?: string;
  creditLimit?: number;
}

interface AccountCardProps {
  account: Account;
  onPress?: (account: Account) => void;
}

const ACCOUNT_TYPE_CONFIG = {
  CHECKING: {
    label: 'Conta Corrente',
    icon: 'bank',
    color: '#3b82f6',
  },
  SAVINGS: {
    label: 'Poupança',
    icon: 'piggy-bank',
    color: '#10b981',
  },
  INVESTMENT: {
    label: 'Investimento',
    icon: 'chart-line',
    color: '#8b5cf6',
  },
  CREDIT_CARD: {
    label: 'Cartão de Crédito',
    icon: 'credit-card',
    color: '#f59e0b',
  },
  CASH: {
    label: 'Dinheiro',
    icon: 'cash',
    color: '#22c55e',
  },
};

export function AccountCard({ account, onPress }: AccountCardProps) {
  const theme = useTheme();

  const typeConfig = ACCOUNT_TYPE_CONFIG[account.type];
  const accountColor = account.color || typeConfig.color;
  const accountIcon = account.icon || typeConfig.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: account.currency || 'BRL',
    }).format(value);
  };

  const getCreditCardAvailable = () => {
    if (account.type !== 'CREDIT_CARD' || !account.creditLimit) return null;
    const available = account.creditLimit - Math.abs(account.balance);
    return available;
  };

  const creditAvailable = getCreditCardAvailable();

  return (
    <Pressable onPress={() => onPress?.(account)}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: accountColor + '20' }]}>
              <MaterialCommunityIcons name={accountIcon} size={24} color={accountColor} />
            </View>
            <View style={styles.headerInfo}>
              <Text variant="titleMedium" style={styles.accountName}>
                {account.name}
              </Text>
              <Text variant="bodySmall" style={styles.accountType}>
                {typeConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.balanceContainer}>
            <Text variant="labelSmall" style={styles.balanceLabel}>
              {account.type === 'CREDIT_CARD' ? 'Fatura Atual' : 'Saldo'}
            </Text>
            <Text
              variant="headlineSmall"
              style={[
                styles.balance,
                {
                  color:
                    account.balance >= 0
                      ? account.type === 'CREDIT_CARD'
                        ? '#ef4444'
                        : '#10b981'
                      : '#ef4444',
                },
              ]}
            >
              {formatCurrency(
                account.type === 'CREDIT_CARD' ? Math.abs(account.balance) : account.balance
              )}
            </Text>
          </View>

          {/* Credit Card Specific Info */}
          {account.type === 'CREDIT_CARD' && account.creditLimit && (
            <View style={styles.creditInfo}>
              <View style={styles.creditRow}>
                <Text variant="bodySmall" style={styles.creditLabel}>
                  Limite:
                </Text>
                <Text variant="bodySmall" style={styles.creditValue}>
                  {formatCurrency(account.creditLimit)}
                </Text>
              </View>
              <View style={styles.creditRow}>
                <Text variant="bodySmall" style={styles.creditLabel}>
                  Disponível:
                </Text>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.creditValue,
                    { color: creditAvailable && creditAvailable > 0 ? '#10b981' : '#ef4444' },
                  ]}
                >
                  {formatCurrency(creditAvailable || 0)}
                </Text>
              </View>

              {/* Credit Limit Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min((Math.abs(account.balance) / account.creditLimit) * 100, 100)}%`,
                      backgroundColor:
                        (Math.abs(account.balance) / account.creditLimit) * 100 > 80
                          ? '#ef4444'
                          : (Math.abs(account.balance) / account.creditLimit) * 100 > 50
                            ? '#f59e0b'
                            : '#10b981',
                    },
                  ]}
                />
              </View>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  accountName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  accountType: {
    opacity: 0.6,
  },
  balanceContainer: {
    marginBottom: 8,
  },
  balanceLabel: {
    opacity: 0.6,
    marginBottom: 4,
  },
  balance: {
    fontWeight: 'bold',
  },
  creditInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  creditLabel: {
    opacity: 0.6,
  },
  creditValue: {
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
