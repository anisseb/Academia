import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

interface AudioButtonProps {
  text: string;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const AudioButton: React.FC<AudioButtonProps> = ({ 
  text, 
  size = 'medium',
  style 
}) => {
  const { isAudioReadingEnabled } = useAccessibility();
  const { isDarkMode } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [animation] = useState(new Animated.Value(1));

  if (!isAudioReadingEnabled) {
    return null;
  }

  const iconSize = size === 'small' ? 20 : size === 'medium' ? 24 : 28;
  const buttonSize = size === 'small' ? 36 : size === 'medium' ? 44 : 52;

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      setIsPlaying(true);
      
      // Animation de pulsation
      const pulse = () => {
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isPlaying) {
            pulse();
          }
        });
      };
      
      pulse();

      // Configurer la voix en français
      Speech.speak(text, {
        language: 'fr-FR',
        rate: 0.9, // Vitesse légèrement réduite pour les enfants DYS
        pitch: 1.0,
        onDone: () => {
          setIsPlaying(false);
          Animated.spring(animation, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        },
        onError: () => {
          setIsPlaying(false);
          Animated.spring(animation, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }
      });
    }
  };

  const backgroundColor = isDarkMode ? '#3d3d3d' : '#e0f2fe';
  const iconColor = isPlaying ? '#3b82f6' : (isDarkMode ? '#60a5fa' : '#0284c7');

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: animation }],
        },
        style
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            backgroundColor,
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isPlaying ? "pause" : "volume-high"} 
          size={iconSize} 
          color={iconColor} 
        />
        {isPlaying && (
          <View style={[styles.playingIndicator, { backgroundColor: iconColor }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  }
});