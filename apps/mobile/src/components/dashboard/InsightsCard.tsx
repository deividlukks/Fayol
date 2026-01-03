/**
 * InsightsCard Component
 *
 * Displays AI-generated financial insights
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Chip, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Insight {
  id: string;
  type: 'SUCCESS' | 'WARNING' | 'INFO' | 'DANGER';
  title: string;
  message: string;
  icon?: string;
}

interface InsightsCardProps {
  insights: Insight[];
  loading?: boolean;
}

export function InsightsCard({ insights, loading }: InsightsCardProps) {
  const theme = useTheme();

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'SUCCESS':
        return '#10b981';
      case 'WARNING':
        return '#f59e0b';
      case 'INFO':
        return '#3b82f6';
      case 'DANGER':
        return '#ef4444';
      default:
        return theme.colors.primary;
    }
  };

  const getInsightIcon = (type: Insight['type'], customIcon?: string) => {
    if (customIcon) return customIcon;

    switch (type) {
      case 'SUCCESS':
        return 'check-circle';
      case 'WARNING':
        return 'alert-circle';
      case 'INFO':
        return 'information';
      case 'DANGER':
        return 'alert-octagon';
      default:
        return 'lightbulb';
    }
  };

  const getInsightBackgroundColor = (type: Insight['type']) => {
    switch (type) {
      case 'SUCCESS':
        return '#dcfce7';
      case 'WARNING':
        return '#fef3c7';
      case 'INFO':
        return '#dbeafe';
      case 'DANGER':
        return '#fee2e2';
      default:
        return theme.colors.surfaceVariant;
    }
  };

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="brain" size={24} color={theme.colors.primary} />
            <View>
              <Text variant="titleMedium" style={styles.title}>
                Insights Financeiros
              </Text>
              <Text variant="labelSmall" style={styles.subtitle}>
                Gerados por IA
              </Text>
            </View>
          </View>
          <Chip
            mode="flat"
            textStyle={styles.chipText}
            style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
          >
            AI
          </Chip>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text variant="bodyMedium" style={styles.loadingText}>
              Analisando suas finanças...
            </Text>
          </View>
        ) : insights.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={48}
              color={theme.colors.outline}
            />
            <Text variant="bodyMedium" style={styles.emptyText}>
              Sem insights no momento
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Continue registrando suas transações
            </Text>
          </View>
        ) : (
          <View style={styles.insightsList}>
            {insights.map((insight) => (
              <View
                key={insight.id}
                style={[
                  styles.insightItem,
                  { backgroundColor: getInsightBackgroundColor(insight.type) },
                ]}
              >
                <View style={styles.insightHeader}>
                  <MaterialCommunityIcons
                    name={getInsightIcon(insight.type, insight.icon)}
                    size={20}
                    color={getInsightColor(insight.type)}
                  />
                  <Text
                    variant="labelLarge"
                    style={[styles.insightTitle, { color: getInsightColor(insight.type) }]}
                  >
                    {insight.title}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.insightMessage}>
                  {insight.message}
                </Text>
              </View>
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
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 2,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    padding: 12,
    borderRadius: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  insightTitle: {
    fontWeight: '600',
  },
  insightMessage: {
    opacity: 0.9,
    lineHeight: 18,
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
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    opacity: 0.6,
  },
});
