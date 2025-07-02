import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility, getFontSize, getTitleFontSize } from '../../hooks/useAccessibility';
import { auth, db } from '../../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { audioDescriptionService } from '../../services/audioDescriptionService';

export default function AccessibilityScreen() {
  const { isDarkMode } = useTheme();
  const { settings: accessibilitySettings } = useAccessibility();
  const [audioDescriptionEnabled, setAudioDescriptionEnabled] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xl'>('medium');
  const [voiceType, setVoiceType] = useState<'default' | 'male' | 'female' | 'slow'>('default');
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  useEffect(() => {
    setAudioDescriptionEnabled(accessibilitySettings.audioDescriptionEnabled);
    setFontSize(accessibilitySettings.fontSize);
    setVoiceType(accessibilitySettings.voiceType);
  }, [accessibilitySettings]);

  useEffect(() => {
    audioDescriptionService.setEnabled(audioDescriptionEnabled);
    audioDescriptionService.setVoiceType(voiceType);
  }, [audioDescriptionEnabled, voiceType]);

  const handleAudioDescriptionToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const user = auth.currentUser;
    if (user) {
      const newValue = !audioDescriptionEnabled;
      setAudioDescriptionEnabled(newValue);
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.audioDescriptionEnabled': newValue
      });
    }
  };

  const handleFontSizeChange = async (newSize: 'small' | 'medium' | 'large' | 'xl') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const user = auth.currentUser;
    if (user) {
      setFontSize(newSize);
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.fontSize': newSize
      });
    }
  };

  const handleVoiceTypeChange = async (newVoiceType: 'default' | 'male' | 'female' | 'slow') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const user = auth.currentUser;
    if (user) {
      setVoiceType(newVoiceType);
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.voiceType': newVoiceType
      });
    }
  };

  const handleVoicePreview = async (voiceType: 'default' | 'male' | 'female' | 'slow') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Si une prévisualisation est déjà en cours, l'arrêter
    if (previewingVoice === voiceType) {
      audioDescriptionService.stopAudio();
      setPreviewingVoice(null);
      return;
    }
    
    // Si une autre prévisualisation est en cours, l'arrêter d'abord
    if (previewingVoice !== null) {
      audioDescriptionService.stopAudio();
    }
    
    setPreviewingVoice(voiceType);
    
    try {
      await audioDescriptionService.previewVoice(voiceType);
    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error);
    } finally {
      // Attendre un peu avant de réinitialiser l'état pour permettre à l'audio de se terminer
      setTimeout(() => {
        setPreviewingVoice(null);
      }, 3000);
    }
  };

  const getFontSizeLabel = (size: 'small' | 'medium' | 'large' | 'xl') => {
    switch (size) {
      case 'small': return 'Petite';
      case 'medium': return 'Moyenne';
      case 'large': return 'Grande';
      case 'xl': return 'Très grande';
      default: return 'Moyenne';
    }
  };

  const getVoiceTypeLabel = (type: 'default' | 'male' | 'female' | 'slow') => {
    switch (type) {
      case 'default': return 'Par défaut';
      case 'male': return 'Voix masculine';
      case 'female': return 'Voix féminine';
      case 'slow': return 'Lente';
      default: return 'Par défaut';
    }
  };

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#000' },
          gestureEnabled: false
        }}
      />
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            >
            <Ionicons 
                name="arrow-back" 
                size={24} 
                color={themeColors.text} 
            />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Accessibilité
            </Text>
            <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Audio Description
            </Text>
            <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                <Ionicons 
                    name="volume-high-outline" 
                    size={24} 
                    color={themeColors.text} 
                />
                <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                    Audio description des cours
                    </Text>
                    <Text style={[styles.settingDescription, { color: themeColors.text }]}>
                    Lire automatiquement le contenu des cours à voix haute
                    </Text>
                </View>
                </View>
                <Switch
                value={audioDescriptionEnabled}
                onValueChange={handleAudioDescriptionToggle}
                trackColor={{ false: '#767577', true: '#60a5fa' }}
                thumbColor={audioDescriptionEnabled ? '#ffffff' : '#f4f3f4'}
                />
            </View>

            {audioDescriptionEnabled && (
              <View style={styles.voiceTypeContainer}>
                <Text style={[styles.subsectionTitle, { color: themeColors.text }]}>
                  Type de voix
                </Text>
                <View style={styles.voiceTypeButtons}>
                  {(['default', 'male', 'female', 'slow'] as const).map((type) => (
                    <View key={type} style={styles.voiceTypeRow}>
                      <TouchableOpacity
                        style={[
                          styles.voiceTypeButton,
                          { 
                            backgroundColor: voiceType === type ? '#60a5fa' : 'transparent',
                            borderColor: voiceType === type ? '#60a5fa' : themeColors.border
                          }
                        ]}
                        onPress={() => handleVoiceTypeChange(type)}
                      >
                        <Ionicons 
                          name={type === 'male' ? 'person' : type === 'female' ? 'person' : type === 'slow' ? 'time' : 'mic'} 
                          size={16} 
                          color={voiceType === type ? '#ffffff' : themeColors.text} 
                        />
                        <Text style={[
                          styles.voiceTypeLabel,
                          { 
                            color: voiceType === type ? '#ffffff' : themeColors.text,
                            fontSize: getFontSize(fontSize || 'medium')
                          }
                        ]}>
                          {getVoiceTypeLabel(type)}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.previewButton,
                          { 
                            backgroundColor: previewingVoice === type ? '#60a5fa' : themeColors.background,
                            borderColor: previewingVoice === type ? '#60a5fa' : themeColors.border
                          }
                        ]}
                        onPress={() => handleVoicePreview(type)}
                      >
                        <Ionicons 
                          name={previewingVoice === type ? "stop" : "play"} 
                          size={16} 
                          color={previewingVoice === type ? "#ffffff" : "#60a5fa"} 
                        />
                        <Text style={[
                          styles.previewButtonText,
                          { 
                            color: previewingVoice === type ? "#ffffff" : themeColors.text,
                            fontSize: getFontSize(fontSize)
                          }
                        ]}>
                          {previewingVoice === type ? "Arrêter" : "Écouter"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
            </View>

            <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Taille de Police
            </Text>
            <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                <Ionicons 
                    name="text-outline" 
                    size={24} 
                    color={themeColors.text} 
                />
                <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                    Taille du texte
                    </Text>
                    <Text style={[styles.settingDescription, { color: themeColors.text }]}>
                    Ajuster la taille de police dans les cours, exercices et messages
                    </Text>
                </View>
                </View>
            </View>
            
            <View style={styles.fontSizeContainer}>
                {(['small', 'medium', 'large', 'xl'] as const).map((size) => (
                <TouchableOpacity
                    key={size}
                    style={[
                    styles.fontSizeButton,
                    { 
                        backgroundColor: fontSize === size ? '#60a5fa' : 'transparent',
                        borderColor: fontSize === size ? '#60a5fa' : themeColors.border
                    }
                    ]}
                    onPress={() => handleFontSizeChange(size)}
                >
                    <Ionicons 
                    name="text" 
                    size={size === 'small' ? 14 : size === 'medium' ? 16 : size === 'large' ? 18 : 20} 
                    color={fontSize === size ? '#ffffff' : themeColors.text} 
                    />
                    <Text style={[
                    styles.fontSizeLabel,
                    { 
                        color: fontSize === size ? '#ffffff' : themeColors.text,
                        fontSize: getFontSize(size)
                    }
                    ]}>
                    {getFontSizeLabel(size)}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>

            <View style={styles.previewContainer}>
                <Text style={[styles.previewTitle, { color: themeColors.text }]}>
                Aperçu
                </Text>
                <View style={[styles.previewText, { backgroundColor: themeColors.background }]}>
                <Text style={[
                    styles.previewContent,
                    { 
                    color: themeColors.text,
                    fontSize: getFontSize(fontSize)
                    }
                ]}>
                    Ceci est un exemple de texte avec la taille de police sélectionnée.
                </Text>
                </View>
            </View>
            </View>

            <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Informations
            </Text>
            <View style={styles.infoContainer}>
                <Ionicons 
                name="information-circle-outline" 
                size={20} 
                color="#60a5fa" 
                />
                <Text style={[styles.infoText, { color: themeColors.text }]}>
                Ces paramètres améliorent l'accessibilité de l'application pour les utilisateurs malvoyants ou ayant des difficultés de lecture.
                </Text>
            </View>
            </View>
        </ScrollView>
        </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  voiceTypeContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 12,
  },
  voiceTypeButtons: {
    gap: 8,
  },
  voiceTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    width: '100%',
  },
  voiceTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    gap: 6,
    flex: 1,
    minHeight: 40,
  },
  voiceTypeLabel: {
    fontWeight: '500',
    flexShrink: 1,
  },
  fontSizeContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  fontSizeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 80,
  },
  fontSizeLabel: {
    marginTop: 4,
    fontWeight: '500',
  },
  previewContainer: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewText: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewContent: {
    lineHeight: 24,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    gap: 6,
    minWidth: 90,
    minHeight: 44,
  },
  previewButtonText: {
    fontWeight: '500',
  },
}); 