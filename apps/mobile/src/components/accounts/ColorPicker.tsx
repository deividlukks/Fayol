/**
 * ColorPicker Component
 *
 * Modal color picker for account customization
 */

import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, useTheme, IconButton, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ColorPickerProps {
  visible: boolean;
  selectedColor?: string;
  onDismiss: () => void;
  onSelectColor: (color: string) => void;
}

const AVAILABLE_COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Azul Escuro', value: '#1e40af' },
  { name: 'Azul Claro', value: '#60a5fa' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Verde Escuro', value: '#059669' },
  { name: 'Verde Limão', value: '#84cc16' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Roxo Escuro', value: '#6d28d9' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Laranja', value: '#f59e0b' },
  { name: 'Laranja Escuro', value: '#ea580c' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Vermelho Escuro', value: '#dc2626' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Turquesa', value: '#14b8a6' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Cinza', value: '#6b7280' },
  { name: 'Cinza Escuro', value: '#374151' },
  { name: 'Marrom', value: '#92400e' },
];

export function ColorPicker({
  visible,
  selectedColor,
  onDismiss,
  onSelectColor,
}: ColorPickerProps) {
  const theme = useTheme();
  const [tempSelectedColor, setTempSelectedColor] = useState(selectedColor);

  const handleConfirm = () => {
    if (tempSelectedColor) {
      onSelectColor(tempSelectedColor);
    }
    onDismiss();
  };

  const handleCancel = () => {
    setTempSelectedColor(selectedColor);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Escolher Cor
          </Text>
          <IconButton icon="close" onPress={handleCancel} />
        </View>

        <Divider />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.colorGrid}>
            {AVAILABLE_COLORS.map((color) => {
              const isSelected = tempSelectedColor === color.value;

              return (
                <Pressable
                  key={color.value}
                  onPress={() => setTempSelectedColor(color.value)}
                  style={styles.colorItemContainer}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color.value },
                      isSelected && styles.colorCircleSelected,
                    ]}
                  >
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={24} color="#ffffff" />
                    )}
                  </View>
                  <Text variant="bodySmall" style={styles.colorName}>
                    {color.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Divider />

        <View style={styles.footer}>
          <Button mode="outlined" onPress={handleCancel} style={styles.button}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            style={styles.button}
            disabled={!tempSelectedColor}
          >
            Confirmar
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
    maxHeight: '80%',
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
    maxHeight: 400,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  colorItemContainer: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  colorName: {
    textAlign: 'center',
    fontSize: 10,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  button: {
    flex: 1,
  },
});
