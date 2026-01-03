import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Switch,
  List,
  Divider,
  Button,
  useTheme,
  IconButton,
  SegmentedButtons,
} from 'react-native-paper';
import { useLocation } from '../../contexts/LocationContext';
import LocationService from '../../services/LocationService';
import * as Location from 'expo-location';

/**
 * LocationSettingsScreen
 *
 * Tela de configurações de localização
 *
 * Features:
 * - Status de permissões
 * - Toggle para captura automática
 * - Configuração de precisão
 * - Teste de localização
 * - Gerenciamento de cache
 */

export default function LocationSettingsScreen() {
  const theme = useTheme();
  const {
    permissionStatus,
    isLocationEnabled,
    currentLocation,
    isLoadingLocation,
    locationError,
    requestPermissions,
    getCurrentLocation,
    clearLocationCache,
    configure,
    openSettings,
  } = useLocation();

  const [autoCapture, setAutoCapture] = useState(true);
  const [accuracyLevel, setAccuracyLevel] = useState<string>('balanced');
  const [cacheExpiry, setCacheExpiry] = useState<string>('5');

  /**
   * Handle permission request
   */
  const handleRequestPermissions = async () => {
    const result = await requestPermissions();

    if (result.granted) {
      Alert.alert('Sucesso', 'Permissão de localização concedida!', [{ text: 'OK' }]);
    } else if (result.status === Location.PermissionStatus.DENIED && !result.canAskAgain) {
      Alert.alert(
        'Permissão Negada',
        'A permissão de localização foi negada permanentemente. Por favor, habilite nas configurações do dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: openSettings },
        ]
      );
    } else {
      Alert.alert(
        'Permissão Necessária',
        'A permissão de localização é necessária para capturar a localização das transações.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Test location
   */
  const handleTestLocation = async () => {
    const location = await getCurrentLocation(true);

    if (location) {
      Alert.alert(
        'Localização Obtida',
        `${location.address.formattedAddress}\n\nCoordenadas:\n${location.coordinates.latitude.toFixed(6)}, ${location.coordinates.longitude.toFixed(6)}\n\nPrecisão: ${location.coordinates.accuracy?.toFixed(0)}m`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Erro', locationError || 'Não foi possível obter a localização.', [
        { text: 'OK' },
      ]);
    }
  };

  /**
   * Handle accuracy change
   */
  const handleAccuracyChange = (value: string) => {
    setAccuracyLevel(value);

    let accuracy: Location.Accuracy;
    switch (value) {
      case 'low':
        accuracy = Location.Accuracy.Low;
        break;
      case 'balanced':
        accuracy = Location.Accuracy.Balanced;
        break;
      case 'high':
        accuracy = Location.Accuracy.High;
        break;
      case 'highest':
        accuracy = Location.Accuracy.Highest;
        break;
      default:
        accuracy = Location.Accuracy.Balanced;
    }

    configure({ accuracyLevel: accuracy });
  };

  /**
   * Handle cache expiry change
   */
  const handleCacheExpiryChange = (value: string) => {
    setCacheExpiry(value);
    const expiryMs = parseInt(value) * 60 * 1000; // Convert minutes to ms
    configure({ cacheExpiryMs: expiryMs });
  };

  /**
   * Get permission status icon and color
   */
  const getPermissionIcon = () => {
    if (!permissionStatus) {
      return { icon: 'help-circle', color: theme.colors.outline };
    }

    if (permissionStatus.granted) {
      return { icon: 'check-circle', color: '#4caf50' };
    }

    return { icon: 'alert-circle', color: '#f44336' };
  };

  /**
   * Get permission status text
   */
  const getPermissionStatusText = () => {
    if (!permissionStatus) {
      return 'Verificando...';
    }

    switch (permissionStatus.status) {
      case Location.PermissionStatus.GRANTED:
        return 'Concedida';
      case Location.PermissionStatus.DENIED:
        return 'Negada';
      case Location.PermissionStatus.UNDETERMINED:
        return 'Não solicitada';
      default:
        return 'Desconhecida';
    }
  };

  const permissionIconData = getPermissionIcon();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.header}>
            <IconButton icon="map-marker" size={48} iconColor={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.title}>
              Configurações de Localização
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Gerencie como o app usa sua localização
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Permission Status */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Status de Permissões
          </Text>

          <List.Item
            title="Permissão de Localização"
            description={getPermissionStatusText()}
            left={(props) => (
              <IconButton
                {...props}
                icon={permissionIconData.icon}
                iconColor={permissionIconData.color}
              />
            )}
          />

          <List.Item
            title="Serviços de Localização"
            description={isLocationEnabled ? 'Habilitado' : 'Desabilitado'}
            left={(props) => (
              <IconButton
                {...props}
                icon={isLocationEnabled ? 'check-circle' : 'close-circle'}
                iconColor={isLocationEnabled ? '#4caf50' : '#f44336'}
              />
            )}
          />

          {!permissionStatus?.granted && (
            <Button
              mode="contained"
              onPress={handleRequestPermissions}
              style={styles.button}
              icon="lock-open"
            >
              Solicitar Permissão
            </Button>
          )}

          {permissionStatus?.granted && !isLocationEnabled && (
            <View style={styles.warningBox}>
              <IconButton icon="alert" iconColor="#ff9800" />
              <Text variant="bodySmall" style={styles.warningText}>
                Os serviços de localização estão desabilitados no dispositivo. Habilite nas
                configurações do sistema.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Current Location */}
      {permissionStatus?.granted && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Localização Atual
            </Text>

            {currentLocation && (
              <>
                <View style={styles.locationInfo}>
                  <IconButton icon="map-marker" size={24} iconColor={theme.colors.primary} />
                  <View style={styles.locationDetails}>
                    <Text variant="bodyMedium" style={styles.locationAddress}>
                      {currentLocation.address.formattedAddress}
                    </Text>
                    <Text variant="bodySmall" style={styles.locationCoords}>
                      {currentLocation.coordinates.latitude.toFixed(6)},{' '}
                      {currentLocation.coordinates.longitude.toFixed(6)}
                    </Text>
                    {currentLocation.coordinates.accuracy && (
                      <Text variant="bodySmall" style={styles.locationAccuracy}>
                        Precisão: ±{currentLocation.coordinates.accuracy.toFixed(0)}m
                      </Text>
                    )}
                  </View>
                </View>

                <Divider style={styles.divider} />
              </>
            )}

            <Button
              mode="outlined"
              onPress={handleTestLocation}
              loading={isLoadingLocation}
              disabled={isLoadingLocation}
              style={styles.button}
              icon="crosshairs-gps"
            >
              {currentLocation ? 'Atualizar Localização' : 'Obter Localização'}
            </Button>

            {locationError && (
              <View style={styles.errorBox}>
                <Text variant="bodySmall" style={styles.errorText}>
                  {locationError}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Settings */}
      {permissionStatus?.granted && (
        <>
          {/* Auto Capture */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Captura Automática
              </Text>

              <List.Item
                title="Capturar localização automaticamente"
                description="Ao criar transações, a localização será capturada automaticamente"
                left={(props) => <List.Icon {...props} icon="map-marker-plus" />}
                right={() => <Switch value={autoCapture} onValueChange={setAutoCapture} />}
              />
            </Card.Content>
          </Card>

          {/* Accuracy */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Nível de Precisão
              </Text>

              <Text variant="bodySmall" style={styles.description}>
                Maior precisão consome mais bateria
              </Text>

              <SegmentedButtons
                value={accuracyLevel}
                onValueChange={handleAccuracyChange}
                style={styles.segmentedButtons}
                buttons={[
                  { value: 'low', label: 'Baixa' },
                  { value: 'balanced', label: 'Balanceada' },
                  { value: 'high', label: 'Alta' },
                  { value: 'highest', label: 'Máxima' },
                ]}
              />

              <View style={styles.infoBox}>
                <IconButton icon="information" size={20} iconColor={theme.colors.primary} />
                <Text variant="bodySmall" style={styles.infoText}>
                  {accuracyLevel === 'low' && 'Até 1km de precisão. Menor consumo de bateria.'}
                  {accuracyLevel === 'balanced' && 'Até 100m de precisão. Consumo moderado.'}
                  {accuracyLevel === 'high' && 'Até 10m de precisão. Maior consumo.'}
                  {accuracyLevel === 'highest' && 'Melhor precisão possível. Alto consumo.'}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Cache Settings */}
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Cache de Localização
              </Text>

              <Text variant="bodySmall" style={styles.description}>
                Por quanto tempo reutilizar a mesma localização sem obter novamente
              </Text>

              <SegmentedButtons
                value={cacheExpiry}
                onValueChange={handleCacheExpiryChange}
                style={styles.segmentedButtons}
                buttons={[
                  { value: '1', label: '1min' },
                  { value: '5', label: '5min' },
                  { value: '15', label: '15min' },
                  { value: '30', label: '30min' },
                ]}
              />

              <Button
                mode="outlined"
                onPress={clearLocationCache}
                style={styles.button}
                icon="delete-sweep"
              >
                Limpar Cache
              </Button>
            </Card.Content>
          </Card>
        </>
      )}

      {/* Information */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Como Usamos sua Localização
          </Text>

          <List.Item
            title="Transações Geolocalizadas"
            description="Registramos onde você gastou ou recebeu dinheiro"
            left={(props) => <List.Icon {...props} icon="map-marker-circle" />}
          />

          <List.Item
            title="Análise de Gastos por Local"
            description="Veja seus padrões de consumo em diferentes lugares"
            left={(props) => <List.Icon {...props} icon="chart-box" />}
          />

          <List.Item
            title="Mapa de Transações"
            description="Visualize todas as transações em um mapa interativo"
            left={(props) => <List.Icon {...props} icon="map" />}
          />

          <List.Item
            title="Privacidade"
            description="A localização é armazenada apenas no seu dispositivo"
            left={(props) => <List.Icon {...props} icon="shield-lock" />}
          />
        </Card.Content>
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Você pode desabilitar a localização a qualquer momento
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
    textAlign: 'center',
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
  description: {
    opacity: 0.7,
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
  },
  divider: {
    marginVertical: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 8,
  },
  locationAddress: {
    fontWeight: '500',
    marginBottom: 4,
  },
  locationCoords: {
    opacity: 0.6,
    marginBottom: 2,
  },
  locationAccuracy: {
    opacity: 0.6,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    color: '#e65100',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#c62828',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    color: '#1565c0',
  },
  segmentedButtons: {
    marginTop: 8,
  },
  footer: {
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});
