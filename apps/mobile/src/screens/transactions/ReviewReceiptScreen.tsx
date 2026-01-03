import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ParsedReceipt } from '../../services/OCRService';
import DatabaseService from '../../database/DatabaseService';
import { useOffline } from '../../contexts/OfflineContext';
import { useLocation } from '../../contexts/LocationContext';
import LocationService from '../../services/LocationService';
import uuid from 'react-native-uuid';

/**
 * ReviewReceiptScreen
 *
 * Tela para revisar e editar dados extraídos do recibo
 *
 * Features:
 * - Review de dados OCR
 * - Edição de campos
 * - Seleção de conta
 * - Seleção de categoria
 * - Criação de transação
 * - Salvamento offline
 */

interface RouteParams {
  receipt: ParsedReceipt;
  imageUri: string;
}

export default function ReviewReceiptScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { isDatabaseReady } = useOffline();
  const { currentLocation, getCurrentLocation, isLoadingLocation } = useLocation();
  const params = route.params as RouteParams;

  const [description, setDescription] = useState(params.receipt.merchant || '');
  const [amount, setAmount] = useState(
    params.receipt.amount ? params.receipt.amount.toString() : ''
  );
  const [date, setDate] = useState(params.receipt.date || new Date());
  const [notes, setNotes] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [captureLocation, setCaptureLocation] = useState(true); // Auto-enable location capture

  /**
   * Auto-capture location on mount
   */
  React.useEffect(() => {
    if (captureLocation && !currentLocation && !isLoadingLocation) {
      getCurrentLocation(false); // Use cached location if available
    }
  }, [captureLocation, currentLocation, isLoadingLocation, getCurrentLocation]);

  // Mock data - in production, fetch from database
  const accounts = [
    { id: '1', name: 'Conta Corrente', type: 'CHECKING' },
    { id: '2', name: 'Cartão de Crédito', type: 'CREDIT_CARD' },
    { id: '3', name: 'Dinheiro', type: 'CASH' },
  ];

  const categories = [
    { id: '1', name: 'Alimentação', icon: 'food', type: 'EXPENSE' },
    { id: '2', name: 'Transporte', icon: 'car', type: 'EXPENSE' },
    { id: '3', name: 'Saúde', icon: 'medical-bag', type: 'EXPENSE' },
    { id: '4', name: 'Lazer', icon: 'gamepad-variant', type: 'EXPENSE' },
    { id: '5', name: 'Compras', icon: 'shopping', type: 'EXPENSE' },
  ];

  /**
   * Format currency for display
   */
  const formatCurrency = (value: string): string => {
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) return value;

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  /**
   * Validate form
   */
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!description.trim()) {
      errors.push('Descrição é obrigatória');
    }

    const amountNum = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!selectedAccount) {
      errors.push('Selecione uma conta');
    }

    if (!selectedCategory) {
      errors.push('Selecione uma categoria');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Save transaction
   */
  const handleSave = async () => {
    // Validate
    const validation = validateForm();
    if (!validation.isValid) {
      Alert.alert('Erro de Validação', validation.errors.join('\n'), [{ text: 'OK' }]);
      return;
    }

    if (!isDatabaseReady) {
      Alert.alert('Erro', 'Banco de dados não está pronto. Tente novamente.', [{ text: 'OK' }]);
      return;
    }

    setIsSaving(true);

    try {
      const amountNum = parseFloat(amount.replace(',', '.'));

      // Create transaction
      const transaction = {
        id: uuid.v4() as string,
        user_id: 'current-user-id', // TODO: Get from auth context
        account_id: selectedAccount,
        category_id: selectedCategory,
        type: 'EXPENSE',
        amount: amountNum,
        description: description.trim(),
        date: Math.floor(date.getTime() / 1000),
        notes: notes.trim() || null,
        receipt_url: params.imageUri, // Store receipt image URI
        location:
          captureLocation && currentLocation
            ? LocationService.serializeLocation(currentLocation)
            : null,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      };

      // Save to local database
      await DatabaseService.insert('transactions', transaction);

      console.log('[ReviewReceipt] Transaction saved:', transaction.id);

      // Show success and navigate back
      Alert.alert('Sucesso!', 'Transação criada com sucesso a partir do recibo escaneado.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to transactions list
            navigation.navigate('Transactions' as never);
          },
        },
      ]);
    } catch (error) {
      console.error('[ReviewReceipt] Error saving transaction:', error);
      Alert.alert('Erro', 'Não foi possível salvar a transação. Tente novamente.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAccountName =
    accounts.find((a) => a.id === selectedAccount)?.name || 'Selecionar Conta';
  const selectedCategoryName =
    categories.find((c) => c.id === selectedCategory)?.name || 'Selecionar Categoria';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.header}>
            <IconButton icon="receipt-text" size={48} iconColor={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.title}>
              Revisar Recibo
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Confira e edite as informações extraídas
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Receipt Image */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Imagem do Recibo
          </Text>
          <Image source={{ uri: params.imageUri }} style={styles.image} resizeMode="contain" />
        </Card.Content>
      </Card>

      {/* Transaction Form */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Detalhes da Transação
          </Text>

          {/* Description */}
          <TextInput
            label="Descrição *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="text" />}
          />

          {/* Amount */}
          <TextInput
            label="Valor *"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
            left={<TextInput.Icon icon="currency-usd" />}
            right={<TextInput.Affix text={amount ? formatCurrency(amount) : ''} />}
          />

          {/* Date */}
          <TextInput
            label="Data"
            value={formatDate(date)}
            mode="outlined"
            style={styles.input}
            editable={false}
            left={<TextInput.Icon icon="calendar" />}
            right={<TextInput.Icon icon="chevron-down" />}
          />

          <Divider style={styles.divider} />

          {/* Account Selector */}
          <Menu
            visible={accountMenuVisible}
            onDismiss={() => setAccountMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setAccountMenuVisible(true)}
                icon="bank"
                style={styles.selectorButton}
                contentStyle={styles.selectorButtonContent}
              >
                {selectedAccountName}
              </Button>
            }
          >
            {accounts.map((account) => (
              <Menu.Item
                key={account.id}
                onPress={() => {
                  setSelectedAccount(account.id);
                  setAccountMenuVisible(false);
                }}
                title={account.name}
                leadingIcon="bank"
              />
            ))}
          </Menu>

          {/* Category Selector */}
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setCategoryMenuVisible(true)}
                icon="tag"
                style={styles.selectorButton}
                contentStyle={styles.selectorButtonContent}
              >
                {selectedCategoryName}
              </Button>
            }
          >
            {categories.map((category) => (
              <Menu.Item
                key={category.id}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setCategoryMenuVisible(false);
                }}
                title={category.name}
                leadingIcon={category.icon}
              />
            ))}
          </Menu>

          {/* Notes */}
          <TextInput
            label="Observações (Opcional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            left={<TextInput.Icon icon="note-text" />}
          />

          <Divider style={styles.divider} />

          {/* Location Capture */}
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <Text variant="titleSmall" style={styles.locationTitle}>
                Localização
              </Text>
              <Button mode="text" onPress={() => setCaptureLocation(!captureLocation)} compact>
                {captureLocation ? 'Remover' : 'Adicionar'}
              </Button>
            </View>

            {captureLocation && (
              <>
                {isLoadingLocation && (
                  <View style={styles.locationLoading}>
                    <Text variant="bodySmall" style={styles.locationText}>
                      Obtendo localização...
                    </Text>
                  </View>
                )}

                {!isLoadingLocation && currentLocation && (
                  <View style={styles.locationInfo}>
                    <IconButton icon="map-marker" size={20} iconColor={theme.colors.primary} />
                    <View style={styles.locationDetails}>
                      <Text variant="bodyMedium" style={styles.locationAddress}>
                        {currentLocation.address.formattedAddress}
                      </Text>
                      <Text variant="bodySmall" style={styles.locationCoords}>
                        {currentLocation.coordinates.latitude.toFixed(6)},{' '}
                        {currentLocation.coordinates.longitude.toFixed(6)}
                      </Text>
                    </View>
                    <IconButton icon="refresh" size={20} onPress={() => getCurrentLocation(true)} />
                  </View>
                )}

                {!isLoadingLocation && !currentLocation && (
                  <View style={styles.locationError}>
                    <IconButton icon="map-marker-off" size={20} />
                    <Text variant="bodySmall" style={styles.locationErrorText}>
                      Localização não disponível
                    </Text>
                    <Button mode="text" onPress={() => getCurrentLocation(true)} compact>
                      Tentar Novamente
                    </Button>
                  </View>
                )}
              </>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Extracted Items (if any) */}
      {params.receipt.items.length > 0 && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Itens Detectados ({params.receipt.items.length})
            </Text>

            {params.receipt.items.slice(0, 10).map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text variant="bodyMedium" style={styles.itemDescription}>
                  {item.quantity && `${item.quantity}x `}
                  {item.description}
                </Text>
                <Text variant="bodyMedium" style={styles.itemAmount}>
                  {formatCurrency(item.amount.toString())}
                </Text>
              </View>
            ))}

            {params.receipt.items.length > 10 && (
              <Text variant="bodySmall" style={styles.moreItems}>
                +{params.receipt.items.length - 10} itens...
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Button
            mode="contained"
            icon="check"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            style={styles.button}
          >
            Salvar Transação
          </Button>

          <Button
            mode="outlined"
            icon="close"
            onPress={() => navigation.goBack()}
            disabled={isSaving}
            style={styles.button}
          >
            Cancelar
          </Button>
        </Card.Content>
      </Card>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          * Campos obrigatórios
        </Text>
        <Text variant="bodySmall" style={styles.footerText}>
          A imagem do recibo será anexada à transação
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  title: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  input: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  selectorButton: {
    marginBottom: 12,
  },
  selectorButtonContent: {
    justifyContent: 'flex-start',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemDescription: {
    flex: 1,
    opacity: 0.8,
  },
  itemAmount: {
    fontWeight: '500',
    marginLeft: 8,
  },
  moreItems: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 12,
  },
  footer: {
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 4,
  },
  locationSection: {
    marginTop: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontWeight: '500',
  },
  locationLoading: {
    padding: 12,
    alignItems: 'center',
  },
  locationText: {
    opacity: 0.7,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 4,
  },
  locationAddress: {
    fontWeight: '500',
  },
  locationCoords: {
    opacity: 0.6,
    marginTop: 2,
  },
  locationError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  locationErrorText: {
    opacity: 0.6,
    marginLeft: 4,
  },
});
