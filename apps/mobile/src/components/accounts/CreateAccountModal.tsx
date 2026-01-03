/**
 * CreateAccountModal Component
 *
 * Modal for creating a new account
 */

import React from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Modal, Portal, Text, Divider, useTheme, IconButton } from 'react-native-paper';
import { AccountForm } from './AccountForm';
import { useCreateAccount } from '../../hooks';

interface CreateAccountModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export function CreateAccountModal({ visible, onDismiss, onSuccess }: CreateAccountModalProps) {
  const theme = useTheme();

  // Create account mutation
  const createAccount = useCreateAccount();

  const handleSubmit = async (data: any) => {
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

      await createAccount.mutateAsync(accountData);

      Alert.alert('Sucesso!', 'Conta criada com sucesso', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            onDismiss();
          },
        },
      ]);
    } catch (error: any) {
      console.error('[CreateAccountModal] Error:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível criar a conta');
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
            Nova Conta
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        <Divider />

        <View style={styles.content}>
          <AccountForm
            onSubmit={handleSubmit}
            onCancel={onDismiss}
            loading={createAccount.isPending}
            submitLabel="Criar Conta"
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
