import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { countries } from '../constants/education';
import { OnboardingButton } from '../components/OnboardingButton';

type Step2Props = {
  onNext: (data: { country: string }) => void;
  onBack: () => void;
  data?: { country?: string };
};

export default function Step2({ onNext, onBack, data }: Step2Props) {
  const [selectedCountry, setSelectedCountry] = React.useState<string | undefined>(data?.country);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Votre pays de résidence</Text>
      <Text style={styles.subtitle}>Sélectionnez votre pays pour personnaliser votre expérience</Text>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {countries.map((country) => (
            <TouchableOpacity
              key={country.id}
              style={[
                styles.countryButton,
                selectedCountry === country.id && styles.selectedCountry,
              ]}
              onPress={() => setSelectedCountry(country.id)}
            >
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={styles.countryName}>{country.name}</Text>
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
          onPress={() => selectedCountry && onNext({ country: selectedCountry })}
          disabled={!selectedCountry}
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
  countryButton: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedCountry: {
    backgroundColor: '#334155',
    borderColor: '#60a5fa',
  },
  flag: {
    fontSize: 32,
    marginBottom: 8,
  },
  countryName: {
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
    borderRadius: 25,
    backgroundColor: '#1e293b',
  },
  continueButton: {
    flex: 1,
    marginLeft: 12,
  },
}); 