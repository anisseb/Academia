import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function AccessibilityScreen() {
  const { isDarkMode } = useTheme();
  const { settings, toggleDysLexicFont, toggleAudioReading, toggleAutoSimplification } = useAccessibility();

  // Animations pour les toggles
  const dysLexicAnimation = new Animated.Value(settings.isDysLexicFontEnabled ? 1 : 0);
  const audioAnimation = new Animated.Value(settings.isAudioReadingEnabled ? 1 : 0);
  const simplificationAnimation = new Animated.Value(settings.isAutoSimplificationEnabled ? 1 : 0);

  useEffect(() => {
    Animated.timing(dysLexicAnimation, {
      toValue: settings.isDysLexicFontEnabled ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [settings.isDysLexicFontEnabled]);

  useEffect(() => {
    Animated.timing(audioAnimation, {
      toValue: settings.isAudioReadingEnabled ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [settings.isAudioReadingEnabled]);

  useEffect(() => {
    Animated.timing(simplificationAnimation, {
      toValue: settings.isAutoSimplificationEnabled ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [settings.isAutoSimplificationEnabled]);

  const handleToggle = async (toggleFunction: () => Promise<void>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFunction();
  };

  const FeatureCard = ({ 
    title, 
    description, 
    icon, 
    iconColor,
    value, 
    onToggle, 
    animation 
  }: {
    title: string;
    description: string;
    icon: string;
    iconColor: string;
    value: boolean;
    onToggle: () => Promise<void>;
    animation: Animated.Value;
  }) => {
    const backgroundColor = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [isDarkMode ? '#2d2d2d' : '#f8f9fa', isDarkMode ? '#1e3a8a' : '#e3f2fd'],
    });

    const borderColor = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [isDarkMode ? '#444' : '#e0e0e0', isDarkMode ? '#3b82f6' : '#2196f3'],
    });

    return (
      <Animated.View
        style={[
          styles.featureCard,
          {
            backgroundColor,
            borderColor,
            borderWidth: 2,
          },
        ]}
      >
        <View style={styles.featureHeader}>
          <View style={styles.featureIcon}>
            <Ionicons name={icon as any} size={28} color={iconColor} />
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>
              {title}
            </Text>
            <Text style={[styles.featureDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
              {description}
            </Text>
          </View>
          <Switch
            value={value}
            onValueChange={() => handleToggle(onToggle)}
            trackColor={{ false: isDarkMode ? '#444' : '#d0d0d0', true: '#4ade80' }}
            thumbColor={value ? '#ffffff' : isDarkMode ? '#888' : '#ffffff'}
            style={styles.switch}
          />
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={isDarkMode ? '#ffffff' : '#000000'} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Accessibilité DYS
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.introSection}>
          <View style={styles.introIcon}>
            <Ionicons name="accessibility" size={40} color="#10b981" />
          </View>
          <Text style={[styles.introTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>
            Fonctionnalités d'aide
          </Text>
          <Text style={[styles.introText, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
            Active les outils qui t'aident à mieux apprendre et comprendre tes leçons.
          </Text>
        </View>

        {/* Fonctionnalités */}
        <View style={styles.featuresSection}>
          <FeatureCard
            title="Police DYS (OpenDyslexic)"
            description="Une police spéciale qui facilite la lecture pour les élèves DYS"
            icon="text"
            iconColor="#f59e0b"
            value={settings.isDysLexicFontEnabled}
            onToggle={toggleDysLexicFont}
            animation={dysLexicAnimation}
          />

          <FeatureCard
            title="Lecture audio des consignes"
            description="Écoute les instructions des exercices et cours avec un petit haut-parleur"
            icon="volume-high"
            iconColor="#3b82f6"
            value={settings.isAudioReadingEnabled}
            onToggle={toggleAudioReading}
            animation={audioAnimation}
          />

          <FeatureCard
            title="Simplification automatique"
            description="Les consignes compliquées deviennent plus simples à comprendre"
            icon="bulb"
            iconColor="#10b981"
            value={settings.isAutoSimplificationEnabled}
            onToggle={toggleAutoSimplification}
            animation={simplificationAnimation}
          />
        </View>

        {/* Note explicative */}
        <View style={[styles.noteSection, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f9ff' }]}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={[styles.noteText, { color: isDarkMode ? '#cccccc' : '#1e40af' }]}>
            Ces fonctionnalités t'accompagnent dans tous tes exercices et cours. 
            Tu peux les activer ou désactiver quand tu veux !
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  introIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  featuresSection: {
    gap: 15,
    marginBottom: 30,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
    marginRight: 15,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  noteSection: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 10,
    flex: 1,
  },
});