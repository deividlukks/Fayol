import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * LocationService
 *
 * Serviço para gerenciamento de geolocalização
 *
 * Features:
 * - Permissões de localização
 * - GPS (latitude/longitude)
 * - Geocodificação reversa (coordenadas → endereço)
 * - Cache de localização
 * - Monitoramento de mudanças
 * - Otimização de bateria
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface LocationAddress {
  street: string | null;
  streetNumber: string | null;
  district: string | null;
  city: string | null;
  region: string | null; // State/Province
  country: string | null;
  postalCode: string | null;
  formattedAddress: string;
}

export interface TransactionLocation {
  coordinates: LocationCoordinates;
  address: LocationAddress;
  capturedAt: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

export interface LocationServiceConfig {
  enableBackgroundLocation: boolean;
  cacheExpiryMs: number; // How long to cache location before refreshing
  accuracyLevel: Location.Accuracy;
}

class LocationService {
  private static instance: LocationService;
  private lastLocation: TransactionLocation | null = null;
  private lastLocationTime: number = 0;
  private subscribers: ((location: TransactionLocation | null) => void)[] = [];
  private config: LocationServiceConfig = {
    enableBackgroundLocation: false,
    cacheExpiryMs: 5 * 60 * 1000, // 5 minutes default
    accuracyLevel: Location.Accuracy.Balanced,
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Configure service
   */
  configure(config: Partial<LocationServiceConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[LocationService] Configured:', this.config);
  }

  /**
   * Check if location services are enabled on device
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('[LocationService] Error checking if location enabled:', error);
      return false;
    }
  }

  /**
   * Check current permission status without requesting
   */
  async checkPermissions(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error('[LocationService] Error checking permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.UNDETERMINED,
      };
    }
  }

  /**
   * Request foreground location permissions
   */
  async requestForegroundPermissions(): Promise<LocationPermissionStatus> {
    try {
      console.log('[LocationService] Requesting foreground permissions...');

      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      const result: LocationPermissionStatus = {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status,
      };

      console.log('[LocationService] Foreground permission result:', result);
      return result;
    } catch (error) {
      console.error('[LocationService] Error requesting foreground permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.UNDETERMINED,
      };
    }
  }

  /**
   * Request background location permissions (if needed for future features)
   */
  async requestBackgroundPermissions(): Promise<LocationPermissionStatus> {
    try {
      console.log('[LocationService] Requesting background permissions...');

      // First ensure foreground is granted
      const foreground = await this.requestForegroundPermissions();
      if (!foreground.granted) {
        return foreground;
      }

      // Then request background
      const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync();

      const result: LocationPermissionStatus = {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status,
      };

      console.log('[LocationService] Background permission result:', result);
      return result;
    } catch (error) {
      console.error('[LocationService] Error requesting background permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.UNDETERMINED,
      };
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(forceRefresh: boolean = false): Promise<TransactionLocation | null> {
    try {
      // Check cache first (unless force refresh)
      const now = Date.now();
      if (
        !forceRefresh &&
        this.lastLocation &&
        now - this.lastLocationTime < this.config.cacheExpiryMs
      ) {
        console.log('[LocationService] Returning cached location');
        return this.lastLocation;
      }

      // Check permissions
      const permissions = await this.checkPermissions();
      if (!permissions.granted) {
        console.warn('[LocationService] Location permission not granted');
        return null;
      }

      // Check if location services enabled
      const enabled = await this.isLocationEnabled();
      if (!enabled) {
        console.warn('[LocationService] Location services disabled');
        return null;
      }

      console.log('[LocationService] Getting current location...');

      // Get location
      const location = await Location.getCurrentPositionAsync({
        accuracy: this.config.accuracyLevel,
      });

      // Extract coordinates
      const coordinates: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      };

      // Get address via reverse geocoding
      const address = await this.reverseGeocode(coordinates.latitude, coordinates.longitude);

      const transactionLocation: TransactionLocation = {
        coordinates,
        address,
        capturedAt: now,
      };

      // Cache location
      this.lastLocation = transactionLocation;
      this.lastLocationTime = now;

      console.log('[LocationService] Location obtained:', address.formattedAddress);

      // Notify subscribers
      this.notifySubscribers(transactionLocation);

      return transactionLocation;
    } catch (error) {
      console.error('[LocationService] Error getting current location:', error);
      return null;
    }
  }

  /**
   * Reverse geocode: convert coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationAddress> {
    try {
      console.log('[LocationService] Reverse geocoding:', { latitude, longitude });

      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length === 0) {
        console.warn('[LocationService] No address found for coordinates');
        return this.createEmptyAddress(latitude, longitude);
      }

      const result = results[0];

      // Build formatted address
      const addressParts: string[] = [];

      if (result.street) {
        let streetPart = result.street;
        if (result.streetNumber) {
          streetPart += `, ${result.streetNumber}`;
        }
        addressParts.push(streetPart);
      }

      if (result.district) {
        addressParts.push(result.district);
      }

      if (result.city) {
        addressParts.push(result.city);
      }

      if (result.region) {
        addressParts.push(result.region);
      }

      const formattedAddress =
        addressParts.length > 0
          ? addressParts.join(', ')
          : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      const address: LocationAddress = {
        street: result.street || null,
        streetNumber: result.streetNumber || null,
        district: result.district || result.subregion || null,
        city: result.city || null,
        region: result.region || null,
        country: result.country || null,
        postalCode: result.postalCode || null,
        formattedAddress,
      };

      console.log('[LocationService] Address resolved:', formattedAddress);
      return address;
    } catch (error) {
      console.error('[LocationService] Error reverse geocoding:', error);
      return this.createEmptyAddress(latitude, longitude);
    }
  }

  /**
   * Create empty address with just coordinates
   */
  private createEmptyAddress(latitude: number, longitude: number): LocationAddress {
    return {
      street: null,
      streetNumber: null,
      district: null,
      city: null,
      region: null,
      country: null,
      postalCode: null,
      formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    };
  }

  /**
   * Forward geocode: convert address to coordinates (future feature)
   */
  async geocode(address: string): Promise<LocationCoordinates | null> {
    try {
      console.log('[LocationService] Geocoding address:', address);

      const results = await Location.geocodeAsync(address);

      if (results.length === 0) {
        console.warn('[LocationService] No coordinates found for address');
        return null;
      }

      const result = results[0];

      return {
        latitude: result.latitude,
        longitude: result.longitude,
        altitude: result.altitude || null,
        accuracy: result.accuracy || null,
        heading: null,
        speed: null,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[LocationService] Error geocoding:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points (in meters)
   * Using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Subscribe to location updates
   */
  subscribe(callback: (location: TransactionLocation | null) => void): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of location change
   */
  private notifySubscribers(location: TransactionLocation | null): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(location);
      } catch (error) {
        console.error('[LocationService] Error notifying subscriber:', error);
      }
    });
  }

  /**
   * Clear cached location
   */
  clearCache(): void {
    this.lastLocation = null;
    this.lastLocationTime = 0;
    console.log('[LocationService] Cache cleared');
  }

  /**
   * Get last known location (from cache)
   */
  getLastKnownLocation(): TransactionLocation | null {
    return this.lastLocation;
  }

  /**
   * Check if cached location is still valid
   */
  isCacheValid(): boolean {
    if (!this.lastLocation) return false;
    const age = Date.now() - this.lastLocationTime;
    return age < this.config.cacheExpiryMs;
  }

  /**
   * Open device settings for location permissions
   */
  async openSettings(): Promise<void> {
    try {
      // This is platform-specific and might require additional native modules
      // For now, we'll just log
      console.log('[LocationService] Opening settings...');

      if (Platform.OS === 'ios') {
        // On iOS, you can use Linking to open settings
        // await Linking.openURL('app-settings:');
        console.log('[LocationService] iOS: Guide user to Settings > Privacy > Location');
      } else {
        // On Android
        console.log('[LocationService] Android: Guide user to Settings > Apps > Permissions');
      }
    } catch (error) {
      console.error('[LocationService] Error opening settings:', error);
    }
  }

  /**
   * Get location accuracy level description
   */
  getAccuracyDescription(accuracy: Location.Accuracy): string {
    switch (accuracy) {
      case Location.Accuracy.Lowest:
        return 'Baixíssima (até 3 km)';
      case Location.Accuracy.Low:
        return 'Baixa (até 1 km)';
      case Location.Accuracy.Balanced:
        return 'Balanceada (até 100m)';
      case Location.Accuracy.High:
        return 'Alta (até 10m)';
      case Location.Accuracy.Highest:
        return 'Altíssima (melhor possível)';
      case Location.Accuracy.BestForNavigation:
        return 'Navegação (máxima precisão)';
      default:
        return 'Desconhecida';
    }
  }

  /**
   * Serialize location for storage
   */
  serializeLocation(location: TransactionLocation): string {
    return JSON.stringify({
      coordinates: {
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
        altitude: location.coordinates.altitude,
        accuracy: location.coordinates.accuracy,
        timestamp: location.coordinates.timestamp,
      },
      address: location.address,
      capturedAt: location.capturedAt,
    });
  }

  /**
   * Deserialize location from storage
   */
  deserializeLocation(data: string): TransactionLocation | null {
    try {
      const parsed = JSON.parse(data);
      return {
        coordinates: {
          latitude: parsed.coordinates.latitude,
          longitude: parsed.coordinates.longitude,
          altitude: parsed.coordinates.altitude || null,
          accuracy: parsed.coordinates.accuracy || null,
          heading: null,
          speed: null,
          timestamp: parsed.coordinates.timestamp,
        },
        address: parsed.address,
        capturedAt: parsed.capturedAt,
      };
    } catch (error) {
      console.error('[LocationService] Error deserializing location:', error);
      return null;
    }
  }
}

export default LocationService.getInstance();
