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
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Exercise, Question } from '../types/exercise';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { ExerciseResults } from '../components/ExerciseResults';
import { Ionicons } from '@expo/vector-icons';
import { programmes } from '../constants/programme';
import { renderMathText as MathText } from '../utils/mathRenderer';

interface CompletedExercise {
  exerciceId: string;
  completedAt: string;
  done: boolean;
  score: number;
}

interface ExercisesStructure {
  [schoolType: string]: {
    [classe: string]: {
      [subject: string]: {
        [chapterId: string]: {
          [contentId: string]: CompletedExercise[];
        };
      };
    };
  };
}

interface UserProfile {
  exercises?: ExercisesStructure;
  // ... autres propriétés du profil
}

export default function ExercisePage() {
  const { exerciseId, schoolType, classe, subject, chapterIndex, contentId } = useLocalSearchParams<{
    exerciseId: string;
    schoolType: string;
    classe: string;
    subject: string;
    chapterIndex: string;
    contentId: string;
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
  const [exercises, setExercises] = useState<Array<{
    exerciceId: string;
    subject: string;
    chapterId: string;
    contentId: string;
    done: boolean;
    score: number;
    completedAt: string;
  }>>([]);

  // Obtenir la hauteur de la barre de statut
  const statusBarHeight = StatusBar.currentHeight || 0;

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    await loadExercise(schoolType as string, classe as string);
  };  

  const loadExercise = async (schoolType: string, classe: string) => {
    try {
      // Construire le chemin hiérarchique
      const academiaDoc = await getDoc(doc(db, 'academia', schoolType));
      if (!academiaDoc.exists()) {
        console.error('Document academia non trouvé');
        setIsLoading(false);
        return;
      }

      const academiaData = academiaDoc.data();
      if (!academiaData.classes || 
        !academiaData.classes[classe] || 
        !academiaData.classes[classe].matieres || 
        !academiaData.classes[classe].matieres[subject as string]) {
        console.error('Structure de données invalide');
        setIsLoading(false);
        return;
      }
      
      // Récupérer le programme de la matière
      const subjectProgram = academiaData.classes[classe].matieres[subject as string].programme || [];
      
      // Trouver le chapitre correspondant
      if (isNaN(parseInt(chapterIndex)) || parseInt(chapterIndex) < 0 || parseInt(chapterIndex) >= subjectProgram.length) {
        console.error('Index de chapitre invalide');
        setIsLoading(false);
        return;
      }
      const chapter = subjectProgram[parseInt(chapterIndex)];

      // Trouver le contenu correspondant
      const contentIndex = parseInt(contentId);
      if (isNaN(contentIndex) || contentIndex < 0 || contentIndex >= chapter.content.length) {
        console.error('Index de contenu invalide');
        setIsLoading(false);
        return;
      }

      const content = chapter.content[contentIndex];
      
      // Vérifier si les exercices existent
      if (!content.exercices) {
        console.error('Exercices non trouvés');
        setIsLoading(false);
        return;
      }

      // Parcourir le tableau content.exercices pour trouver l'exercice correspondant à l'exerciseId
      const exerciseData = content.exercices.find((ex: any) => ex.id === exerciseId);
      
      if (!exerciseData) {
        console.error('Exercice non trouvé avec l\'ID:', exerciseId);
        setIsLoading(false);
        return;
      }
      

      setExercise({
        ...exerciseData,
        id: exerciseId as string,
        difficulty: exerciseData.difficulty,
        questions: exerciseData.questions,
        title: exerciseData.title,
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'exercice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExercise(schoolType as string, classe as string);
  }, []);

  const handleBack = async () => {
    router.back();
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

  const handleNextQuestion = () => {
    if (currentQuestionIndex < exercise!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setHasAnswered(false);
      setShowExplanation(false);
    } else {
      setShowResults(true);
      handleExerciseComplete(calculateScore());
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
        exerciceId: exerciseId,
        completedAt: new Date().toISOString(),
        done: true,
        score: score
      };

      // Vérifier et initialiser la structure de manière sécurisée
      const exercises = profile.exercises || {};
      const schoolTypeExercises = exercises[schoolType] || {};
      const classeExercises = schoolTypeExercises[classe] || {};
      const subjectExercises = classeExercises[subject] || {};
      const chapterExercises = subjectExercises[chapterIndex] || {};
      const contentExercises = chapterExercises[contentId] || [];

      // Vérifier si l'exercice existe déjà
      const existingExerciseIndex = contentExercises.findIndex(
        (ex: CompletedExercise) => ex.exerciceId === exerciseId
      );

      if (existingExerciseIndex !== -1) {
        // Mettre à jour l'exercice existant
        contentExercises[existingExerciseIndex] = {
          ...contentExercises[existingExerciseIndex],
          score: score,
          completedAt: completedExercise.completedAt
        };
      } else {
        // Ajouter le nouvel exercice
        contentExercises.push(completedExercise);
      }

      // Reconstruire l'objet de manière sécurisée
      const updatedProfile = {
        ...profile,
        exercises: {
          ...exercises,
          [schoolType]: {
            ...schoolTypeExercises,
            [classe]: {
              ...classeExercises,
              [subject]: {
                ...subjectExercises,
                [chapterIndex]: {
                  ...chapterExercises,
                  [contentId]: contentExercises
                }
              }
            }
          }
        }
      };

      // Mettre à jour le document utilisateur
      await updateDoc(userDocRef, {
        profile: updatedProfile
      });
      
      // Mettre à jour l'état local
      setExercises(prevExercises => 
        prevExercises.map(ex => 
          ex.exerciceId === exerciseId 
            ? { ...ex, completed: true, score: score }
            : ex
        )
      );

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

  const findContentLabel = (exercise: any) => {
    const program = programmes.find(p => 
      p.class === exercise.classe && 
      p.subject === exercise.subject
    );

    if (!program) return '';

    const chapter = program.chapters.find(c => c.id === exercise.metadata.chapter);
    if (!chapter) return '';

    const content = chapter.content.find(c => c.id === exercise.metadata.content);
    return content ? content.content : '';
  };

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.mainContainer}>
        <View style={[styles.header, {
          paddingTop: Platform.OS === 'android' ? statusBarHeight + 12 : 16,
          paddingBottom: Platform.OS === 'android' ? 12 : 16,
          marginTop: Platform.OS === 'android' ? 10 : 0,
        }]}>
          {currentQuestionIndex === 0 && (
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
          )}
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                {exercise.title || "Exercice"}
              </Text>
              <View style={[
                styles.difficultyBadge, 
                { backgroundColor: getDifficultyColor(exercise.difficulty) }
              ]}>
                <Text style={styles.difficultyText}>
                  {exercise.difficulty}
                </Text>
              </View>
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
                  <View style={styles.questionContainer}>
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
                          <View style={[styles.optionTextContainer, { justifyContent: 'center' }]}>
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
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    width: '80%',
    fontWeight: '600',
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
    borderLeftWidth: 4,
    borderLeftColor: '#60a5fa',
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
    minHeight: 40,
    justifyContent: 'center',
    display: 'flex',
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
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  fixedButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    zIndex: 1000,
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
}); 

