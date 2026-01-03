import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import type { Investment, CreateInvestmentDto, UpdateInvestmentDto } from '@fayol/shared-types';

interface InvestmentFormProps {
  initialData?: Investment;
  onSubmit: (data: CreateInvestmentDto | UpdateInvestmentDto) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
}

export function InvestmentForm({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  isLoading,
}: InvestmentFormProps) {
  const [type, setType] = useState<string>(initialData?.type || 'STOCK');
  const [ticker, setTicker] = useState(initialData?.ticker || '');
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '');
  const [averagePrice, setAveragePrice] = useState(initialData?.averagePrice?.toString() || '');

  const handleSubmit = async () => {
    const data = {
      type,
      ticker: ticker.toUpperCase(),
      quantity: parseFloat(quantity),
      averagePrice: parseFloat(averagePrice),
    };

    await onSubmit(data);
  };

  const isValid =
    ticker && quantity && averagePrice && parseFloat(quantity) > 0 && parseFloat(averagePrice) > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text variant="headlineSmall" style={styles.title}>
        {initialData ? 'Editar Investimento' : 'Novo Investimento'}
      </Text>

      <SegmentedButtons
        value={type}
        onValueChange={setType}
        buttons={[
          { value: 'STOCK', label: 'Ação' },
          { value: 'FII', label: 'FII' },
          { value: 'CRYPTO', label: 'Cripto' },
        ]}
        style={styles.segmented}
      />

      <SegmentedButtons
        value={type}
        onValueChange={setType}
        buttons={[
          { value: 'ETF', label: 'ETF' },
          { value: 'FIXED_INCOME', label: 'Renda Fixa' },
        ]}
        style={styles.segmented}
      />

      <TextInput
        label="Ticker/Código"
        value={ticker}
        onChangeText={setTicker}
        mode="outlined"
        style={styles.input}
        autoCapitalize="characters"
        placeholder="Ex: PETR4, MXRF11, BTC"
      />

      <TextInput
        label="Quantidade"
        value={quantity}
        onChangeText={setQuantity}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
        placeholder="Ex: 100"
      />

      <TextInput
        label="Preço Médio (R$)"
        value={averagePrice}
        onChangeText={setAveragePrice}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
        placeholder="Ex: 25.50"
      />

      <View style={styles.actions}>
        <Button mode="outlined" onPress={onCancel} style={styles.button} disabled={isLoading}>
          Cancelar
        </Button>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          disabled={!isValid || isLoading}
          loading={isLoading}
        >
          {initialData ? 'Salvar' : 'Criar'}
        </Button>
      </View>

      {initialData && onDelete && (
        <Button
          mode="outlined"
          onPress={onDelete}
          style={styles.deleteButton}
          textColor="#ef4444"
          disabled={isLoading}
        >
          Excluir Investimento
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  segmented: {
    marginBottom: 12,
  },
  input: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  deleteButton: {
    marginTop: 16,
  },
});
