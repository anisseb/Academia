import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingButton } from '../components/OnboardingButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getClasses } from '../services/firestoreService';
import { Class } from '../types/firestore';
import * as Haptics from 'expo-haptics';

type Step5Props = {
  onNext: (data: { class: string }) => void;
  onBack: () => void;
  data: { name?: string; username?: string; country?: string; schoolType?: string; class?: string };
};

export default function Step5({ onNext, onBack, data }: Step5Props) {
  const [selectedClass, setSelectedClass] = React.useState<string | undefined>(data.class);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  
  // Animation d'entrée
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Animation de sélection
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchClasses = async () => {
      if (!data.country || !data.schoolType) {
        setError('Pays ou type d\'établissement manquant.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await getClasses(data.country, data.schoolType);
        setClasses(result);
      } catch (e) {
        setError("Erreur lors du chargement des classes.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [data.country, data.schoolType]);

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

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
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

  const handleNext = () => {
    if (selectedClass) {
      onNext({
        class: selectedClass,
      });
    }
  };

  const renderClasses = () => {
    if (!classes || classes.length === 0) {
      return null;
    }

    return (
      <View style={styles.grid}>
        {classes.map((classItem) => (
          <Animated.View
            key={classItem.id}
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: selectedClass === classItem.id ? buttonScale : 1 }
                ]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.button,
                selectedClass === classItem.id && styles.selectedButton,
              ]}
              onPress={() => handleClassSelect(classItem.id)}
            >
              <MaterialCommunityIcons
                name="book-education"
                size={32}
                color={selectedClass === classItem.id ? '#60a5fa' : '#94a3b8'}
                style={styles.icon}
              />
              <Text style={styles.label}>{classItem.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Text style={styles.title}>Votre classe</Text>
        <Text style={styles.subtitle}>Sélectionnez votre classe</Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderClasses()}
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingButton
          icon="arrow-left"
          onPress={onBack}
          style={styles.backButton}
        />
        <OnboardingButton
          label="Continuer"
          onPress={handleNext}
          disabled={!selectedClass}
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
  button: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedButton: {
    backgroundColor: '#334155',
    borderColor: '#60a5fa',
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
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