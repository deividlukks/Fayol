/**
 * TransactionFilters Component
 *
 * Filter panel for transactions (type, category, account, date range)
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Modal, Portal, Button, Chip, Text, Divider, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface Account {
  id: string;
  name: string;
}

interface Filters {
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER' | null;
  categoryId?: string | null;
  accountId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

interface TransactionFiltersProps {
  visible: boolean;
  onDismiss: () => void;
  onApply: (filters: Filters) => void;
  categories?: Category[];
  accounts?: Account[];
  initialFilters?: Filters;
}

export function TransactionFilters({
  visible,
  onDismiss,
  onApply,
  categories = [],
  accounts = [],
  initialFilters = {},
}: TransactionFiltersProps) {
  const theme = useTheme();
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const handleApply = () => {
    onApply(filters);
    onDismiss();
  };

  const handleClear = () => {
    const clearedFilters: Filters = {
      type: null,
      categoryId: null,
      accountId: null,
      startDate: null,
      endDate: null,
    };
    setFilters(clearedFilters);
    onApply(clearedFilters);
    onDismiss();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return '#10b981';
      case 'EXPENSE':
        return '#ef4444';
      case 'TRANSFER':
        return '#3b82f6';
      default:
        return theme.colors.outline;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
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

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Filtros
          </Text>
          <Button mode="text" onPress={onDismiss}>
            Fechar
          </Button>
        </View>

        <Divider />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type Filter */}
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Tipo de Transação
            </Text>
            <View style={styles.chipRow}>
              <Chip
                selected={filters.type === 'INCOME'}
                onPress={() => setFilters({ ...filters, type: 'INCOME' })}
                style={styles.chip}
                icon={() => (
                  <MaterialCommunityIcons
                    name={getTypeIcon('INCOME')}
                    size={18}
                    color={filters.type === 'INCOME' ? '#10b981' : theme.colors.onSurfaceVariant}
                  />
                )}
                selectedColor="#10b981"
              >
                Receita
              </Chip>
              <Chip
                selected={filters.type === 'EXPENSE'}
                onPress={() => setFilters({ ...filters, type: 'EXPENSE' })}
                style={styles.chip}
                icon={() => (
                  <MaterialCommunityIcons
                    name={getTypeIcon('EXPENSE')}
                    size={18}
                    color={filters.type === 'EXPENSE' ? '#ef4444' : theme.colors.onSurfaceVariant}
                  />
                )}
                selectedColor="#ef4444"
              >
                Despesa
              </Chip>
              <Chip
                selected={filters.type === 'TRANSFER'}
                onPress={() => setFilters({ ...filters, type: 'TRANSFER' })}
                style={styles.chip}
                icon={() => (
                  <MaterialCommunityIcons
                    name={getTypeIcon('TRANSFER')}
                    size={18}
                    color={filters.type === 'TRANSFER' ? '#3b82f6' : theme.colors.onSurfaceVariant}
                  />
                )}
                selectedColor="#3b82f6"
              >
                Transferência
              </Chip>
            </View>
          </View>

          <Divider />

          {/* Category Filter */}
          {categories.length > 0 && (
            <>
              <View style={styles.section}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Categoria
                </Text>
                <View style={styles.chipRow}>
                  {categories.slice(0, 6).map((category) => (
                    <Chip
                      key={category.id}
                      selected={filters.categoryId === category.id}
                      onPress={() =>
                        setFilters({
                          ...filters,
                          categoryId: filters.categoryId === category.id ? null : category.id,
                        })
                      }
                      style={styles.chip}
                      icon={() => (
                        <MaterialCommunityIcons
                          name={category.icon || 'tag'}
                          size={16}
                          color={
                            filters.categoryId === category.id
                              ? category.color || theme.colors.primary
                              : theme.colors.onSurfaceVariant
                          }
                        />
                      )}
                      selectedColor={category.color}
                    >
                      {category.name}
                    </Chip>
                  ))}
                </View>
              </View>
              <Divider />
            </>
          )}

          {/* Account Filter */}
          {accounts.length > 0 && (
            <>
              <View style={styles.section}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Conta
                </Text>
                <View style={styles.chipRow}>
                  {accounts.map((account) => (
                    <Chip
                      key={account.id}
                      selected={filters.accountId === account.id}
                      onPress={() =>
                        setFilters({
                          ...filters,
                          accountId: filters.accountId === account.id ? null : account.id,
                        })
                      }
                      style={styles.chip}
                      icon="wallet"
                    >
                      {account.name}
                    </Chip>
                  ))}
                </View>
              </View>
              <Divider />
            </>
          )}

          {/* Date Range - Future implementation */}
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Período
            </Text>
            <Text variant="bodySmall" style={styles.comingSoon}>
              Filtro de data em breve
            </Text>
          </View>
        </ScrollView>

        <Divider />

        <View style={styles.footer}>
          <Button mode="outlined" onPress={handleClear} style={styles.footerButton}>
            Limpar
          </Button>
          <Button mode="contained" onPress={handleApply} style={styles.footerButton}>
            Aplicar
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    paddingVertical: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  comingSoon: {
    opacity: 0.5,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});
