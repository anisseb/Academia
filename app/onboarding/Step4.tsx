import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchoolTypes } from '../hooks/useSchoolTypes';
import { OnboardingButton } from '../components/OnboardingButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const { schoolTypes, loading, error } = useSchoolTypes();

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
        <Text style={styles.title}>Votre niveau d'études</Text>
        <Text style={styles.subtitle}>Sélectionnez votre type d'établissement</Text>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {schoolTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  selectedType === type.id && styles.selectedType,
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <MaterialCommunityIcons
                  name={schoolTypeIcons[type.id] || 'school'}
                  size={32}
                  color={selectedType === type.id ? '#60a5fa' : '#94a3b8'}
                  style={styles.icon}
                />
                <Text style={styles.typeName}>{type.label}</Text>
              </TouchableOpacity>
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
  typeButton: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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