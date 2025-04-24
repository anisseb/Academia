import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchoolTypes } from '../hooks/useSchoolTypes';
import { OnboardingButton } from '../components/OnboardingButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Step5Props = {
  onNext: (data: { class: string }) => void;
  onBack: () => void;
  data: { name?: string; username?: string; country?: string; schoolType?: string; class?: string };
};

export default function Step5({ onNext, onBack, data }: Step5Props) {
  const [selectedClass, setSelectedClass] = React.useState<string | undefined>(data.class);
  const insets = useSafeAreaInsets();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const { schoolTypes, loading, error } = useSchoolTypes();

  const schoolType = schoolTypes.find(type => type.id === data.schoolType);

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

  if (!schoolType) {
    return null;
  }

  const handleNext = () => {
    if (selectedClass) {
      onNext({
        class: selectedClass,
      });
    }
  };

  const renderClasses = () => {
    const classes = schoolType?.classes ? Object.entries(schoolType.classes).map(([id, classData]) => ({
      id,
      label: classData.label
    })) : [];

    if (!classes || classes.length === 0) {
      return null;
    }

    return (
      <View style={styles.grid}>
        {classes.map((classItem) => (
          <TouchableOpacity
            key={classItem.id}
            style={[
              styles.button,
              selectedClass === classItem.id && styles.selectedButton,
            ]}
            onPress={() => setSelectedClass(classItem.id)}
          >
            <MaterialCommunityIcons
              name="book-education"
              size={32}
              color={selectedClass === classItem.id ? '#60a5fa' : '#94a3b8'}
              style={styles.icon}
            />
            <Text style={styles.label}>{classItem.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Votre classe</Text>
      <Text style={styles.subtitle}>Sélectionnez votre classe</Text>

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
  button: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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