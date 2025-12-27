import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { lightTheme, darkTheme } from './src/theme';
import { ReactQueryProvider } from './src/providers/ReactQueryProvider';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReactQueryProvider>
          <PaperProvider theme={theme}>
            <AuthProvider>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
              <RootNavigator />
            </AuthProvider>
          </PaperProvider>
        </ReactQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
