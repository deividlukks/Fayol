import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import type { Investment } from '@fayol/shared-types';

interface InvestmentCardProps {
  investment: Investment;
  onPress: () => void;
}

export function InvestmentCard({ investment, onPress }: InvestmentCardProps) {
  const theme = useTheme();

  const gain = (investment.currentValue || 0) - (investment.totalCost || 0);
  const gainPercentage = investment.totalCost > 0 ? (gain / investment.totalCost) * 100 : 0;
  const isPositive = gain >= 0;

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      STOCK: 'Ação',
      FII: 'FII',
      CRYPTO: 'Cripto',
      ETF: 'ETF',
      FIXED_INCOME: 'Renda Fixa',
    };
    return types[type] || type;
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.ticker}>
          {investment.ticker}
        </Text>
        <Text variant="bodySmall" style={styles.type}>
          {getTypeLabel(investment.type)}
        </Text>

        <Text variant="bodyMedium" style={styles.quantity}>
          Quantidade: {investment.quantity}
        </Text>

        <Text variant="headlineSmall" style={styles.value}>
          R${' '}
          {investment.currentValue?.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.gain, { color: isPositive ? '#10b981' : '#ef4444' }]}
        >
          {isPositive ? '+' : ''}
          R$ {gain.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (
          {gainPercentage.toFixed(2)}%)
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  ticker: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  type: {
    opacity: 0.7,
    marginBottom: 12,
  },
  quantity: {
    marginBottom: 8,
  },
  value: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gain: {
    fontWeight: '600',
  },
});
