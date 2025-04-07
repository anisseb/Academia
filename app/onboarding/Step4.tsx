import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { schoolTypes, technologicalSections } from '../constants/education';
import { OnboardingButton } from '../components/OnboardingButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Step4Props = {
  onNext: (data: { class: string; section?: string }) => void;
  onBack: () => void;
  data: { schoolType: string; class?: string; section?: string };
};

export default function Step4({ onNext, onBack, data }: Step4Props) {
  const [selectedClass, setSelectedClass] = React.useState<string | undefined>(data.class);
  const [selectedSection, setSelectedSection] = React.useState<string | undefined>(data.section);
  const insets = useSafeAreaInsets();

  const schoolType = schoolTypes.find(type => type.id === data.schoolType);
  const isHighTechnical = data.schoolType === 'high_technological';

  if (!schoolType) {
    return null;
  }

  const handleNext = () => {
    if (selectedClass) {
      onNext({
        class: selectedClass,
        ...(isHighTechnical && selectedSection && { section: selectedSection }),
      });
    }
  };

  const renderTechnologicalSections = () => (
    <View style={styles.grid}>
      {technologicalSections.map((section) => (
        <TouchableOpacity
          key={section.id}
          style={[
            styles.button,
            selectedSection === section.id && styles.selectedButton,
          ]}
          onPress={() => {
            setSelectedSection(section.id);
            setSelectedClass(undefined);
          }}
        >
          <MaterialCommunityIcons
            name="school"
            size={32}
            color={selectedSection === section.id ? '#60a5fa' : '#94a3b8'}
            style={styles.icon}
          />
          <Text style={styles.label}>{section.label}</Text>
          <Text style={styles.description}>{section.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderClasses = () => {
    const classes = isHighTechnical
      ? selectedSection
        ? technologicalSections.find(s => s.id === selectedSection)?.classes
        : []
      : schoolType.classes;

    if (!classes || classes.length === 0) {
      return null;
    }

    return (
      <View style={styles.grid}>
        {classes.map((classItem) => {
          const label = typeof classItem === 'string' ? classItem : classItem.label;
          const id = typeof classItem === 'string' ? classItem : classItem.id;

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.button,
                selectedClass === id && styles.selectedButton,
              ]}
              onPress={() => setSelectedClass(id)}
            >
              <MaterialCommunityIcons
                name="book-education"
                size={32}
                color={selectedClass === id ? '#60a5fa' : '#94a3b8'}
                style={styles.icon}
              />
              <Text style={styles.label}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.title}>
          {isHighTechnical
            ? selectedSection
              ? 'Votre classe'
              : 'Votre filière'
            : 'Votre classe'}
        </Text>
        <Text style={styles.subtitle}>
          {isHighTechnical
            ? selectedSection
              ? 'Sélectionnez votre niveau'
              : 'Sélectionnez votre filière'
            : 'Sélectionnez votre classe'}
        </Text>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {isHighTechnical && !selectedSection
            ? renderTechnologicalSections()
            : renderClasses()}
        </ScrollView>

        <View style={styles.footer}>
          <OnboardingButton
            icon="arrow-left"
            onPress={() => {
              if (isHighTechnical && selectedSection) {
                setSelectedSection(undefined);
                setSelectedClass(undefined);
              } else {
                onBack();
              }
            }}
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
  description: {
    color: '#94a3b8',
    fontSize: 12,
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
}); 