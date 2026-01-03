import React, { memo, useState, useCallback } from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  View,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
} from 'react-native';
import { Text } from 'react-native-paper';

/**
 * OptimizedImage
 *
 * Componente de imagem otimizado
 *
 * Features:
 * - Lazy loading
 * - Placeholder enquanto carrega
 * - Error handling
 * - Cache nativo
 * - Resize mode configurável
 * - Loading indicator
 */

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri?: string } | number;
  placeholderColor?: string;
  showLoadingIndicator?: boolean;
  fallbackIcon?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
}

const OptimizedImageComponent: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholderColor = '#f0f0f0',
  showLoadingIndicator = true,
  fallbackIcon = '🖼️',
  width,
  height,
  borderRadius,
  onLoadEnd,
  onError,
  resizeMode = 'cover',
  ...imageProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  const handleError = useCallback(
    (error: any) => {
      setIsLoading(false);
      setHasError(true);
      onError?.(error);
      console.error('[OptimizedImage] Error loading image:', error);
    },
    [onError]
  );

  const imageStyle: StyleProp<ImageStyle> = [
    style,
    width && { width },
    height && { height },
    borderRadius && { borderRadius },
  ];

  const containerStyle = [
    styles.container,
    width && { width },
    height && { height },
    borderRadius && { borderRadius },
    { backgroundColor: placeholderColor },
  ];

  // Error state
  if (hasError) {
    return (
      <View style={[containerStyle, styles.errorContainer]}>
        <Text style={styles.fallbackIcon}>{fallbackIcon}</Text>
        <Text variant="bodySmall" style={styles.errorText}>
          Erro ao carregar
        </Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Image
        source={source}
        style={imageStyle}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...imageProps}
      />

      {/* Loading indicator */}
      {isLoading && showLoadingIndicator && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
    </View>
  );
};

/**
 * Memoize to prevent unnecessary re-renders
 */
export const OptimizedImage = memo(OptimizedImageComponent);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    opacity: 0.5,
    fontSize: 10,
  },
});
