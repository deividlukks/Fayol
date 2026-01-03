/**
 * EditAccountModal Component
 *
 * Modal for editing an existing account
 */

import React from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Modal, Portal, Text, Divider, useTheme, IconButton, Button } from 'react-native-paper';
import { AccountForm } from './AccountForm';
import { useUpdateAccount, useDeleteAccount } from '../../hooks';

interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT_CARD' | 'CASH';
  balance: number;
  currency?: string;
  creditLimit?: number;
  color?: string;
  icon?: string;
}

interface EditAccountModalProps {
  visible: boolean;
  account: Account | null;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export function EditAccountModal({
  visible,
  account,
  onDismiss,
  onSuccess,
}: EditAccountModalProps) {
  const theme = useTheme();

  // Mutations
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const handleSubmit = async (data: any) => {
    if (!account) return;

    try {
      // Convert balance and creditLimit from string to number
      const balance = parseFloat(data.balance.replace(',', '.'));
      const creditLimit = data.creditLimit
        ? parseFloat(data.creditLimit.replace(',', '.'))
        : undefined;

      const accountData = {
        name: data.name,
        type: data.type,
        balance,
        currency: data.currency,
        creditLimit,
        color: data.color,
        icon: data.icon,
      };

      await updateAccount.mutateAsync({
        id: account.id,
        data: accountData,
      });

      Alert.alert('Sucesso!', 'Conta atualizada com sucesso', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            onDismiss();
          },
        },
      ]);
    } catch (error: any) {
      console.error('[EditAccountModal] Error:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível atualizar a conta');
    }
  };

  const handleDelete = () => {
    if (!account) return;

    Alert.alert(
      'Confirmar Arquivamento',
      'Tem certeza que deseja arquivar esta conta? As transações associadas não serão excluídas.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount.mutateAsync(account.id);

              Alert.alert('Sucesso!', 'Conta arquivada com sucesso', [
                {
                  text: 'OK',
                  onPress: () => {
                    onSuccess?.();
                    onDismiss();
                  },
                },
              ]);
            } catch (error: any) {
              console.error('[EditAccountModal] Delete error:', error);
              Alert.alert('Erro', error?.message || 'Não foi possível arquivar a conta');
            }
          },
        },
      ]
    );
  };

  if (!account) return null;

  // Prepare initial data for form
  const initialData = {
    name: account.name,
    type: account.type,
    balance: account.balance.toString().replace('.', ','),
    currency: account.currency || 'BRL',
    creditLimit: account.creditLimit?.toString().replace('.', ','),
    color: account.color,
    icon: account.icon,
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
            Editar Conta
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        <Divider />

        <View style={styles.content}>
          <AccountForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={onDismiss}
            loading={updateAccount.isPending}
            submitLabel="Salvar Alterações"
          />

          {/* Archive/Delete Button */}
          <Button
            mode="text"
            onPress={handleDelete}
            textColor="#ef4444"
            icon="archive"
            style={styles.deleteButton}
            loading={deleteAccount.isPending}
            disabled={updateAccount.isPending || deleteAccount.isPending}
          >
            Arquivar Conta
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
