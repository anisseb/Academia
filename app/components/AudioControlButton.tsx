import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { audioDescriptionService } from '../services/audioDescriptionService';
import * as Haptics from 'expo-haptics';

interface AudioControlButtonProps {
  isDarkMode: boolean;
  isAudioEnabled: boolean;
  onPress?: () => void;
}

export default function AudioControlButton({ 
  isDarkMode, 
  isAudioEnabled, 
  onPress 
}: AudioControlButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Vérifier l'état initial
    setIsPlaying(audioDescriptionService.isCurrentlyPlaying());

    // Écouter les changements d'état via le système d'événements
    const handleStateChange = (playing: boolean) => {
      setIsPlaying(playing);
    };

    audioDescriptionService.addStateChangeListener(handleStateChange);

    return () => {
      audioDescriptionService.removeStateChangeListener(handleStateChange);
    };
  }, []);

  const themeColors = {
    background: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    text: isDarkMode ? '#ffffff' : '#000000',
    border: isDarkMode ? '#333333' : '#e0e0e0',
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (isPlaying) {
      audioDescriptionService.stopAudio();
    }
    
    if (onPress) {
      onPress();
    }
  };

  if (!isAudioEnabled) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { 
            backgroundColor: themeColors.background,
            borderColor: themeColors.border
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isPlaying ? "stop" : "volume-high"} 
          size={20} 
          color={isPlaying ? "#ef4444" : "#60a5fa"} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 30,
    zIndex: 1000,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 