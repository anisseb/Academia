import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

interface AudioIconProps {
  text: string;
  size?: number;
  style?: any;
  simplified?: boolean; // Si le texte a été simplifié par l'IA
}

export const AudioIcon: React.FC<AudioIconProps> = ({ 
  text, 
  size = 24, 
  style, 
  simplified = false 
}) => {
  const { settings } = useAccessibility();
  const { isDarkMode } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const scaleValue = new Animated.Value(1);

  if (!settings.isAudioReadingEnabled) {
    return null;
  }

  const handlePress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Animation de pression
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      if (isPlaying) {
        Speech.stop();
        setIsPlaying(false);
        return;
      }

      setIsPlaying(true);

      // Nettoyer le texte pour une meilleure lecture
      const cleanText = text
        .replace(/\*\*/g, '') // Enlever le markdown bold
        .replace(/\*/g, '') // Enlever le markdown italic
        .replace(/#{1,6}\s/g, '') // Enlever les titres markdown
        .replace(/\n+/g, ' ') // Remplacer les retours à la ligne par des espaces
        .trim();

      const options = {
        language: 'fr-FR',
        pitch: 1.0,
        rate: 0.8, // Vitesse légèrement réduite pour les DYS
        voice: undefined,
        onStart: () => setIsPlaying(true),
        onDone: () => setIsPlaying(false),
        onStopped: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      };

      await Speech.speak(cleanText, options);
    } catch (error) {
      console.error('Erreur lors de la lecture audio:', error);
      setIsPlaying(false);
    }
  };

  const iconColor = simplified 
    ? '#10b981' // Vert si le texte a été simplifié
    : '#3b82f6'; // Bleu sinon

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View style={[
        styles.iconContainer,
        {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          transform: [{ scale: scaleValue }],
        }
      ]}>
        <Ionicons
          name={isPlaying ? "stop" : "volume-medium"}
          size={size}
          color={iconColor}
        />
        {simplified && (
          <Text style={[styles.simplifiedBadge, { color: iconColor }]}>
            AI
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  simplifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 8,
    fontWeight: 'bold',
    backgroundColor: 'white',
    paddingHorizontal: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
});