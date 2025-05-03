import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { auth, db } from '../../../firebaseConfig';
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SuggestionsScreen() {
  const { isDarkMode } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const insets = useSafeAreaInsets();
  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (!title || !description) {
        showErrorAlert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const feedbackRef = doc(db, 'feedback', 'suggestions');
      const userSuccessRef = doc(db, 'users', user.uid);
      const feedbackDoc = await getDoc(feedbackRef);
      const userSuccessDoc = await getDoc(userSuccessRef);

      if (feedbackDoc.exists()) {
        await updateDoc(feedbackRef, {
          suggestions: arrayUnion({
            userId: user.uid,
            title,
            description,
            category,
            timestamp: new Date(),
            status: 'new',
            votes: 0,
          })
        });
      } else {
        await setDoc(feedbackRef, {
          suggestions: [{
            userId: user.uid,
            title,
            description,
            category,
            timestamp: new Date(),
            status: 'new',
            votes: 0,
          }]
        });
      }

      // Incrémenter le compteur de succès pour les suggestions
      if (userSuccessDoc.exists()) {
        const currentSuccess = userSuccessDoc.data().success || { feedback: { suggestions: 0 } };
        const currentSuggestionsCount = currentSuccess.feedback?.suggestions || 0;
        await updateDoc(userSuccessRef, {
          'success.feedback.suggestions': currentSuggestionsCount + 1
        });
      } else {
        await setDoc(userSuccessRef, {
          success: {
            feedback: {
              suggestions: 1
            }
          }
        });
      }

      showSuccessAlert('Merci !', 'Votre suggestion a été enregistrée avec succès.');
      setTitle('');
      setDescription('');
      setCategory('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la suggestion:', error);
      showErrorAlert('Erreur', 'Impossible d\'envoyer votre suggestion');
    }
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
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <View style={{ top: insets.top }}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkMode ? '#ffffff' : '#000000'}
            />
          </TouchableOpacity>

          <ScrollView style={styles.content}>
            <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Suggestions d'amélioration
            </Text>

            <Text style={[styles.label, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Titre de la suggestion *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: isDarkMode ? '#ffffff' : '#000000',
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
                }
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Donnez un titre à votre suggestion"
              placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
            />

            <Text style={[styles.label, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Description détaillée *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: isDarkMode ? '#ffffff' : '#000000',
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre suggestion en détail"
              placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
              multiline
              numberOfLines={4}
            />

            <Text style={[styles.label, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Catégorie (optionnel)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: isDarkMode ? '#ffffff' : '#000000',
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
                }
              ]}
              value={category}
              onChangeText={setCategory}
              placeholder="Ex: Interface, Fonctionnalités, Performance..."
              placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Envoyer la suggestion</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </>
  );
}

SuggestionsScreen.options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
  },
  content: {
    padding: 16,
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 