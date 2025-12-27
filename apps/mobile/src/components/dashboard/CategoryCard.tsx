/**
 * CategoryCard Component
 *
 * Displays a category with spending amount and percentage
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  amount: number;
  percentage?: number;
}

interface CategoryCardProps {
  category: Category;
  totalAmount?: number;
}

export function CategoryCard({ category, totalAmount }: CategoryCardProps) {
  const theme = useTheme();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculatePercentage = () => {
    if (category.percentage !== undefined) {
      return category.percentage;
    }
    if (totalAmount && totalAmount > 0) {
      return (category.amount / totalAmount) * 100;
    }
    return 0;
  };

  const percentage = calculatePercentage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: category.color || theme.colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name={category.icon || 'tag'}
              size={20}
              color={category.color || theme.colors.primary}
            />
          </View>
          <Text variant="bodyMedium" style={styles.categoryName}>
            {category.name}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <Text variant="bodyMedium" style={styles.amount}>
            {formatCurrency(category.amount)}
          </Text>
          <Text variant="labelSmall" style={styles.percentage}>
            {percentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={percentage / 100}
        color={category.color || theme.colors.primary}
        style={styles.progressBar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontWeight: '600',
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amount: {
    fontWeight: 'bold',
  },
  percentage: {
    opacity: 0.6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});
