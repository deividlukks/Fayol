/**
 * BudgetForm Component
 *
 * Reusable form for creating and editing budgets
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme, HelperText, Chip, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from 'date-fns';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface BudgetFormData {
  name: string;
  amount: string;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  categoryId?: string;
  startDate: Date;
  endDate: Date;
}

interface BudgetFormProps {
  initialData?: Partial<BudgetFormData>;
  categories: Category[];
  onSubmit: (data: BudgetFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}

const PERIOD_OPTIONS = [
  { value: 'MONTHLY', label: 'Mensal', icon: 'calendar-month' },
  { value: 'QUARTERLY', label: 'Trimestral', icon: 'calendar-range' },
  { value: 'YEARLY', label: 'Anual', icon: 'calendar' },
  { value: 'CUSTOM', label: 'Personalizado', icon: 'calendar-edit' },
];

export function BudgetForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Salvar',
}: BudgetFormProps) {
  const theme = useTheme();

  const [formData, setFormData] = useState<BudgetFormData>({
    name: initialData?.name || '',
    amount: initialData?.amount || '',
    period: initialData?.period || 'MONTHLY',
    categoryId: initialData?.categoryId || undefined,
    startDate: initialData?.startDate || startOfMonth(new Date()),
    endDate: initialData?.endDate || endOfMonth(new Date()),
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Update dates when period changes
  useEffect(() => {
    if (!initialData) {
      const today = new Date();
      let start: Date;
      let end: Date;

      switch (formData.period) {
        case 'MONTHLY':
          start = startOfMonth(today);
          end = endOfMonth(today);
          break;
        case 'QUARTERLY':
          start = startOfQuarter(today);
          end = endOfQuarter(today);
          break;
        case 'YEARLY':
          start = startOfYear(today);
          end = endOfYear(today);
          break;
        case 'CUSTOM':
          // Keep current dates for custom
          return;
        default:
          start = startOfMonth(today);
          end = endOfMonth(today);
      }

      setFormData((prev) => ({ ...prev, startDate: start, endDate: end }));
    }
  }, [formData.period, initialData]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (formData.startDate >= formData.endDate) {
      newErrors.dates = 'Data final deve ser posterior à data inicial';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal separator
    const cleaned = value.replace(/[^\d,]/g, '');
    return cleaned;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Budget Name */}
      <View style={styles.section}>
        <TextInput
          label="Nome do Orçamento *"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          mode="outlined"
          error={!!errors.name}
          disabled={loading}
          left={<TextInput.Icon icon="text" />}
          placeholder="Ex: Alimentação Mensal"
        />
        {errors.name && (
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>
        )}
      </View>

      {/* Budget Amount */}
      <View style={styles.section}>
        <TextInput
          label="Valor Limite *"
          value={formData.amount}
          onChangeText={(text) => setFormData({ ...formData, amount: formatAmount(text) })}
          mode="outlined"
          keyboardType="decimal-pad"
          error={!!errors.amount}
          disabled={loading}
          left={<TextInput.Icon icon="currency-brl" />}
          placeholder="0,00"
        />
        {errors.amount && (
          <HelperText type="error" visible={!!errors.amount}>
            {errors.amount}
          </HelperText>
        )}
      </View>

      {/* Period Selection */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Período *
        </Text>
        <View style={styles.periodGrid}>
          {PERIOD_OPTIONS.map((period) => (
            <Chip
              key={period.value}
              selected={formData.period === period.value}
              onPress={() =>
                setFormData({ ...formData, period: period.value as BudgetFormData['period'] })
              }
              style={styles.periodChip}
              icon={() => (
                <MaterialCommunityIcons
                  name={period.icon}
                  size={18}
                  color={
                    formData.period === period.value
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
              )}
            >
              {period.label}
            </Chip>
          ))}
        </View>
      </View>

      {/* Date Display */}
      <View style={styles.section}>
        <View style={styles.dateInfoCard}>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-start" size={20} color={theme.colors.primary} />
            <View style={styles.dateInfo}>
              <Text variant="bodySmall" style={styles.dateLabel}>
                Início
              </Text>
              <Text variant="titleSmall" style={styles.dateValue}>
                {formatDate(formData.startDate)}
              </Text>
            </View>
          </View>
          <Divider style={styles.dateDivider} />
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-end" size={20} color={theme.colors.primary} />
            <View style={styles.dateInfo}>
              <Text variant="bodySmall" style={styles.dateLabel}>
                Término
              </Text>
              <Text variant="titleSmall" style={styles.dateValue}>
                {formatDate(formData.endDate)}
              </Text>
            </View>
          </View>
        </View>
        {errors.dates && (
          <HelperText type="error" visible={!!errors.dates}>
            {errors.dates}
          </HelperText>
        )}
      </View>

      {/* Category Selection (Optional) */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Categoria (Opcional)
        </Text>
        <Text variant="bodySmall" style={styles.helperText}>
          Deixe vazio para orçamento global
        </Text>
        {categories.length === 0 ? (
          <Text variant="bodySmall" style={styles.emptyText}>
            Nenhuma categoria disponível
          </Text>
        ) : (
          <View style={styles.categoryGrid}>
            <Chip
              selected={!formData.categoryId}
              onPress={() => setFormData({ ...formData, categoryId: undefined })}
              style={styles.categoryChip}
              icon="view-grid"
            >
              Todas
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category.id}
                selected={formData.categoryId === category.id}
                onPress={() => setFormData({ ...formData, categoryId: category.id })}
                style={styles.categoryChip}
                icon={() => (
                  <MaterialCommunityIcons
                    name={category.icon || 'tag'}
                    size={16}
                    color={
                      formData.categoryId === category.id
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
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={onCancel} style={styles.button} disabled={loading}>
          Cancelar
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          {submitLabel}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  helperText: {
    opacity: 0.6,
    marginBottom: 8,
    fontSize: 12,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    marginBottom: 4,
  },
  dateInfoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    opacity: 0.6,
    fontSize: 12,
    marginBottom: 2,
  },
  dateValue: {
    fontWeight: '600',
  },
  dateDivider: {
    marginVertical: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 4,
  },
  emptyText: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    flex: 1,
  },
});
