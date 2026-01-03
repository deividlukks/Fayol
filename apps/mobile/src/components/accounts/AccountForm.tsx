/**
 * AccountForm Component
 *
 * Reusable form for creating and editing accounts
 */

import React, { useState } from 'react';
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
import { ColorPicker } from './ColorPicker';
import { IconPicker } from './IconPicker';

interface AccountFormData {
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT_CARD' | 'CASH';
  balance: string;
  currency: string;
  creditLimit?: string;
  color?: string;
  icon?: string;
}

interface AccountFormProps {
  initialData?: Partial<AccountFormData>;
  onSubmit: (data: AccountFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}

const ACCOUNT_TYPES = [
  { value: 'CHECKING', label: 'Corrente', icon: 'bank' },
  { value: 'SAVINGS', label: 'Poupança', icon: 'piggy-bank' },
  { value: 'INVESTMENT', label: 'Investimento', icon: 'chart-line' },
  { value: 'CREDIT_CARD', label: 'Cartão', icon: 'credit-card' },
  { value: 'CASH', label: 'Dinheiro', icon: 'cash' },
];

const DEFAULT_COLORS = {
  CHECKING: '#3b82f6',
  SAVINGS: '#10b981',
  INVESTMENT: '#8b5cf6',
  CREDIT_CARD: '#f59e0b',
  CASH: '#22c55e',
};

const DEFAULT_ICONS = {
  CHECKING: 'bank',
  SAVINGS: 'piggy-bank',
  INVESTMENT: 'chart-line',
  CREDIT_CARD: 'credit-card',
  CASH: 'cash',
};

export function AccountForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Salvar',
}: AccountFormProps) {
  const theme = useTheme();

  const [formData, setFormData] = useState<AccountFormData>({
    name: initialData?.name || '',
    type: initialData?.type || 'CHECKING',
    balance: initialData?.balance || '0',
    currency: initialData?.currency || 'BRL',
    creditLimit: initialData?.creditLimit || '',
    color: initialData?.color || DEFAULT_COLORS.CHECKING,
    icon: initialData?.icon || DEFAULT_ICONS.CHECKING,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.balance) {
      newErrors.balance = 'Saldo inicial é obrigatório';
    }

    if (formData.type === 'CREDIT_CARD' && !formData.creditLimit) {
      newErrors.creditLimit = 'Limite de crédito é obrigatório para cartões';
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

  const handleTypeChange = (newType: string) => {
    const type = newType as AccountFormData['type'];
    setFormData({
      ...formData,
      type,
      color: formData.color || DEFAULT_COLORS[type],
      icon: formData.icon || DEFAULT_ICONS[type],
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Account Name */}
      <View style={styles.section}>
        <TextInput
          label="Nome da Conta *"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          mode="outlined"
          error={!!errors.name}
          disabled={loading}
          left={<TextInput.Icon icon="text" />}
          placeholder="Ex: Conta Corrente Banco X"
        />
        {errors.name && (
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>
        )}
      </View>

      {/* Account Type */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Tipo de Conta *
        </Text>
        <View style={styles.typeGrid}>
          {ACCOUNT_TYPES.map((type) => (
            <Chip
              key={type.value}
              selected={formData.type === type.value}
              onPress={() => handleTypeChange(type.value)}
              style={styles.typeChip}
              icon={() => (
                <MaterialCommunityIcons
                  name={type.icon}
                  size={18}
                  color={
                    formData.type === type.value
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
              )}
            >
              {type.label}
            </Chip>
          ))}
        </View>
      </View>

      {/* Initial Balance */}
      <View style={styles.section}>
        <TextInput
          label="Saldo Inicial *"
          value={formData.balance}
          onChangeText={(text) => setFormData({ ...formData, balance: formatAmount(text) })}
          mode="outlined"
          keyboardType="decimal-pad"
          error={!!errors.balance}
          disabled={loading}
          left={<TextInput.Icon icon="currency-brl" />}
          placeholder="0,00"
        />
        {errors.balance && (
          <HelperText type="error" visible={!!errors.balance}>
            {errors.balance}
          </HelperText>
        )}
      </View>

      {/* Credit Limit (only for Credit Cards) */}
      {formData.type === 'CREDIT_CARD' && (
        <View style={styles.section}>
          <TextInput
            label="Limite de Crédito *"
            value={formData.creditLimit}
            onChangeText={(text) => setFormData({ ...formData, creditLimit: formatAmount(text) })}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.creditLimit}
            disabled={loading}
            left={<TextInput.Icon icon="credit-card-outline" />}
            placeholder="0,00"
          />
          {errors.creditLimit && (
            <HelperText type="error" visible={!!errors.creditLimit}>
              {errors.creditLimit}
            </HelperText>
          )}
        </View>
      )}

      {/* Customization Section */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Personalização (Opcional)
        </Text>

        <View style={styles.customizationRow}>
          {/* Color Picker Button */}
          <Button
            mode="outlined"
            onPress={() => setShowColorPicker(true)}
            style={styles.customizationButton}
            icon={() => <View style={[styles.colorPreview, { backgroundColor: formData.color }]} />}
          >
            Cor
          </Button>

          {/* Icon Picker Button */}
          <Button
            mode="outlined"
            onPress={() => setShowIconPicker(true)}
            style={styles.customizationButton}
            icon={() => (
              <MaterialCommunityIcons
                name={formData.icon || 'help-circle'}
                size={20}
                color={formData.color}
              />
            )}
          >
            Ícone
          </Button>
        </View>

        {/* Preview */}
        <View style={styles.preview}>
          <View style={[styles.previewIconContainer, { backgroundColor: formData.color + '20' }]}>
            <MaterialCommunityIcons
              name={formData.icon || 'bank'}
              size={32}
              color={formData.color}
            />
          </View>
          <Text variant="bodyMedium" style={styles.previewText}>
            Pré-visualização
          </Text>
        </View>
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

      {/* Color Picker Modal */}
      <ColorPicker
        visible={showColorPicker}
        selectedColor={formData.color}
        onDismiss={() => setShowColorPicker(false)}
        onSelectColor={(color) => setFormData({ ...formData, color })}
      />

      {/* Icon Picker Modal */}
      <IconPicker
        visible={showIconPicker}
        selectedIcon={formData.icon}
        selectedColor={formData.color}
        onDismiss={() => setShowIconPicker(false)}
        onSelectIcon={(icon) => setFormData({ ...formData, icon })}
      />
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    marginBottom: 4,
  },
  customizationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  customizationButton: {
    flex: 1,
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  preview: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewText: {
    opacity: 0.6,
    fontSize: 12,
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
