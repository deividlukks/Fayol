import React from 'react';
import { Modal, Portal } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { BudgetForm } from './BudgetForm';
import type { CreateBudgetDto } from '@fayol/shared-types';
import { useBudgetMutations } from '../../hooks/mutations/useBudgetMutations';

interface CreateBudgetModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export function CreateBudgetModal({ visible, onDismiss, onSuccess }: CreateBudgetModalProps) {
  const { createBudget } = useBudgetMutations();

  const handleSubmit = async (data: CreateBudgetDto) => {
    try {
      await createBudget.mutateAsync(data);
      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <BudgetForm
          onSubmit={handleSubmit}
          onCancel={onDismiss}
          isLoading={createBudget.isPending}
        />
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
});
