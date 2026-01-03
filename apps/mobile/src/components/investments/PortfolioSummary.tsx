import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface PortfolioSummaryProps {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  gainPercentage: number;
}

export function PortfolioSummary({
  totalValue,
  totalCost,
  totalGain,
  gainPercentage,
}: PortfolioSummaryProps) {
  const isPositive = totalGain >= 0;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Resumo do Portfólio
        </Text>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text variant="bodySmall" style={styles.label}>
              Valor Total
            </Text>
            <Text variant="headlineSmall" style={styles.value}>
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.column}>
            <Text variant="bodySmall" style={styles.label}>
              Custo Total
            </Text>
            <Text variant="bodyLarge" style={styles.cost}>
              R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.gainContainer}>
          <Text variant="bodySmall" style={styles.label}>
            Ganho/Perda
          </Text>
          <Text
            variant="headlineSmall"
            style={[styles.gain, { color: isPositive ? '#10b981' : '#ef4444' }]}
          >
            {isPositive ? '+' : ''}
            R$ {totalGain.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (
            {gainPercentage.toFixed(2)}%)
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  label: {
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontWeight: 'bold',
  },
  cost: {
    fontWeight: '600',
    opacity: 0.7,
  },
  gainContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  gain: {
    fontWeight: 'bold',
  },
});
