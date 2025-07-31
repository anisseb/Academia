import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility } from '../../context/AccessibilityContext';

export default function AccessibilityDysScreen() {
  const { isDarkMode } = useTheme();
  const {
    dysFontEnabled,
    audioReadingEnabled,
    simplificationEnabled,
    toggleDysFont,
    toggleAudioReading,
    toggleSimplification,
  } = useAccessibility();

  return (
    <>
      <Stack.Screen options={{ title: 'Accessibilité DYS' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }]}
      >
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
          {/* Police DYS */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="eye-outline"
                size={24}
                color={isDarkMode ? '#ffffff' : '#000000'}
              />
              <Text style={[styles.settingLabel, { color: isDarkMode ? '#ffffff' : '#000000' }]}> 
                Police DYS (OpenDyslexic)
              </Text>
            </View>
            <Switch
              value={dysFontEnabled}
              onValueChange={toggleDysFont}
              trackColor={{ false: '#767577', true: '#60a5fa' }}
              thumbColor={dysFontEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          {/* Lecture audio */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="volume-high-outline"
                size={24}
                color={isDarkMode ? '#ffffff' : '#000000'}
              />
              <Text style={[styles.settingLabel, { color: isDarkMode ? '#ffffff' : '#000000' }]}> 
                Lecture audio des consignes
              </Text>
            </View>
            <Switch
              value={audioReadingEnabled}
              onValueChange={toggleAudioReading}
              trackColor={{ false: '#767577', true: '#60a5fa' }}
              thumbColor={audioReadingEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          {/* Simplification */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="sparkles-outline"
                size={24}
                color={isDarkMode ? '#ffffff' : '#000000'}
              />
              <Text style={[styles.settingLabel, { color: isDarkMode ? '#ffffff' : '#000000' }]}> 
                Simplification automatique des consignes
              </Text>
            </View>
            <Switch
              value={simplificationEnabled}
              onValueChange={toggleSimplification}
              trackColor={{ false: '#767577', true: '#60a5fa' }}
              thumbColor={simplificationEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
  },
});