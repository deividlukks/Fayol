import React from 'react';
import { Modal, Portal } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { InvestmentForm } from './InvestmentForm';
import type { Investment, UpdateInvestmentDto } from '@fayol/shared-types';
import { useInvestmentMutations } from '../../hooks/mutations/useInvestmentMutations';

interface EditInvestmentModalProps {
  visible: boolean;
  investment: Investment;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export function EditInvestmentModal({
  visible,
  investment,
  onDismiss,
  onSuccess,
}: EditInvestmentModalProps) {
  const { updateInvestment, deleteInvestment } = useInvestmentMutations();

  const handleSubmit = async (data: UpdateInvestmentDto) => {
    try {
      await updateInvestment.mutateAsync({ id: investment.id, data });
      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.error('Error updating investment:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInvestment.mutateAsync(investment.id);
      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.error('Error deleting investment:', error);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <InvestmentForm
          initialData={investment}
          onSubmit={handleSubmit}
          onCancel={onDismiss}
          onDelete={handleDelete}
          isLoading={updateInvestment.isPending || deleteInvestment.isPending}
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
