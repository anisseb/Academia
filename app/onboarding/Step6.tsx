import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchoolData } from '../hooks/useSchoolData';
import { OnboardingButton } from '../components/OnboardingButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { parseGradient } from '../utils/subjectGradients';
import * as Haptics from 'expo-haptics';

type Step6Props = {
  onNext: (data: { subjects: Array<{ id: string; label: string }> }) => void;
  onBack: () => void;
  data: {
    name?: string;
    username?: string;
    country?: string;
    schoolType?: string;
    class?: string;
    subjects?: Array<{ id: string; label: string }>;
  };
};

export default function Step6({ onNext, onBack, data }: Step6Props) {
  const [selectedSubjects, setSelectedSubjects] = React.useState<Array<{ id: string; label: string }>>(
    data.subjects || []
  );
  const insets = useSafeAreaInsets();
  const { subjects, loading, error } = useSchoolData(data.country, data.schoolType, data.class);

  // Animations d'entrée
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  // Animation de sélection
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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

  const availableSubjects = subjects.map(subject => ({
    ...subject,
    gradientColors: parseGradient(subject.gradient || 'linear-gradient(to right, #60a5fa, #3b82f6)')
  }));

  const toggleSubject = (subjectId: string, subjectLabel: string) => {
    setSelectedSubjects((prev) =>
      prev.some(subject => subject.id === subjectId)
        ? prev.filter((subject) => subject.id !== subjectId)
        : [...prev, { id: subjectId, label: subjectLabel }]
    );
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
        <Text style={styles.title}>Vos matières</Text>
        <Text style={styles.subtitle}>
          Sélectionnez les matières que vous souhaitez étudier
        </Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <View style={styles.grid}>
            {availableSubjects.map((subject) => {
              const isSelected = selectedSubjects.some(s => s.id === subject.id);
              return (
                <Animated.View
                  key={subject.id}
                  style={[
                    styles.subjectButton,
                    isSelected && styles.selectedSubject,
                    {
                      transform: [
                        ...(isSelected ? [{ scale: buttonScale }] : []),
                      ]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => toggleSubject(subject.id, subject.label)}
                  >
                    <LinearGradient
                      colors={subject.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.gradient,
                        isSelected && styles.selectedGradient,
                      ]}
                    >
                      {isSelected && (
                        <View style={styles.checkmarkContainer}>
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={24}
                            color="#22c55e"
                          />
                        </View>
                      )}
                      <MaterialCommunityIcons
                        name={subject.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={32}
                        color="#fff"
                        style={styles.icon}
                      />
                      <Text 
                        style={styles.subjectLabel}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {subject.label}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingButton
          icon="arrow-left"
          onPress={onBack}
          style={styles.backButton}
        />
        <OnboardingButton
          label="Continuer"
          onPress={() => onNext({ subjects: selectedSubjects })}
          disabled={selectedSubjects.length === 0}
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
  subjectButton: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedSubject: {
    transform: [{ scale: 0.95 }],
  },
  gradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedGradient: {
    opacity: 0.8,
  },
  icon: {
    marginBottom: 12,
  },
  subjectLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    width: 50,
    height: 50,
  },
  continueButton: {
    flex: 1,
    marginLeft: 12,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    zIndex: 1,
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
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 