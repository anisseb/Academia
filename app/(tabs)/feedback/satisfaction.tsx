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

export default function SatisfactionScreen() {
  const { isDarkMode } = useTheme();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const insets = useSafeAreaInsets();

  const handleRating = async (rating: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const feedbackRef = doc(db, 'feedback', 'satisfaction');
      const userSuccessRef = doc(db, 'users', user.uid);
      const feedbackDoc = await getDoc(feedbackRef);
      const userSuccessDoc = await getDoc(userSuccessRef);

      if (feedbackDoc.exists()) {
        const surveys = feedbackDoc.data().surveys || [];
        const userSurveyIndex = surveys.findIndex((survey: any) => survey.userId === user.uid);

        if (userSurveyIndex !== -1) {
          // Mettre à jour la note existante
          surveys[userSurveyIndex] = {
            ...surveys[userSurveyIndex],
            rating,
            comment,
            timestamp: new Date(),
          };
          await updateDoc(feedbackRef, { surveys });
        } else {
          // Ajouter une nouvelle note
          await updateDoc(feedbackRef, {
            surveys: arrayUnion({
              userId: user.uid,
              rating,
              comment,
              timestamp: new Date(),
            })
          });

          // Mettre le compteur de succès à 1 uniquement pour une nouvelle note
          if (userSuccessDoc.exists()) {
            await updateDoc(userSuccessRef, {
              'success.feedback.satisfaction': 1
            });
          } else {
            await setDoc(userSuccessRef, {
              success: {
                feedback: {
                  satisfaction: 1,
                }
              }
            });
          }
        }
      } else {
        // Créer le document avec la première note
        await setDoc(feedbackRef, {
          surveys: [{
            userId: user.uid,
            rating,
            comment,
            timestamp: new Date(),
          }]
        });

        // Mettre le compteur de succès à 1 uniquement pour une nouvelle note
        if (userSuccessDoc.exists()) {
          await updateDoc(userSuccessRef, {
            'success.feedback.satisfaction': 1
          });
        } else {
          await setDoc(userSuccessRef, {
            success: {
              feedback: {
                satisfaction: 1,
              }
            }
          });
        }
      }

      showSuccessAlert('Merci !', 'Votre avis a été enregistré avec succès.');
      setSelectedRating(null);
      setComment('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'avis:', error);
      showErrorAlert('Erreur', 'Impossible d\'envoyer votre avis');
    }
  };

  const handleSubmit = () => {
    if (!selectedRating) {
      showErrorAlert('Erreur', 'Veuillez sélectionner une note avant d\'envoyer');
      return;
    }
    handleRating(selectedRating);
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
              Enquête de satisfaction
            </Text>
            
            <Text style={[styles.question, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Comment évaluez-vous votre expérience avec l'application ?
            </Text>

            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => {
                const colors = {
                  1: '#ef4444', // rouge
                  2: '#f97316', // orange
                  3: '#eab308', // jaune
                  4: '#22c55e', // vert clair
                  5: '#16a34a', // vert foncé
                };

                return (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      {
                        backgroundColor: colors[rating as keyof typeof colors]
                      }
                    ]}
                    onPress={() => setSelectedRating(rating)}
                  >
                    <Text
                      style={[
                        styles.ratingText,
                        {
                          color: selectedRating === rating
                            ? '#ffffff'
                            : (isDarkMode ? '#ffffff' : '#000000'),
                        }
                      ]}
                    >
                      {rating}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Commentaire (optionnel)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: isDarkMode ? '#ffffff' : '#000000',
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
                }
              ]}
              value={comment}
              onChangeText={setComment}
              placeholder="Partagez vos impressions..."
              placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: selectedRating ? '#16a34a' : '#9ca3af' }]}
              onPress={handleSubmit}
              disabled={!selectedRating}
            >
              <Text style={styles.submitButtonText}>Envoyer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </>
  );
}

SatisfactionScreen.options = {
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
    textAlign: 'center',
  },
  question: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 20,
    fontWeight: 'bold',
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
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 