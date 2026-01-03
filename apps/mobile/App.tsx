import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { lightTheme, darkTheme } from './src/theme';
import { ReactQueryProvider } from './src/providers/ReactQueryProvider';
import { AuthProvider } from './src/contexts/AuthContext';
import { BiometricProvider } from './src/contexts/BiometricContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { OfflineProvider } from './src/contexts/OfflineContext';
import { LocationProvider } from './src/contexts/LocationContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReactQueryProvider>
          <PaperProvider theme={theme}>
            <OfflineProvider>
              <LocationProvider>
                <BiometricProvider>
                  <NotificationProvider>
                    <AuthProvider>
                      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                      <RootNavigator />
                    </AuthProvider>
                  </NotificationProvider>
                </BiometricProvider>
              </LocationProvider>
            </OfflineProvider>
          </PaperProvider>
        </ReactQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
