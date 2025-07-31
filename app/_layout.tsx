import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemeProvider } from './context/ThemeContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useSession } from './hooks/useSession';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  const { isValidating } = useSession();
  const [fontsLoaded] = useFonts({
    'OpenDyslexic-Regular': require('../assets/fonts/OpenDyslexic-Regular.ttf'),
    'OpenDyslexic-Bold': require('../assets/fonts/OpenDyslexic-Bold.ttf'),
    'OpenDyslexic-Italic': require('../assets/fonts/OpenDyslexic-Italic.ttf'),
    'OpenDyslexic-BoldItalic': require('../assets/fonts/OpenDyslexic-BoldItalic.ttf'),
  });

  useEffect(() => {
  }, []);

  if (isValidating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <ThemeProvider>
          <AccessibilityProvider>
            <Slot />
            <StatusBar style="auto" />
          </AccessibilityProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
