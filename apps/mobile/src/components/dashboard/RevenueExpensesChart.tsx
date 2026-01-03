/**
 * RevenueExpensesChart Component
 *
 * Line chart showing revenue vs expenses over time
 */

import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';

interface ChartData {
  labels: string[];
  revenues: number[];
  expenses: number[];
}

interface RevenueExpensesChartProps {
  data?: ChartData;
  loading?: boolean;
}

export function RevenueExpensesChart({ data, loading }: RevenueExpensesChartProps) {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Default empty data
  const defaultData: ChartData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    revenues: [0, 0, 0, 0, 0, 0],
    expenses: [0, 0, 0, 0, 0, 0],
  };

  const chartData = data || defaultData;

  // Prepare data for chart
  const preparedData = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.revenues,
        color: () => '#10b981', // Green for revenues
        strokeWidth: 2,
      },
      {
        data: chartData.expenses,
        color: () => '#ef4444', // Red for expenses
        strokeWidth: 2,
      },
    ],
    legend: ['Receitas', 'Despesas'],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
  };

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            Receitas vs Despesas
          </Text>
          <Text variant="labelSmall" style={styles.subtitle}>
            Últimos 6 meses
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text variant="bodyMedium" style={styles.loadingText}>
              Carregando gráfico...
            </Text>
          </View>
        ) : (
          <LineChart
            data={preparedData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero
          />
        )}

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text variant="labelSmall" style={styles.legendText}>
              Receitas
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text variant="labelSmall" style={styles.legendText}>
              Despesas
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.6,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    opacity: 0.6,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    opacity: 0.8,
  },
});
