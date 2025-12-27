/**
 * TransactionForm Component
 *
 * Reusable form for creating and editing transactions
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Text,
  useTheme,
  HelperText,
  Chip,
} from 'react-native-paper';
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
  type?: string;
}

interface TransactionFormData {
  description: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId: string;
  accountId: string;
  date: Date;
  notes?: string;
}

interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  categories: Category[];
  accounts: Account[];
  onSubmit: (data: TransactionFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export function TransactionForm({
  initialData,
  categories,
  accounts,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Salvar',
}: TransactionFormProps) {
  const theme = useTheme();

  const [formData, setFormData] = useState<TransactionFormData>({
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    type: initialData?.type || 'EXPENSE',
    categoryId: initialData?.categoryId || '',
    accountId: initialData?.accountId || '',
    date: initialData?.date || new Date(),
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Filter categories by transaction type
  const filteredCategories = categories.filter((cat) => {
    // This is a placeholder - in real app, categories would have a type field
    return true;
  });

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Selecione uma categoria';
    }

    if (!formData.accountId) {
      newErrors.accountId = 'Selecione uma conta';
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Transaction Type */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Tipo de Transação
        </Text>
        <SegmentedButtons
          value={formData.type}
          onValueChange={(value) =>
            setFormData({ ...formData, type: value as TransactionFormData['type'] })
          }
          buttons={[
            {
              value: 'EXPENSE',
              label: 'Despesa',
              icon: 'arrow-up-circle',
              style: { backgroundColor: formData.type === 'EXPENSE' ? '#fee2e2' : undefined },
            },
            {
              value: 'INCOME',
              label: 'Receita',
              icon: 'arrow-down-circle',
              style: { backgroundColor: formData.type === 'INCOME' ? '#dcfce7' : undefined },
            },
            {
              value: 'TRANSFER',
              label: 'Transferência',
              icon: 'swap-horizontal-circle',
              style: { backgroundColor: formData.type === 'TRANSFER' ? '#dbeafe' : undefined },
            },
          ]}
        />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <TextInput
          label="Descrição *"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          mode="outlined"
          error={!!errors.description}
          disabled={loading}
          left={<TextInput.Icon icon="text" />}
          placeholder="Ex: Almoço no restaurante"
        />
        {errors.description && (
          <HelperText type="error" visible={!!errors.description}>
            {errors.description}
          </HelperText>
        )}
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <TextInput
          label="Valor *"
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

      {/* Category */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Categoria *
        </Text>
        {filteredCategories.length === 0 ? (
          <Text variant="bodySmall" style={styles.emptyText}>
            Nenhuma categoria disponível
          </Text>
        ) : (
          <View style={styles.chipContainer}>
            {filteredCategories.map((category) => (
              <Chip
                key={category.id}
                selected={formData.categoryId === category.id}
                onPress={() => setFormData({ ...formData, categoryId: category.id })}
                style={styles.chip}
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
        {errors.categoryId && (
          <HelperText type="error" visible={!!errors.categoryId}>
            {errors.categoryId}
          </HelperText>
        )}
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Conta *
        </Text>
        {accounts.length === 0 ? (
          <Text variant="bodySmall" style={styles.emptyText}>
            Nenhuma conta disponível
          </Text>
        ) : (
          <View style={styles.chipContainer}>
            {accounts.map((account) => (
              <Chip
                key={account.id}
                selected={formData.accountId === account.id}
                onPress={() => setFormData({ ...formData, accountId: account.id })}
                style={styles.chip}
                icon="wallet"
              >
                {account.name}
              </Chip>
            ))}
          </View>
        )}
        {errors.accountId && (
          <HelperText type="error" visible={!!errors.accountId}>
            {errors.accountId}
          </HelperText>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <TextInput
          label="Observações (opcional)"
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          mode="outlined"
          multiline
          numberOfLines={3}
          disabled={loading}
          left={<TextInput.Icon icon="note-text" />}
          placeholder="Adicione observações sobre esta transação"
        />
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
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
