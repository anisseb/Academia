import React, { useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  ScrollView, 
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function AccessibilityScreen() {
  const { isDarkMode } = useTheme();
  const {
    isDyslexicFontEnabled,
    isAudioReadingEnabled,
    isSimplificationEnabled,
    toggleDyslexicFont,
    toggleAudioReading,
    toggleSimplification,
  } = useAccessibility();

  // Animations pour chaque toggle
  const fontAnimation = useRef(new Animated.Value(isDyslexicFontEnabled ? 1 : 0)).current;
  const audioAnimation = useRef(new Animated.Value(isAudioReadingEnabled ? 1 : 0)).current;
  const simplificationAnimation = useRef(new Animated.Value(isSimplificationEnabled ? 1 : 0)).current;

  const animateToggle = (animation: Animated.Value, value: boolean) => {
    Animated.spring(animation, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const handleFontToggle = () => {
    toggleDyslexicFont();
    animateToggle(fontAnimation, !isDyslexicFontEnabled);
  };

  const handleAudioToggle = () => {
    toggleAudioReading();
    animateToggle(audioAnimation, !isAudioReadingEnabled);
  };

  const handleSimplificationToggle = () => {
    toggleSimplification();
    animateToggle(simplificationAnimation, !isSimplificationEnabled);
  };

  const backgroundColor = isDarkMode ? '#1a1a1a' : '#f8f9ff';
  const cardColor = isDarkMode ? '#2d2d2d' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#2d3748';
  const subtitleColor = isDarkMode ? '#a0a0a0' : '#718096';
  const accentColor = '#7c3aed';
  const iconBackgroundColor = isDarkMode ? '#3d3d3d' : '#f3e8ff';

  const ToggleCard = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onToggle, 
    animation,
    iconColor 
  }: {
    icon: string;
    title: string;
    subtitle: string;
    value: boolean;
    onToggle: () => void;
    animation: Animated.Value;
    iconColor: string;
  }) => {
    const scale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.05],
    });

    const iconRotation = animation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View 
        style={[
          styles.card,
          { 
            backgroundColor: cardColor,
            transform: [{ scale }],
            shadowColor: value ? iconColor : '#000',
            shadowOpacity: value ? 0.2 : 0.1,
          }
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.leftContent}>
            <Animated.View 
              style={[
                styles.iconContainer, 
                { 
                  backgroundColor: iconBackgroundColor,
                  transform: [{ rotate: iconRotation }]
                }
              ]}
            >
              <Ionicons 
                name={icon as any} 
                size={28} 
                color={value ? iconColor : subtitleColor} 
              />
            </Animated.View>
            <View style={styles.textContainer}>
              <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
              <Text style={[styles.cardSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
            </View>
          </View>
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: '#cbd5e0', true: iconColor }}
            thumbColor={value ? '#ffffff' : '#f4f3f4'}
            ios_backgroundColor="#cbd5e0"
          />
        </View>
      </Animated.View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: iconBackgroundColor }]}>
          <Ionicons name="accessibility" size={40} color={accentColor} />
        </View>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Modules Accessibilité DYS
        </Text>
        <Text style={[styles.headerSubtitle, { color: subtitleColor }]}>
          Active les fonctionnalités qui t'aident à mieux apprendre ! 🌟
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        <ToggleCard
          icon="text"
          title="Police DYS (OpenDyslexic)"
          subtitle="Une police spéciale plus facile à lire"
          value={isDyslexicFontEnabled}
          onToggle={handleFontToggle}
          animation={fontAnimation}
          iconColor="#ec4899"
        />

        <ToggleCard
          icon="volume-high"
          title="Lecture audio des consignes"
          subtitle="Écoute les exercices et les cours"
          value={isAudioReadingEnabled}
          onToggle={handleAudioToggle}
          animation={audioAnimation}
          iconColor="#3b82f6"
        />

        <ToggleCard
          icon="sparkles"
          title="Simplification automatique"
          subtitle="Des consignes plus simples grâce à l'IA"
          value={isSimplificationEnabled}
          onToggle={handleSimplificationToggle}
          animation={simplificationAnimation}
          iconColor="#10b981"
        />
      </View>

      <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
        <Ionicons name="information-circle" size={24} color={accentColor} />
        <Text style={[styles.infoText, { color: textColor }]}>
          Ces options t'aident à mieux comprendre et apprendre. Tu peux les activer ou désactiver quand tu veux ! 
        </Text>
      </View>

      <View style={styles.illustration}>
        <Text style={styles.emoji}>🦸‍♂️</Text>
        <Text style={[styles.illustrationText, { color: subtitleColor }]}>
          Tu es un super héros de l'apprentissage !
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  infoCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  illustration: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingBottom: 50,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  illustrationText: {
    fontSize: 16,
    fontWeight: '500',
  },
});