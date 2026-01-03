import React from 'react';
import { Modal, Portal } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { InvestmentForm } from './InvestmentForm';
import type { CreateInvestmentDto } from '@fayol/shared-types';
import { useInvestmentMutations } from '../../hooks/mutations/useInvestmentMutations';

interface CreateInvestmentModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export function CreateInvestmentModal({
  visible,
  onDismiss,
  onSuccess,
}: CreateInvestmentModalProps) {
  const { createInvestment } = useInvestmentMutations();

  const handleSubmit = async (data: CreateInvestmentDto) => {
    try {
      await createInvestment.mutateAsync(data);
      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.error('Error creating investment:', error);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <InvestmentForm
          onSubmit={handleSubmit}
          onCancel={onDismiss}
          isLoading={createInvestment.isPending}
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
