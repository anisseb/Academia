import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Exercise, Question } from '../../types/exercise';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
import { ExerciseResults } from '../../components/ExerciseResults';
import { Ionicons } from '@expo/vector-icons';
import { renderMathText as MathText } from '../../utils/mathRenderer';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { adUnitIds } from '../../config/admob';
import { safeGoBack } from '../../utils/navigationUtils';

interface CompletedExercise {
  exerciseId: string;
  completedAt: string;
  done: boolean;
  score: number;
  difficulty: string;
}

interface UserProfile {
  completedExercises?: {
    [exerciseId: string]: CompletedExercise;
  };
}

export default function ExercisePage() {
  const { 
    exerciseId,
    subject,
    subjectLabel,
    themeId,
    themeLabel,
    chapterId,
    chapterLabel,
    difficulty
  } = useLocalSearchParams<{
    exerciseId: string;
    subject: string;
    subjectLabel: string;
    themeId: string;
    themeLabel: string;
    chapterId: string;
    chapterLabel: string;
    difficulty: string;
  }>();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [interstitialAd, setInterstitialAd] = useState<InterstitialAd | null>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const statusBarHeight = StatusBar.currentHeight || 0;

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
  };

  useEffect(() => {
    loadExercise();
  }, []);

  const loadExercise = async () => {
    try {
      setIsLoading(true);
      const exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
      
      if (!exerciseDoc.exists()) {
        console.error('Exercice non trouvé');
        setIsLoading(false);
        return;
      }
      
      const exerciseData = exerciseDoc.data();
      setExercise({
        id: exerciseDoc.id,
        ...exerciseData,
        createdAt: exerciseData.createdAt?.toDate() || new Date()
      } as Exercise);

    } catch (error) {
      console.error('Erreur lors du chargement de l\'exercice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return;
    const userData = userDoc.data();
    if(userData.profile) {
      console.log('userData.abonnement.active', userData.abonnement.active);
      setHasActiveSubscription(userData.abonnement.active);
    }
  };


  useEffect(() => {
    loadUserData();
    // Initialiser l'annonce seulement si l'ID est valide
    if (!adUnitIds.interstitial || adUnitIds.interstitial === '') {
      console.warn('⚠️  ID d\'unité publicitaire manquant');
      return;
    }

    if (hasActiveSubscription === true) {
      return;
    }

    try {
      const ad = InterstitialAd.createForAdRequest(adUnitIds.interstitial, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['education', 'school', 'learning']
      });

      const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        console.log('✅ Annonce interstitielle chargée');
        setAdLoaded(true);
      });

      const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.log('❌ Erreur annonce:', error.message || error);
        setAdLoaded(false);
        // Ne pas essayer de recharger immédiatement en cas d'erreur
      });

      const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('📱 Annonce fermée');
        setAdLoaded(false);
        // Recharger une nouvelle annonce pour la prochaine fois
        setTimeout(() => {
          try {
            ad.load();
          } catch (reloadError) {
            console.error('Erreur lors du rechargement de l\'annonce:', reloadError);
          }
        }, 1000);
      });
      // Charger l'annonce
      ad.load();
      setInterstitialAd(ad);

      return () => {
        unsubscribeLoaded();
        unsubscribeError();
        unsubscribeClosed();
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de l\'annonce:', error);
      setAdLoaded(false);
    }
  }, []);


  const handleBack = async () => {
    // Navigation sécurisée vers l'écran précédent ou l'accueil
    safeGoBack(router);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!hasAnswered) {
      const newAnswers = { ...selectedAnswers };
      newAnswers[currentQuestionIndex] = answerIndex;
      setSelectedAnswers(newAnswers);
    }
  };

  const handleValidateAnswer = () => {
    setHasAnswered(true);
    const currentQuestion = exercise!.questions[currentQuestionIndex];
    const isCorrect = selectedAnswers[currentQuestionIndex] === currentQuestion.correctAnswer;
    if (!isCorrect) {
      setShowExplanation(true);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < exercise!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setHasAnswered(false);
      setShowExplanation(false);
    } else {
      // Calculer le score avant d'afficher l'annonce
      const score = calculateScore();
      setCurrentScore(score);
      
      // Si c'est la dernière question, on affiche directement les résultats
      setShowResults(true);
      await handleExerciseComplete(score);
      
      // Puis on montre l'annonce si elle est prête
      console.log('📊 État annonce - Chargée:', adLoaded, '- Disponible:', !!interstitialAd);
      console.log('hasActiveSubscription', hasActiveSubscription);
      if (interstitialAd && adLoaded && hasActiveSubscription === false) {
        try {
          console.log('📺 Affichage de l\'annonce...');
          await interstitialAd.show();
        } catch (error) {
          console.error('❌ Erreur lors de l\'affichage de l\'annonce:', error);
        }
      } else {
        console.log('⚠️  Annonce non disponible - continuer sans pub');
      }

    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setHasAnswered(false);
    setShowExplanation(false);
  };

  const calculateScore = () => {
    if (!exercise) return 0;
    
    // Compter les bonnes réponses
    const correctAnswers = exercise.questions.reduce((acc, question, index) => {
      const isCorrect = question.correctAnswer === selectedAnswers[index];
      return acc + (isCorrect ? 1 : 0);
    }, 0);

    // Calculer le pourcentage
    const totalQuestions = exercise.questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    return score;
  };

  const handleExerciseComplete = async (score: number) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('Utilisateur non connecté');
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error('Document utilisateur non trouvé');
        return;
      }

      const userData = userDoc.data();

      const profile = userData.profile as UserProfile || {};
      
      // Créer l'objet exercice complété
      const completedExercise: CompletedExercise = {
        exerciseId: exerciseId,
        completedAt: new Date().toISOString(),
        done: true,
        score: score,
        difficulty: difficulty || 'facile'
      };

      // Mettre à jour les exercices complétés
      const updatedProfile = {
        ...profile,
        completedExercises: {
          ...(profile.completedExercises || {}),
          [exerciseId]: completedExercise
        }
      };

      // Préparer les mises à jour
      const updates: any = {
        profile: updatedProfile
      };

      // Si l'utilisateur n'a pas d'abonnement actif, mettre à jour dailyExercisesNonActive
      if (!userData.abonnement?.active) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dailyExercises = userData.dailyExercisesNonActive || {};
        
        const lastReset = dailyExercises.lastReset ? new Date(dailyExercises.lastReset.toDate()) : today;
        
        if (lastReset < today) {
          // Réinitialiser le compteur si c'est un nouveau jour
          updates.dailyExercisesNonActive = {
            count: 1,
            lastReset: today
          };
        } else {
          // Incrémenter le compteur
          const currentCount = dailyExercises.count || 0;
          updates.dailyExercisesNonActive = {
            count: currentCount + 1,
            lastReset: dailyExercises.lastReset || today
          };
        }
      }
      
      // Créer l'objet de mise à jour en fonction de l'abonnement
      const updateData = {
        ...updates,
        // Ne pas inclure dailyExercisesNonActive si l'utilisateur a un abonnement
        ...(userData?.abonnement?.active !== true && {
          dailyExercisesNonActive: updates.dailyExercisesNonActive
        })
      };

      await updateDoc(userDocRef, updateData);

    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'exercice:', error);
    }
  };

  const renderResults = () => {
    if (!exercise) return null;
    
    return (
      <ExerciseResults
        exercise={exercise}
        selectedAnswers={selectedAnswers}
        isDarkMode={isDarkMode}
        themeColors={{
          background: isDarkMode ? '#1F2937' : '#FFFFFF',
          text: isDarkMode ? '#FFFFFF' : '#000000',
          card: isDarkMode ? '#374151' : '#FFFFFF',
        }}
      />
    );
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.text }]}>
          Exercice non trouvé
        </Text>
      </SafeAreaView>
    );
  }
  // Ajoutez cette fonction pour obtenir la couleur selon la difficulté
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'facile':
        return '#4CAF50'; // vert
      case 'moyen':
        return '#FFA726'; // orange
      case 'difficile':
        return '#F44336'; // rouge
      default:
        return '#757575'; // gris par défaut
    }
  };

  // Fonction pour traduire le label de difficulté
  const translateDifficulty = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'facile':
        return 'Basique';
      case 'moyen':
        return 'Intermédiaire';
      case 'difficile':
        return 'Avancé';
      default:
        return difficulty;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.mainContainer}>
        <View style={[styles.header, {
          paddingTop: Platform.OS === 'android' ? statusBarHeight + 12 : 16,
          paddingBottom: Platform.OS === 'android' ? 12 : 16,
          marginTop: Platform.OS === 'android' ? 10 : 0,
        }]}>
          {currentQuestionIndex === 0 && (
            <View style={styles.topRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBack}
              >
                <MaterialCommunityIcons
                  name="arrow-left" 
                  size={24}
                  color={themeColors.text} 
                />
              </TouchableOpacity>
              <View style={[
                styles.difficultyBadge, 
                { backgroundColor: getDifficultyColor(exercise.difficulty) }
              ]}>
                <Text style={styles.difficultyText}>
                  {translateDifficulty(exercise.difficulty)}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                {exercise.title || "Exercice"}
              </Text>
            </View>
            <View style={styles.progressContainer}>
              <Text style={[styles.progressText, { color: themeColors.text }]}>
                Question {currentQuestionIndex + 1} sur {exercise.questions.length}
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${((currentQuestionIndex + 1) / exercise.questions.length) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={[styles.progressPercentage, { color: '#60a5fa' }]}>
                {Math.round(((currentQuestionIndex + 1) / exercise.questions.length) * 100)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          <ScrollView style={styles.content}>
            {showResults ? renderResults() : (
              <>
                <View style={[styles.questionCard, { backgroundColor: themeColors.card }]}>
                  <View style={[styles.questionContainer, { backgroundColor: themeColors.card }]}>
                  <MathText
                    content={exercise.questions[currentQuestionIndex].question}
                    type="question"
                    isDarkMode={isDarkMode}
                  />
                  </View>
                  <View style={styles.optionsContainer}>
                    {exercise.questions[currentQuestionIndex].options.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          selectedAnswers[currentQuestionIndex] === index && styles.selectedOption,
                          hasAnswered && index === exercise.questions[currentQuestionIndex].correctAnswer && styles.correctOption,
                          hasAnswered && 
                          selectedAnswers[currentQuestionIndex] === index && 
                          index !== exercise.questions[currentQuestionIndex].correctAnswer && 
                          styles.wrongOption,
                        ]}
                        onPress={() => handleAnswerSelect(index)}
                        disabled={hasAnswered}
                      >
                        <View style={styles.optionContent}>
                          <View style={[styles.optionCircle, { backgroundColor: '#D1D5DB' }]}>
                            <Text style={[styles.optionLetter, { color: '#FFFFFF' }]}>
                              {String.fromCharCode(65 + index)}
                            </Text>
                          </View>
                          <View style={styles.optionTextContainer}>
                            <MathText
                              content={option}
                              type="option"
                              isDarkMode={false}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>

        <View style={[styles.footer, { backgroundColor: themeColors.background }]}>
          {showResults ? (
            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={handleRetry}
              >
                <Ionicons name="refresh" size={24} color="#000000" />
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.homeButton]}
                onPress={() => router.push('/')}
              >
                <Ionicons name="home" size={24} color="#FFFFFF" />
                <Text style={styles.homeButtonText}>Accueil</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {showExplanation && (
                <View >
                  <Text style={[styles.explanationTitle]}>
                    Explication
                  </Text>
                <View style={styles.explanationContainer}>
                  <MathText
                    content={exercise.questions[currentQuestionIndex].explanation}
                    type="explanation"
                    isDarkMode={isDarkMode}
                  />
                </View>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.nextButton,
                (!hasAnswered && selectedAnswers[currentQuestionIndex] === undefined) && 
                styles.nextButtonDisabled
              ]}
              onPress={hasAnswered ? handleNextQuestion : handleValidateAnswer}
              disabled={!hasAnswered && selectedAnswers[currentQuestionIndex] === undefined}
            >
              <Text style={styles.nextButtonText}>
                {hasAnswered 
                  ? (currentQuestionIndex === exercise!.questions.length - 1 
                    ? 'Voir les résultats' 
                    : 'Question suivante')
                  : 'Vérifier'
                }
              </Text>
            </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  mainContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    minHeight: Platform.OS === 'android' ? 70 : 60,
  },
  headerContent: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitleContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    marginRight: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginRight: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 2,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionCard: {
    padding: 10,
    marginBottom: 6,
    borderRadius: 12,
  },
  questionContainer: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#60a5fa',
    padding: 16,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: '#F3F4F6',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    minHeight: 60,
  },
  optionTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
    minHeight: 40,
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedOption: {
    borderColor: '#60a5fa',
    backgroundColor: '#F3F4F6',
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#d9ead3',
  },
  wrongOption: {
    borderColor: '#F44336',
    backgroundColor: '#fde0df',
  },
  nextButton: {
    backgroundColor: '#60a5fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  explanationCard: {
    padding: 8,
    borderRadius: 12,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#60a5fa'
  },
  explanationContainer: {
    backgroundColor: 'rgba(29, 202, 52, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
  },
  explanationText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  answeredOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 8,
  },
  retryButton: {
    backgroundColor: '#F3F4F6',
  },
  homeButton: {
    backgroundColor: '#60a5fa',
  },
  retryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  homeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
  },
}); 

