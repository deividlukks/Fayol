/**
 * CreateTransactionModal Component
 *
 * Modal for creating a new transaction
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Text, Divider, useTheme, IconButton } from 'react-native-paper';
import { TransactionForm } from './TransactionForm';
import { useCreateTransaction } from '../../hooks';
import { useCategories, useAccounts } from '../../hooks';
import { Alert } from 'react-native';

interface CreateTransactionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export function CreateTransactionModal({
  visible,
  onDismiss,
  onSuccess,
}: CreateTransactionModalProps) {
  const theme = useTheme();

  // Fetch categories and accounts
  const { data: categoriesData } = useCategories();
  const { data: accountsData } = useAccounts();

  // Create transaction mutation
  const createTransaction = useCreateTransaction();

  const categories = categoriesData?.data || [];
  const accounts = accountsData?.data || [];

  const handleSubmit = async (data: any) => {
    try {
      // Convert amount from string to number
      const amount = parseFloat(data.amount.replace(',', '.'));

      const transactionData = {
        description: data.description,
        amount,
        type: data.type,
        categoryId: data.categoryId,
        accountId: data.accountId,
        date: data.date.toISOString(),
        notes: data.notes || undefined,
      };

      await createTransaction.mutateAsync(transactionData);

      Alert.alert('Sucesso!', 'Transação criada com sucesso', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            onDismiss();
          },
        },
      ]);
    } catch (error: any) {
      console.error('[CreateTransactionModal] Error:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível criar a transação');
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
            Nova Transação
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        <Divider />

        <View style={styles.content}>
          <TransactionForm
            categories={categories}
            accounts={accounts}
            onSubmit={handleSubmit}
            onCancel={onDismiss}
            loading={createTransaction.isPending}
            submitLabel="Criar Transação"
          />
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
});
