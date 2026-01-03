/**
 * IconPicker Component
 *
 * Modal icon picker for account customization
 */

import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  useTheme,
  IconButton,
  Divider,
  Searchbar,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface IconPickerProps {
  visible: boolean;
  selectedIcon?: string;
  selectedColor?: string;
  onDismiss: () => void;
  onSelectIcon: (icon: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'bank', label: 'Banco' },
  { name: 'piggy-bank', label: 'Poupança' },
  { name: 'credit-card', label: 'Cartão' },
  { name: 'cash', label: 'Dinheiro' },
  { name: 'wallet', label: 'Carteira' },
  { name: 'chart-line', label: 'Investimento' },
  { name: 'chart-areaspline', label: 'Gráfico' },
  { name: 'bitcoin', label: 'Bitcoin' },
  { name: 'currency-usd', label: 'Dólar' },
  { name: 'currency-eur', label: 'Euro' },
  { name: 'currency-brl', label: 'Real' },
  { name: 'safe', label: 'Cofre' },
  { name: 'account-cash', label: 'Conta' },
  { name: 'treasure-chest', label: 'Tesouro' },
  { name: 'gold', label: 'Ouro' },
  { name: 'diamond-stone', label: 'Diamante' },
  { name: 'home', label: 'Casa' },
  { name: 'car', label: 'Carro' },
  { name: 'briefcase', label: 'Trabalho' },
  { name: 'school', label: 'Educação' },
  { name: 'food', label: 'Comida' },
  { name: 'cart', label: 'Compras' },
  { name: 'gift', label: 'Presente' },
  { name: 'airplane', label: 'Viagem' },
  { name: 'medical-bag', label: 'Saúde' },
  { name: 'dumbbell', label: 'Academia' },
  { name: 'gamepad-variant', label: 'Jogos' },
  { name: 'movie', label: 'Cinema' },
  { name: 'book', label: 'Livros' },
  { name: 'music', label: 'Música' },
  { name: 'cellphone', label: 'Celular' },
  { name: 'laptop', label: 'Notebook' },
  { name: 'coffee', label: 'Café' },
  { name: 'pizza', label: 'Pizza' },
  { name: 'paw', label: 'Pet' },
  { name: 'leaf', label: 'Natureza' },
  { name: 'lightning-bolt', label: 'Energia' },
  { name: 'water', label: 'Água' },
  { name: 'gas-station', label: 'Combustível' },
  { name: 'taxi', label: 'Táxi' },
  { name: 'bus', label: 'Ônibus' },
  { name: 'train', label: 'Trem' },
  { name: 'shopping', label: 'Shopping' },
  { name: 'store', label: 'Loja' },
  { name: 'heart', label: 'Coração' },
  { name: 'star', label: 'Estrela' },
  { name: 'flag', label: 'Bandeira' },
  { name: 'shield', label: 'Escudo' },
];

export function IconPicker({
  visible,
  selectedIcon,
  selectedColor = '#3b82f6',
  onDismiss,
  onSelectIcon,
}: IconPickerProps) {
  const theme = useTheme();
  const [tempSelectedIcon, setTempSelectedIcon] = useState(selectedIcon);
  const [searchQuery, setSearchQuery] = useState('');

  const handleConfirm = () => {
    if (tempSelectedIcon) {
      onSelectIcon(tempSelectedIcon);
    }
    onDismiss();
  };

  const handleCancel = () => {
    setTempSelectedIcon(selectedIcon);
    setSearchQuery('');
    onDismiss();
  };

  // Filter icons based on search query
  const filteredIcons = AVAILABLE_ICONS.filter((icon) =>
    icon.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Escolher Ícone
          </Text>
          <IconButton icon="close" onPress={handleCancel} />
        </View>

        <Divider />

        <View style={styles.content}>
          {/* Search Bar */}
          <Searchbar
            placeholder="Buscar ícone..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            icon="magnify"
          />

          {/* Icons Grid */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.iconGrid}>
              {filteredIcons.map((icon) => {
                const isSelected = tempSelectedIcon === icon.name;

                return (
                  <Pressable
                    key={icon.name}
                    onPress={() => setTempSelectedIcon(icon.name)}
                    style={styles.iconItemContainer}
                  >
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: selectedColor + '20' },
                        isSelected && {
                          backgroundColor: selectedColor,
                          borderWidth: 2,
                          borderColor: selectedColor,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={icon.name}
                        size={28}
                        color={isSelected ? '#ffffff' : selectedColor}
                      />
                    </View>
                    <Text
                      variant="bodySmall"
                      style={[styles.iconLabel, isSelected && styles.iconLabelSelected]}
                    >
                      {icon.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <Divider />

        <View style={styles.footer}>
          <Button mode="outlined" onPress={handleCancel} style={styles.button}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            style={styles.button}
            disabled={!tempSelectedIcon}
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
    maxHeight: '85%',
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
    flex: 1,
  },
  searchBar: {
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  iconItemContainer: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconLabel: {
    textAlign: 'center',
    fontSize: 10,
    opacity: 0.7,
  },
  iconLabelSelected: {
    fontWeight: '600',
    opacity: 1,
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
