/**
 * EditTransactionModal Component
 *
 * Modal for editing an existing transaction
 */

import React from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Modal, Portal, Text, Divider, useTheme, IconButton, Button } from 'react-native-paper';
import { TransactionForm } from './TransactionForm';
import { useUpdateTransaction, useDeleteTransaction } from '../../hooks';
import { useCategories, useAccounts } from '../../hooks';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId: string;
  accountId: string;
  date: string;
  notes?: string;
}

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export function EditTransactionModal({
  visible,
  transaction,
  onDismiss,
  onSuccess,
}: EditTransactionModalProps) {
  const theme = useTheme();

  // Fetch categories and accounts
  const { data: categoriesData } = useCategories();
  const { data: accountsData } = useAccounts();

  // Mutations
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const categories = categoriesData?.data || [];
  const accounts = accountsData?.data || [];

  const handleSubmit = async (data: any) => {
    if (!transaction) return;

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

      await updateTransaction.mutateAsync({
        id: transaction.id,
        data: transactionData,
      });

      Alert.alert('Sucesso!', 'Transação atualizada com sucesso', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            onDismiss();
          },
        },
      ]);
    } catch (error: any) {
      console.error('[EditTransactionModal] Error:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível atualizar a transação');
    }
  };

  const handleDelete = () => {
    if (!transaction) return;

    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction.mutateAsync(transaction.id);

              Alert.alert('Sucesso!', 'Transação excluída com sucesso', [
                {
                  text: 'OK',
                  onPress: () => {
                    onSuccess?.();
                    onDismiss();
                  },
                },
              ]);
            } catch (error: any) {
              console.error('[EditTransactionModal] Delete error:', error);
              Alert.alert('Erro', error?.message || 'Não foi possível excluir a transação');
            }
          },
        },
      ]
    );
  };

  if (!transaction) return null;

  // Prepare initial data for form
  const initialData = {
    description: transaction.description,
    amount: transaction.amount.toString().replace('.', ','),
    type: transaction.type,
    categoryId: transaction.categoryId,
    accountId: transaction.accountId,
    date: new Date(transaction.date),
    notes: transaction.notes,
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
            Editar Transação
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        <Divider />

        <View style={styles.content}>
          <TransactionForm
            initialData={initialData}
            categories={categories}
            accounts={accounts}
            onSubmit={handleSubmit}
            onCancel={onDismiss}
            loading={updateTransaction.isPending}
            submitLabel="Salvar Alterações"
          />

          {/* Delete Button */}
          <Button
            mode="text"
            onPress={handleDelete}
            textColor="#ef4444"
            icon="delete"
            style={styles.deleteButton}
            loading={deleteTransaction.isPending}
            disabled={updateTransaction.isPending || deleteTransaction.isPending}
          >
            Excluir Transação
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
  deleteButton: {
    marginTop: 16,
  },
});
