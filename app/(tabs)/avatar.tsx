import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Avatar3D from '../components/Avatar3D';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type AnimationType = 'idle' | 'smile' | 'wave' | 'crossArms';

interface AnimationButton {
  animation: AnimationType;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
}

const animations: AnimationButton[] = [
  { 
    animation: 'idle', 
    label: 'Repos', 
    icon: 'user',
    description: 'Position neutre'
  },
  { 
    animation: 'smile', 
    label: 'Sourire', 
    icon: 'smile',
    description: 'Un grand sourire'
  },
  { 
    animation: 'wave', 
    label: 'Saluer', 
    icon: 'hand',
    description: 'Lever le bras pour dire bonjour'
  },
  { 
    animation: 'crossArms', 
    label: 'Bras croisés', 
    icon: 'shield',
    description: 'Croiser les bras'
  },
];

export default function AvatarScreen() {
  const { isDarkMode } = useTheme();
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>('idle');
  const [interactionCount, setInteractionCount] = useState(0);

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    cardBackground: isDarkMode ? '#2a2a2a' : '#f5f5f5',
    buttonBackground: isDarkMode ? '#3a3a3a' : '#e5e7eb',
    activeButton: isDarkMode ? '#60a5fa' : '#3b82f6',
    border: isDarkMode ? '#333333' : '#e5e7eb',
    description: isDarkMode ? '#9ca3af' : '#6b7280',
  };

  const handleAnimationChange = (animation: AnimationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentAnimation(animation);
    setInteractionCount(interactionCount + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.avatarContainer}>
        <Avatar3D 
          animation={currentAnimation} 
          style={styles.avatar3D}
        />
      </View>

      <View style={[styles.infoCard, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[styles.infoTitle, { color: themeColors.text }]}>
          Avatar Interactif
        </Text>
        <Text style={[styles.infoText, { color: themeColors.description }]}>
          Touchez les boutons ci-dessous pour interagir avec l'avatar
        </Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Feather name="activity" size={20} color={themeColors.activeButton} />
            <Text style={[styles.statText, { color: themeColors.text }]}>
              {interactionCount} interactions
            </Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="zap" size={20} color={themeColors.activeButton} />
            <Text style={[styles.statText, { color: themeColors.text }]}>
              Animation: {currentAnimation}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.controlsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Animations disponibles
        </Text>
        <View style={styles.buttonsGrid}>
          {animations.map((anim) => (
            <TouchableOpacity
              key={anim.animation}
              style={[
                styles.animationButton,
                { 
                  backgroundColor: currentAnimation === anim.animation 
                    ? themeColors.activeButton 
                    : themeColors.buttonBackground,
                  borderColor: currentAnimation === anim.animation 
                    ? themeColors.activeButton 
                    : themeColors.border,
                }
              ]}
              onPress={() => handleAnimationChange(anim.animation)}
              activeOpacity={0.7}
            >
              <Feather 
                name={anim.icon} 
                size={24} 
                color={currentAnimation === anim.animation ? '#ffffff' : themeColors.text} 
              />
              <Text 
                style={[
                  styles.buttonLabel, 
                  { 
                    color: currentAnimation === anim.animation ? '#ffffff' : themeColors.text,
                    fontWeight: currentAnimation === anim.animation ? '600' : '400'
                  }
                ]}
              >
                {anim.label}
              </Text>
              <Text 
                style={[
                  styles.buttonDescription, 
                  { 
                    color: currentAnimation === anim.animation 
                      ? 'rgba(255,255,255,0.8)' 
                      : themeColors.description 
                  }
                ]}
              >
                {anim.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.tipCard, { backgroundColor: themeColors.cardBackground }]}>
          <Feather name="info" size={20} color={themeColors.activeButton} />
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: themeColors.text }]}>
              Astuce
            </Text>
            <Text style={[styles.tipText, { color: themeColors.description }]}>
              Vous pouvez faire tourner l'avatar en glissant votre doigt sur l'écran. 
              Pincez pour zoomer et dézoomer.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarContainer: {
    height: 300,
    width: '100%',
    backgroundColor: 'transparent',
  },
  avatar3D: {
    flex: 1,
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
  },
  controlsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  animationButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
  },
  buttonLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});