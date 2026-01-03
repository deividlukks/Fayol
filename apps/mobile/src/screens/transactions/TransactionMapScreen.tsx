import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, FAB, Card, IconButton, useTheme, Chip, Portal, Modal } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useLocation } from '../../contexts/LocationContext';
import { useOffline } from '../../contexts/OfflineContext';
import DatabaseService from '../../database/DatabaseService';
import LocationService, { TransactionLocation } from '../../services/LocationService';

/**
 * TransactionMapScreen
 *
 * Tela para visualizar transações em um mapa
 *
 * Features:
 * - Mapa interativo com marcadores de transações
 * - Filtros por categoria e período
 * - Detalhes da transação ao tocar no marcador
 * - Botão para centralizar na localização atual
 * - Estatísticas por região
 */

interface TransactionWithLocation {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  date: number;
  category_id: string | null;
  location: TransactionLocation;
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05; // ~5km zoom
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function TransactionMapScreen() {
  const theme = useTheme();
  const { currentLocation, getCurrentLocation, isLoadingLocation } = useLocation();
  const { isDatabaseReady } = useOffline();

  const [transactions, setTransactions] = useState<TransactionWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithLocation | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  const mapRef = React.useRef<MapView>(null);

  /**
   * Load transactions with location data
   */
  useEffect(() => {
    if (isDatabaseReady) {
      loadTransactions();
    }
  }, [isDatabaseReady, filterType]);

  /**
   * Set initial map region when current location is available
   */
  useEffect(() => {
    if (currentLocation && !mapRegion) {
      setMapRegion({
        latitude: currentLocation.coordinates.latitude,
        longitude: currentLocation.coordinates.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [currentLocation, mapRegion]);

  /**
   * Load transactions from database
   */
  const loadTransactions = async () => {
    try {
      setIsLoading(true);

      // Get all transactions with location data
      const allTransactions = await DatabaseService.getAll('transactions', {
        orderBy: 'date',
        order: 'DESC',
      });

      // Filter transactions that have location data
      const withLocation: TransactionWithLocation[] = [];

      for (const tx of allTransactions) {
        if (tx.location && typeof tx.location === 'string') {
          try {
            const location = LocationService.deserializeLocation(tx.location);
            if (location) {
              // Apply filter
              if (filterType === 'ALL' || tx.type === filterType) {
                withLocation.push({
                  id: tx.id,
                  description: tx.description || 'Sem descrição',
                  amount: tx.amount,
                  type: tx.type,
                  date: tx.date,
                  category_id: tx.category_id,
                  location,
                });
              }
            }
          } catch (error) {
            console.error('[TransactionMap] Error parsing location:', error);
          }
        }
      }

      setTransactions(withLocation);

      // If we have transactions but no map region yet, center on first transaction
      if (withLocation.length > 0 && !mapRegion) {
        const firstTx = withLocation[0];
        setMapRegion({
          latitude: firstTx.location.coordinates.latitude,
          longitude: firstTx.location.coordinates.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }

      console.log('[TransactionMap] Loaded', withLocation.length, 'transactions with location');
    } catch (error) {
      console.error('[TransactionMap] Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Center map on current location
   */
  const handleCenterOnCurrentLocation = useCallback(async () => {
    const location = await getCurrentLocation(true);
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [getCurrentLocation]);

  /**
   * Handle marker press
   */
  const handleMarkerPress = (transaction: TransactionWithLocation) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  /**
   * Close modal
   */
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTransaction(null);
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  /**
   * Get marker color by transaction type
   */
  const getMarkerColor = (type: string): string => {
    switch (type) {
      case 'INCOME':
        return '#4caf50'; // Green
      case 'EXPENSE':
        return '#f44336'; // Red
      case 'TRANSFER':
        return '#2196f3'; // Blue
      default:
        return '#9e9e9e'; // Gray
    }
  };

  /**
   * Calculate total for visible transactions
   */
  const calculateStats = () => {
    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, balance: income - expense };
  };

  const stats = calculateStats();

  return (
    <View style={styles.container}>
      {/* Map */}
      {mapRegion && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          showsScale
        >
          {/* Transaction Markers */}
          {transactions.map((transaction) => (
            <Marker
              key={transaction.id}
              coordinate={{
                latitude: transaction.location.coordinates.latitude,
                longitude: transaction.location.coordinates.longitude,
              }}
              pinColor={getMarkerColor(transaction.type)}
              onPress={() => handleMarkerPress(transaction)}
            >
              <View
                style={[styles.customMarker, { backgroundColor: getMarkerColor(transaction.type) }]}
              >
                <IconButton
                  icon={transaction.type === 'INCOME' ? 'arrow-down' : 'arrow-up'}
                  size={16}
                  iconColor="#fff"
                />
              </View>
            </Marker>
          ))}

          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.coordinates.latitude,
                longitude: currentLocation.coordinates.longitude,
              }}
              title="Você está aqui"
              pinColor="#2196f3"
            />
          )}
        </MapView>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Card style={styles.loadingCard}>
            <Card.Content>
              <Text variant="bodyMedium">Carregando transações...</Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Stats Card */}
      {!isLoading && transactions.length > 0 && (
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard} mode="elevated">
            <Card.Content>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Transações
                  </Text>
                  <Text variant="titleMedium" style={styles.statValue}>
                    {transactions.length}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text variant="bodySmall" style={[styles.statLabel, { color: '#4caf50' }]}>
                    Receitas
                  </Text>
                  <Text variant="titleMedium" style={[styles.statValue, { color: '#4caf50' }]}>
                    {formatCurrency(stats.income)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text variant="bodySmall" style={[styles.statLabel, { color: '#f44336' }]}>
                    Despesas
                  </Text>
                  <Text variant="titleMedium" style={[styles.statValue, { color: '#f44336' }]}>
                    {formatCurrency(stats.expense)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <Chip
          selected={filterType === 'ALL'}
          onPress={() => setFilterType('ALL')}
          style={styles.filterChip}
        >
          Todas
        </Chip>
        <Chip
          selected={filterType === 'INCOME'}
          onPress={() => setFilterType('INCOME')}
          style={styles.filterChip}
          icon="arrow-down"
        >
          Receitas
        </Chip>
        <Chip
          selected={filterType === 'EXPENSE'}
          onPress={() => setFilterType('EXPENSE')}
          style={styles.filterChip}
          icon="arrow-up"
        >
          Despesas
        </Chip>
      </View>

      {/* FAB - Center on Current Location */}
      <FAB
        icon="crosshairs-gps"
        style={styles.fab}
        onPress={handleCenterOnCurrentLocation}
        loading={isLoadingLocation}
        color="#fff"
      />

      {/* Transaction Detail Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={handleCloseModal}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedTransaction && (
            <Card>
              <Card.Content>
                <View style={styles.modalHeader}>
                  <IconButton
                    icon={selectedTransaction.type === 'INCOME' ? 'arrow-down' : 'arrow-up'}
                    size={32}
                    iconColor={getMarkerColor(selectedTransaction.type)}
                    style={{
                      backgroundColor: `${getMarkerColor(selectedTransaction.type)}20`,
                    }}
                  />
                  <IconButton icon="close" size={24} onPress={handleCloseModal} />
                </View>

                <Text variant="headlineSmall" style={styles.modalTitle}>
                  {selectedTransaction.description}
                </Text>

                <Text
                  variant="headlineMedium"
                  style={[styles.modalAmount, { color: getMarkerColor(selectedTransaction.type) }]}
                >
                  {formatCurrency(selectedTransaction.amount)}
                </Text>

                <View style={styles.modalRow}>
                  <IconButton icon="calendar" size={20} />
                  <Text variant="bodyMedium">{formatDate(selectedTransaction.date)}</Text>
                </View>

                <View style={styles.modalRow}>
                  <IconButton icon="map-marker" size={20} />
                  <Text variant="bodyMedium" style={styles.modalAddress}>
                    {selectedTransaction.location.address.formattedAddress}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <IconButton icon="map" size={20} />
                  <Text variant="bodySmall" style={styles.modalCoords}>
                    {selectedTransaction.location.coordinates.latitude.toFixed(6)},{' '}
                    {selectedTransaction.location.coordinates.longitude.toFixed(6)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>

      {/* Empty State */}
      {!isLoading && transactions.length === 0 && (
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard} mode="elevated">
            <Card.Content>
              <IconButton icon="map-marker-off" size={48} iconColor={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                Nenhuma transação com localização
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Transações com localização capturada aparecerão aqui no mapa.
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingCard: {
    padding: 16,
  },
  statsContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: 'bold',
  },
  filterContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#2196f3',
  },
  modalContainer: {
    margin: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalAmount: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalAddress: {
    flex: 1,
    marginLeft: 8,
  },
  modalCoords: {
    flex: 1,
    marginLeft: 8,
    opacity: 0.6,
  },
  emptyContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
