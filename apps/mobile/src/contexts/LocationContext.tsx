import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import * as Location from 'expo-location';
import LocationService, {
  TransactionLocation,
  LocationPermissionStatus,
  LocationServiceConfig,
} from '../services/LocationService';

/**
 * LocationContext
 *
 * Context global para gerenciamento de localização
 *
 * Features:
 * - Estado global de permissões
 * - Localização atual
 * - Auto-refresh de localização
 * - Cache de localização
 */

interface LocationContextData {
  // Permission state
  permissionStatus: LocationPermissionStatus | null;
  isLocationEnabled: boolean;

  // Current location
  currentLocation: TransactionLocation | null;
  isLoadingLocation: boolean;
  locationError: string | null;

  // Actions
  requestPermissions: () => Promise<LocationPermissionStatus>;
  getCurrentLocation: (forceRefresh?: boolean) => Promise<TransactionLocation | null>;
  clearLocationCache: () => void;
  configure: (config: Partial<LocationServiceConfig>) => void;
  openSettings: () => Promise<void>;

  // Utils
  isCacheValid: () => boolean;
  getLastKnownLocation: () => TransactionLocation | null;
}

const LocationContext = createContext<LocationContextData>({} as LocationContextData);

interface LocationProviderProps {
  children: ReactNode;
  autoRequestPermissions?: boolean;
  autoLoadLocation?: boolean;
}

export function LocationProvider({
  children,
  autoRequestPermissions = false,
  autoLoadLocation = false,
}: LocationProviderProps) {
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<TransactionLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  /**
   * Initialize location service
   */
  useEffect(() => {
    initializeLocationService();
  }, []);

  /**
   * Subscribe to location updates
   */
  useEffect(() => {
    const unsubscribe = LocationService.subscribe((location) => {
      setCurrentLocation(location);
    });

    return unsubscribe;
  }, []);

  /**
   * Initialize
   */
  const initializeLocationService = async () => {
    try {
      console.log('[LocationContext] Initializing location service...');

      // Check if location services enabled
      const enabled = await LocationService.isLocationEnabled();
      setIsLocationEnabled(enabled);

      // Check current permissions
      const permissions = await LocationService.checkPermissions();
      setPermissionStatus(permissions);

      // Auto-request permissions if configured
      if (autoRequestPermissions && !permissions.granted) {
        await requestPermissions();
      }

      // Auto-load location if configured and permissions granted
      if (autoLoadLocation && permissions.granted) {
        await getCurrentLocation();
      }

      console.log('[LocationContext] Location service initialized');
    } catch (error) {
      console.error('[LocationContext] Error initializing location service:', error);
      setLocationError('Erro ao inicializar serviço de localização');
    }
  };

  /**
   * Request location permissions
   */
  const requestPermissions = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      console.log('[LocationContext] Requesting permissions...');
      setLocationError(null);

      const result = await LocationService.requestForegroundPermissions();
      setPermissionStatus(result);

      if (!result.granted) {
        if (result.status === Location.PermissionStatus.DENIED && !result.canAskAgain) {
          setLocationError(
            'Permissão de localização negada permanentemente. Abra as configurações do app para habilitar.'
          );
        } else {
          setLocationError('Permissão de localização não concedida');
        }
      }

      return result;
    } catch (error) {
      console.error('[LocationContext] Error requesting permissions:', error);
      setLocationError('Erro ao solicitar permissão de localização');
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.UNDETERMINED,
      };
    }
  }, []);

  /**
   * Get current location
   */
  const getCurrentLocation = useCallback(
    async (forceRefresh: boolean = false): Promise<TransactionLocation | null> => {
      try {
        console.log('[LocationContext] Getting current location...');
        setIsLoadingLocation(true);
        setLocationError(null);

        // Check permissions first
        if (!permissionStatus?.granted) {
          const permissions = await requestPermissions();
          if (!permissions.granted) {
            setLocationError('Permissão de localização necessária');
            return null;
          }
        }

        // Check if location services enabled
        const enabled = await LocationService.isLocationEnabled();
        setIsLocationEnabled(enabled);

        if (!enabled) {
          setLocationError('Serviços de localização desabilitados no dispositivo');
          return null;
        }

        // Get location
        const location = await LocationService.getCurrentLocation(forceRefresh);

        if (!location) {
          setLocationError('Não foi possível obter a localização');
          return null;
        }

        setCurrentLocation(location);
        return location;
      } catch (error) {
        console.error('[LocationContext] Error getting current location:', error);
        setLocationError('Erro ao obter localização atual');
        return null;
      } finally {
        setIsLoadingLocation(false);
      }
    },
    [permissionStatus, requestPermissions]
  );

  /**
   * Clear location cache
   */
  const clearLocationCache = useCallback(() => {
    LocationService.clearCache();
    setCurrentLocation(null);
    setLocationError(null);
  }, []);

  /**
   * Configure location service
   */
  const configure = useCallback((config: Partial<LocationServiceConfig>) => {
    LocationService.configure(config);
  }, []);

  /**
   * Open device settings
   */
  const openSettings = useCallback(async () => {
    await LocationService.openSettings();
  }, []);

  /**
   * Check if cache is valid
   */
  const isCacheValid = useCallback((): boolean => {
    return LocationService.isCacheValid();
  }, []);

  /**
   * Get last known location
   */
  const getLastKnownLocation = useCallback((): TransactionLocation | null => {
    return LocationService.getLastKnownLocation();
  }, []);

  const value: LocationContextData = {
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
    isCacheValid,
    getLastKnownLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

/**
 * Hook to use location context
 */
export function useLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }

  return context;
}
