import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchoolTypes } from '../hooks/useSchoolTypes';
import { OnboardingButton } from '../components/OnboardingButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const parseGradient = (gradientString: string): [string, string] => {
  const colors = gradientString.match(/#[0-9a-fA-F]{6}/g);
  if (colors && colors.length >= 2) {
    return [colors[0], colors[1]];
  }
  return ['#60a5fa', '#3b82f6']; // Valeur par défaut
};

type Step5Props = {
  onNext: (data: { subjects: string[] }) => void;
  onBack: () => void;
  data: {
    schoolType: string;
    class: string;
    subjects?: string[];
  };
};

export default function Step5({ onNext, onBack, data }: Step5Props) {
  const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>(
    data.subjects || []
  );
  const insets = useSafeAreaInsets();
  const { schoolTypes, loading, error } = useSchoolTypes();

  const schoolType = schoolTypes.find(type => type.id === data.schoolType);
  const selectedClass = schoolType?.classes[data.class];
  const availableSubjects = selectedClass ? Object.entries(selectedClass.matieres).map(([id, subject]) => ({
    ...subject,
    id,
    gradientColors: parseGradient(subject.gradient || 'linear-gradient(to right, #60a5fa, #3b82f6)')
  })) : [];

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
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
      <Text style={styles.title}>Vos matières</Text>
      <Text style={styles.subtitle}>
        Sélectionnez les matières que vous souhaitez étudier
      </Text>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {availableSubjects.map((subject) => {
            const isSelected = selectedSubjects.includes(subject.id);

            return (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectButton,
                  isSelected && styles.selectedSubject,
                ]}
                onPress={() => toggleSubject(subject.id)}
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
                  <Text style={styles.subjectLabel}>{subject.label}</Text>
                  <Text style={styles.description}>{subject.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingButton
          icon="arrow-left"
          onPress={onBack}
          style={styles.backButton}
        />
        <OnboardingButton
          label="Terminer"
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
  description: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
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