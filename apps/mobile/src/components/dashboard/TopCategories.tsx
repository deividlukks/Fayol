/**
 * TopCategories Component
 *
 * Displays top spending categories
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { CategoryCard } from './CategoryCard';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  amount: number;
  percentage?: number;
}

interface TopCategoriesProps {
  categories: Category[];
  loading?: boolean;
  onViewAll?: () => void;
}

export function TopCategories({ categories, loading, onViewAll }: TopCategoriesProps) {
  const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.header}>
          <View>
            <Text variant="titleMedium" style={styles.title}>
              Top Categorias
            </Text>
            <Text variant="labelSmall" style={styles.subtitle}>
              Maiores despesas
            </Text>
          </View>
          {onViewAll && (
            <Button mode="text" compact onPress={onViewAll}>
              Ver todas
            </Button>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text variant="bodyMedium" style={styles.loadingText}>
              Carregando categorias...
            </Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Nenhuma categoria encontrada
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Crie transações para ver suas categorias
            </Text>
          </View>
        ) : (
          <View style={styles.categoriesList}>
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} totalAmount={totalAmount} />
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
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    opacity: 0.6,
  },
  categoriesList: {
    gap: 8,
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
