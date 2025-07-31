import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AccessibleText } from './AccessibleText';
import { AudioIcon } from './AudioIcon';
import { useTheme } from '../context/ThemeContext';

// Exemple d'utilisation des fonctionnalités d'accessibilité DYS
export const ExampleExercisePage: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        
        {/* Titre du cours avec accessibilité */}
        <AccessibleText
          weight="bold"
          style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}
          audioIconSize={24}
        >
          Les fractions en mathématiques
        </AccessibleText>

        {/* Consigne d'exercice complexe qui sera simplifiée */}
        <View style={styles.exerciseContainer}>
          <AccessibleText
            weight="bold"
            style={[styles.exerciseTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
          >
            Exercice 1 - Calcul de fractions
          </AccessibleText>

          <AccessibleText
            style={[styles.instruction, { color: isDarkMode ? '#cccccc' : '#333333' }]}
            enableSimplification={true}
          >
            Dans cet exercice, vous devez effectuer les opérations suivantes en utilisant les règles de calcul des fractions. Premièrement, déterminez le résultat de l'addition de 3/4 et 1/8, puis procédez à la multiplication du résultat obtenu par 2/3. N'oubliez pas de simplifier la fraction finale si cela est possible.
          </AccessibleText>
        </View>

        {/* Questions avec audio intégré */}
        <View style={styles.questionContainer}>
          <AccessibleText
            weight="bold"
            style={[styles.questionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
          >
            Question 1:
          </AccessibleText>

          <AccessibleText
            style={[styles.questionText, { color: isDarkMode ? '#cccccc' : '#333333' }]}
          >
            Calculez 3/4 + 1/8
          </AccessibleText>
        </View>

        <View style={styles.questionContainer}>
          <AccessibleText
            weight="bold"
            style={[styles.questionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
          >
            Question 2:
          </AccessibleText>

          <AccessibleText
            style={[styles.questionText, { color: isDarkMode ? '#cccccc' : '#333333' }]}
          >
            Multipliez le résultat précédent par 2/3
          </AccessibleText>
        </View>

        {/* Exemple d'aide avec audio simple */}
        <View style={[styles.helpContainer, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa' }]}>
          <AccessibleText
            weight="bold"
            style={[styles.helpTitle, { color: '#3b82f6' }]}
          >
            💡 Aide
          </AccessibleText>

          <View style={styles.helpRow}>
            <AccessibleText
              style={[styles.helpText, { color: isDarkMode ? '#cccccc' : '#666666' }]}
              showAudioIcon={true}
            >
              Pour additionner des fractions, il faut d'abord trouver un dénominateur commun.
            </AccessibleText>
          </View>

          <View style={styles.helpRow}>
            <AccessibleText
              style={[styles.helpText, { color: isDarkMode ? '#cccccc' : '#666666' }]}
              showAudioIcon={true}
            >
              Exemple: 3/4 + 1/8 = 6/8 + 1/8 = 7/8
            </AccessibleText>
          </View>
        </View>

        {/* Définition avec simplification automatique */}
        <View style={[styles.definitionContainer, { backgroundColor: isDarkMode ? '#1e3a8a' : '#e3f2fd' }]}>
          <AccessibleText
            weight="bold"
            style={[styles.definitionTitle, { color: isDarkMode ? '#60a5fa' : '#1e40af' }]}
          >
            📖 Définition
          </AccessibleText>

          <AccessibleText
            style={[styles.definitionText, { color: isDarkMode ? '#bfdbfe' : '#1e40af' }]}
            enableSimplification={true}
          >
            Une fraction représente une partie d'un tout. Le numérateur indique combien de parties nous considérons, tandis que le dénominateur représente en combien de parties égales le tout a été divisé. Pour effectuer des opérations sur les fractions, il est nécessaire de maîtriser certaines règles fondamentales.
          </AccessibleText>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  exerciseContainer: {
    marginBottom: 25,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exerciseTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  instruction: {
    fontSize: 16,
    lineHeight: 24,
  },
  questionContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  questionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  helpContainer: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  helpRow: {
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },
  definitionContainer: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  definitionTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  definitionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});