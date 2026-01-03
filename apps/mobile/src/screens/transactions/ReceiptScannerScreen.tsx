import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Card,
  ActivityIndicator,
  useTheme,
  IconButton,
  Chip,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import OCRService, { ParsedReceipt } from '../../services/OCRService';

/**
 * ReceiptScannerScreen
 *
 * Tela para escanear recibos e extrair informações
 *
 * Features:
 * - Captura foto com câmera
 * - Seleciona foto da galeria
 * - OCR automático
 * - Preview da imagem
 * - Extração de dados (valor, comerciante, data)
 * - Navegação para revisão
 */

export default function ReceiptScannerScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle camera capture
   */
  const handleTakePhoto = async () => {
    try {
      setError(null);
      const uri = await OCRService.takePhoto();

      if (uri) {
        setImageUri(uri);
        await processImage(uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erro', 'Não foi possível capturar a foto.', [{ text: 'OK' }]);
    }
  };

  /**
   * Handle gallery selection
   */
  const handlePickImage = async () => {
    try {
      setError(null);
      const uri = await OCRService.pickImage();

      if (uri) {
        setImageUri(uri);
        await processImage(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.', [{ text: 'OK' }]);
    }
  };

  /**
   * Process image with OCR
   */
  const processImage = async (uri: string) => {
    setIsProcessing(true);
    setParsedReceipt(null);
    setError(null);

    try {
      console.log('Processing receipt image:', uri);

      // Scan and parse receipt
      const receipt = await OCRService.scanReceipt(uri);
      setParsedReceipt(receipt);

      // Validate
      const validation = OCRService.validateReceipt(receipt);
      if (!validation.isValid) {
        setError(`Atenção: ${validation.errors.join(', ')}`);
      }

      console.log('Receipt processed:', receipt);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Não foi possível processar o recibo. Tente novamente.');
      Alert.alert(
        'Erro no Processamento',
        'Não conseguimos ler o recibo. Certifique-se de que a foto está nítida e bem iluminada.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Retry with same image
   */
  const handleRetry = () => {
    if (imageUri) {
      processImage(imageUri);
    }
  };

  /**
   * Clear and start over
   */
  const handleClear = () => {
    setImageUri(null);
    setParsedReceipt(null);
    setError(null);
  };

  /**
   * Navigate to review screen
   */
  const handleContinue = () => {
    if (!parsedReceipt) return;

    // Navigate to review screen with parsed data
    navigation.navigate(
      'ReviewReceipt' as never,
      {
        receipt: parsedReceipt,
        imageUri,
      } as never
    );
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return 'Não detectado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Não detectada';
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.header}>
            <IconButton icon="receipt" size={48} iconColor={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.title}>
              Escanear Recibo
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Tire uma foto ou selecione da galeria
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      {!imageUri && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Button mode="contained" icon="camera" onPress={handleTakePhoto} style={styles.button}>
              Tirar Foto
            </Button>

            <Button mode="outlined" icon="image" onPress={handlePickImage} style={styles.button}>
              Selecionar da Galeria
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Image Preview */}
      {imageUri && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Imagem Capturada
            </Text>

            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

            <View style={styles.imageActions}>
              <Button mode="outlined" icon="close" onPress={handleClear} style={styles.imageButton}>
                Descartar
              </Button>

              {isProcessing && (
                <Button mode="outlined" disabled style={styles.imageButton}>
                  Processando...
                </Button>
              )}

              {!isProcessing && parsedReceipt && (
                <Button
                  mode="contained"
                  icon="check"
                  onPress={handleContinue}
                  style={styles.imageButton}
                >
                  Continuar
                </Button>
              )}

              {!isProcessing && !parsedReceipt && (
                <Button
                  mode="contained"
                  icon="refresh"
                  onPress={handleRetry}
                  style={styles.imageButton}
                >
                  Tentar Novamente
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.processingText}>
                Processando recibo...
              </Text>
              <Text variant="bodyMedium" style={styles.processingSubtext}>
                Extraindo informações com OCR
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Error Message */}
      {error && !isProcessing && (
        <Card style={[styles.card, styles.errorCard]} mode="elevated">
          <Card.Content>
            <View style={styles.errorContainer}>
              <IconButton icon="alert-circle" size={32} iconColor="#f44336" />
              <Text variant="titleMedium" style={styles.errorTitle}>
                Atenção
              </Text>
              <Text variant="bodyMedium" style={styles.errorText}>
                {error}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Parsed Receipt Data */}
      {parsedReceipt && !isProcessing && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.resultHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Dados Extraídos
              </Text>
              <Chip mode="flat" textStyle={{ color: '#4caf50' }} style={styles.successChip}>
                ✓ Reconhecido
              </Chip>
            </View>

            <View style={styles.dataRow}>
              <Text variant="bodyMedium" style={styles.dataLabel}>
                Estabelecimento:
              </Text>
              <Text variant="bodyLarge" style={styles.dataValue}>
                {parsedReceipt.merchant || 'Não detectado'}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text variant="bodyMedium" style={styles.dataLabel}>
                Valor Total:
              </Text>
              <Text variant="bodyLarge" style={[styles.dataValue, styles.amountValue]}>
                {formatCurrency(parsedReceipt.amount)}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text variant="bodyMedium" style={styles.dataLabel}>
                Data:
              </Text>
              <Text variant="bodyLarge" style={styles.dataValue}>
                {formatDate(parsedReceipt.date)}
              </Text>
            </View>

            {parsedReceipt.items.length > 0 && (
              <>
                <View style={styles.itemsHeader}>
                  <Text variant="bodyMedium" style={styles.dataLabel}>
                    Itens Detectados:
                  </Text>
                  <Chip mode="flat" compact>
                    {parsedReceipt.items.length}
                  </Chip>
                </View>

                <View style={styles.itemsList}>
                  {parsedReceipt.items.slice(0, 5).map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text variant="bodySmall" style={styles.itemDescription}>
                        {item.quantity && `${item.quantity}x `}
                        {item.description}
                      </Text>
                      <Text variant="bodySmall" style={styles.itemAmount}>
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  ))}
                  {parsedReceipt.items.length > 5 && (
                    <Text variant="bodySmall" style={styles.moreItems}>
                      +{parsedReceipt.items.length - 5} itens...
                    </Text>
                  )}
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Tips */}
      {!imageUri && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              💡 Dicas para Melhor Resultado
            </Text>

            <View style={styles.tipItem}>
              <IconButton icon="check-circle" size={20} iconColor="#4caf50" />
              <Text variant="bodyMedium" style={styles.tipText}>
                Certifique-se de que o recibo está bem iluminado
              </Text>
            </View>

            <View style={styles.tipItem}>
              <IconButton icon="check-circle" size={20} iconColor="#4caf50" />
              <Text variant="bodyMedium" style={styles.tipText}>
                Mantenha a câmera paralela ao recibo
              </Text>
            </View>

            <View style={styles.tipItem}>
              <IconButton icon="check-circle" size={20} iconColor="#4caf50" />
              <Text variant="bodyMedium" style={styles.tipText}>
                Evite sombras e reflexos
              </Text>
            </View>

            <View style={styles.tipItem}>
              <IconButton icon="check-circle" size={20} iconColor="#4caf50" />
              <Text variant="bodyMedium" style={styles.tipText}>
                Foque bem para texto nítido
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}
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
  errorCard: {
    borderColor: '#f44336',
    borderWidth: 1,
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
  button: {
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  imageButton: {
    flex: 1,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  processingText: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  processingSubtext: {
    marginTop: 4,
    opacity: 0.7,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorTitle: {
    color: '#f44336',
    marginTop: 8,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  successChip: {
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  dataRow: {
    marginBottom: 16,
  },
  dataLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  dataValue: {
    fontWeight: '500',
  },
  amountValue: {
    color: '#4caf50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  itemsList: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    marginLeft: 8,
  },
});
