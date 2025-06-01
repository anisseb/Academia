import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingButton } from '../components/OnboardingButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SchoolType } from '../types/firestore';
import { getSchoolTypes } from '../services/firestoreService';
import * as Haptics from 'expo-haptics';

type Step4Props = {
  onNext: (data: { schoolType: string }) => void;
  onBack: () => void;
  data?: { name?: string; username?: string; country?: string; schoolType?: string };
};

const schoolTypeIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  primary: 'school',
  middle: 'school-outline',
  high_general: 'school',
  high_technological: 'tools',
  high_professional: 'hammer-wrench',
  university: 'school',
};

export default function Step4({ onNext, onBack, data }: Step4Props) {
  const [selectedType, setSelectedType] = React.useState<string | undefined>(data?.schoolType);
  const insets = useSafeAreaInsets();
  
  // Animation d'entrée
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Animation de sélection
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  const [schoolTypes, setSchoolTypes] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolTypes = async () => {
      const schoolTypes = await getSchoolTypes(data?.country || '');
      setSchoolTypes(schoolTypes);
      setLoading(false);
    };
    fetchSchoolTypes();
  }, [data?.country]);

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Animation de sélection
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Text style={styles.title}>Votre niveau d'études</Text>
        <Text style={styles.subtitle}>Sélectionnez votre type d'établissement</Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {schoolTypes.map((type) => (
            <Animated.View
              key={type.id}
              style={[
                styles.buttonContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: selectedType === type.id ? buttonScale : 1 }
                  ]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === type.id && styles.selectedType,
                ]}
                onPress={() => handleTypeSelect(type.id)}
              >
                <MaterialCommunityIcons
                  name={schoolTypeIcons[type.id] || 'school'}
                  size={32}
                  color={selectedType === type.id ? '#60a5fa' : '#94a3b8'}
                  style={styles.icon}
                />
                <Text style={styles.typeName}>{type.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingButton
          icon="arrow-left"
          onPress={onBack}
          style={styles.backButton}
        />
        <OnboardingButton
          label="Continuer"
          onPress={() => selectedType && onNext({ schoolType: selectedType })}
          disabled={!selectedType}
          style={styles.continueButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  buttonContainer: {
    width: '48%',
    marginBottom: 16,
  },
  typeButton: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedType: {
    backgroundColor: '#334155',
    borderColor: '#60a5fa',
  },
  icon: {
    marginBottom: 8,
  },
  typeName: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  backButton: {
    width: 50,
    height: 50,
  },
  continueButton: {
    flex: 1,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
}); 