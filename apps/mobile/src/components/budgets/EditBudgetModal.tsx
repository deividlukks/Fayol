import React from 'react';
import { Modal, Portal } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { BudgetForm } from './BudgetForm';
import type { Budget, UpdateBudgetDto } from '@fayol/shared-types';
import { useBudgetMutations } from '../../hooks/mutations/useBudgetMutations';

interface EditBudgetModalProps {
  visible: boolean;
  budget: Budget;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export function EditBudgetModal({ visible, budget, onDismiss, onSuccess }: EditBudgetModalProps) {
  const { updateBudget, deleteBudget } = useBudgetMutations();

  const handleSubmit = async (data: UpdateBudgetDto) => {
    try {
      await updateBudget.mutateAsync({ id: budget.id, data });
      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBudget.mutateAsync(budget.id);
      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <BudgetForm
          initialData={budget}
          onSubmit={handleSubmit}
          onCancel={onDismiss}
          onDelete={handleDelete}
          isLoading={updateBudget.isPending || deleteBudget.isPending}
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
