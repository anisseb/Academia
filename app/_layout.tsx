import React from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from './context/ThemeContext';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={styles.container}>
        <Slot />
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
