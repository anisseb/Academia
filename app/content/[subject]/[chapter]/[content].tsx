import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, RefreshControl, Platform, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Exercise } from '../../../types/exercise';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../../firebaseConfig';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { parseGradient } from '../../../utils/subjectGradients';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContentPage() {
  const { 
    subject,
    subjectIcon,
    subjectLabel,
    subjectGradient,
    themeId,
    themeLabel,
    chapterId,
    chapterLabel,
  } = useLocalSearchParams();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [isLoading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [chapterData, setChapterData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userCountry, setUserCountry] = useState<string>('');
  const [userClass, setUserClass] = useState<string>('');
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [remainingExercises, setRemainingExercises] = useState(5);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [exerciseScores, setExerciseScores] = useState<{[key: string]: number}>({});
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'notCompleted'>('all');
  const [userData, setUserData] = useState<any>(null);
  const statusBarHeight = StatusBar.currentHeight || 0;

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
  };

  useEffect(() => {
    loadFilterPreference();
    loadUserData();
  }, []);

  // Ajouter un useEffect pour recharger les exercices quand les données utilisateur sont disponibles
  useEffect(() => {
    if (userCountry && userClass) {
      loadChapterAndExercises();
    }
  }, [userCountry, userClass]);

  const loadFilterPreference = async () => {
    try {
      const savedFilter = await AsyncStorage.getItem('exerciseFilter');
      if (savedFilter) {
        setFilterType(savedFilter as 'all' | 'completed' | 'notCompleted');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du filtre:', error);
    }
  };

  const saveFilterPreference = async (filter: 'all' | 'completed' | 'notCompleted') => {
    try {
      await AsyncStorage.setItem('exerciseFilter', filter);
      setFilterType(filter);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du filtre:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) { 
        const userData = userDoc.data();
        setUserData(userData);
        setUserCountry(userData.profile?.country || '');
        setUserClass(userData.profile?.class || '');
        setHasActiveSubscription(userData.abonnement?.active === true);
        
        // Traiter completedExercises comme un objet
        const userCompletedExercises = userData.profile?.completedExercises;
        
        if (userCompletedExercises && typeof userCompletedExercises === 'object' && !Array.isArray(userCompletedExercises)) {
          // Extraire les IDs des exercices complétés et les scores
          const completedIds = Object.keys(userCompletedExercises);
          const scores: {[key: string]: number} = {};
          
          completedIds.forEach((exerciseId: string) => {
            const exerciseData = userCompletedExercises[exerciseId];
            if (exerciseData && exerciseData.score !== undefined) {
              scores[exerciseId] = exerciseData.score;
            }
          });
          
          setCompletedExercises(completedIds);
          setExerciseScores(scores);
        } else {
          setCompletedExercises([]);
          setExerciseScores({});
        }

        if (!userData.abonnement?.active) {
          // Vérifier le nombre d'exercices déjà effectués aujourd'hui
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const dailyExercises = userData.dailyExercisesNonActive || {};
          const lastReset = dailyExercises.lastReset ? new Date(dailyExercises.lastReset.toDate()) : today;
          
          if (lastReset < today) {
            // Si c'est un nouveau jour, on réinitialise le compteur
            setRemainingExercises(5);
          } else {
            // Sinon on vérifie le nombre d'exercices restants
            const completedCount = dailyExercises.count || 0;
            setRemainingExercises(Math.max(0, 5 - completedCount));
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      setCompletedExercises([]); // En cas d'erreur, on initialise avec un tableau vide
    } finally {
      setLoading(false);
    }
  };

  const loadChapterAndExercises = async () => {
    try {
      setLoading(true);
      
      // Récupérer le chapitre
      const chapterDoc = await getDoc(doc(db, 'chapters', chapterId as string));
      if (!chapterDoc.exists()) {
        console.error('Chapitre non trouvé');
        setLoading(false);
        return;
      }

      const chapterData = chapterDoc.data();
      setChapterData(chapterData);

      // Récupérer les exercices associés au chapitre
      const exercisesRef = collection(db, 'exercises');
      const exercisesQuery = query(
        exercisesRef,
        where('chapterId', '==', chapterId),
        where('themeId', '==', themeId),
        where('subjectId', '==', subject),
        where('classId', '==', userClass),
        where('countryId', '==', userCountry)
      );

      const exercisesSnapshot = await getDocs(exercisesQuery);
      const exercisesData = exercisesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          chapterId: data.chapterId || '',
          themeId: data.themeId || '',
          subjectId: data.subjectId || '',
          classId: data.classId || '',
          countryId: data.countryId || '',
          schoolTypeId: data.schoolTypeId || '',
          title: data.title || '',
          difficulty: data.difficulty || 'facile',
          questions: data.questions || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          isCompleted: data.isCompleted || false,
          score: data.score || 0
        } as Exercise;
      });

      setExercises(exercisesData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChapterAndExercises();
  };

  const handleExercisePress = async (exercise: Exercise) => {
    if (!hasActiveSubscription && remainingExercises <= 0) {
      Alert.alert(
        "Limite d'exercices atteinte",
        "Vous avez atteint votre limite d'exercices gratuits pour aujourd'hui. Passez à Academia Réussite pour un accès illimité !",
        [
          {
            text: "Voir les abonnements",
            onPress: () => router.push('/settings/subscriptions'),
            style: "default"
          },
          {
            text: "Annuler",
            style: "cancel"
          }
        ]
      );
      return;
    }

    router.push({
      pathname: "/content/exercise/[id]",
      params: { 
        exerciseId: exercise.id,
        exercice: exercise,
        difficulty: exercise.difficulty,
        subject: String(subject),
        subjectLabel: String(subjectLabel),
        themeId: String(themeId),
        themeLabel: String(themeLabel),
        chapterId: String(chapterId),
        chapterLabel: String(chapterLabel)
      }
    } as any);
  };

  const handleChapterContentPress = () => {
    router.push({
      pathname: '/content/[cours]/cours',
      params: {
        subject: subject as string,
        subjectLabel: subjectLabel as string,
        subjectGradient: subjectGradient,
        themeId: themeId as string,
        themeLabel: themeLabel as string,
        chapterId: chapterId as string,
        chapterLabel: chapterLabel as string,
      },
    } as any);
  };

  const renderBackButton = () => (
    <View style={[styles.header, { 
      backgroundColor: themeColors.background,
      paddingTop: Platform.OS === 'android' ? statusBarHeight + 12 : 16,
      paddingBottom: Platform.OS === 'android' ? 12 : 16,
      marginTop: Platform.OS === 'android' ? 10 : 0,
     }]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.replace('/(tabs)/entrainement');
        }}
      >
        <MaterialCommunityIcons 
          name="arrow-left" 
          size={30} 
          color={themeColors.text} 
        />
      </TouchableOpacity>
    </View>
  );

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

  const getFilteredExercises = () => {
    switch (filterType) {
      case 'completed':
        return exercises.filter(exercise => completedExercises.includes(exercise.id));
      case 'notCompleted':
        return exercises.filter(exercise => !completedExercises.includes(exercise.id));
      default:
        return exercises;
    }
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterType === 'all' && styles.filterButtonActive,
          { backgroundColor: filterType === 'all' ? '#60a5fa' : themeColors.card }
        ]}
        onPress={() => saveFilterPreference('all')}
      >
        <Text style={[
          styles.filterButtonText,
          { color: filterType === 'all' ? '#ffffff' : themeColors.text }
        ]}>
          Tous ({exercises.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterType === 'completed' && styles.filterButtonActive,
          { backgroundColor: filterType === 'completed' ? '#60a5fa' : themeColors.card }
        ]}
        onPress={() => saveFilterPreference('completed')}
      >
        <Text style={[
          styles.filterButtonText,
          { color: filterType === 'completed' ? '#ffffff' : themeColors.text }
        ]}>
          Complétés ({exercises.filter(ex => completedExercises.includes(ex.id)).length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterType === 'notCompleted' && styles.filterButtonActive,
          { backgroundColor: filterType === 'notCompleted' ? '#60a5fa' : themeColors.card }
        ]}
        onPress={() => saveFilterPreference('notCompleted')}
      >
        <Text style={[
          styles.filterButtonText,
          { color: filterType === 'notCompleted' ? '#ffffff' : themeColors.text }
        ]}>
          À faire ({exercises.filter(ex => !completedExercises.includes(ex.id)).length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getScoreColor = (score: number) => {
    if (score >= 0 && score <= 3) return '#F44336'; // Rouge
    if (score >= 4 && score <= 6) return '#FF9800'; // Orange
    if (score >= 7 && score <= 10) return '#4CAF50'; // Vert
    return '#4CAF50'; // Vert par défaut
  };

  const formatCompletionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return "Hier";
    } else if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const isCompleted = Array.isArray(completedExercises) && completedExercises.includes(exercise.id);
    const score = exerciseScores[exercise.id];
    const scoreDisplay = score ? Math.round(score / 10) : null;
    const scoreColor = scoreDisplay !== null ? getScoreColor(scoreDisplay) : '#4CAF50';
    
    // Récupérer la date de completion depuis les données utilisateur chargées
    const userCompletedExercisesData = userData?.profile?.completedExercises;
    const completionDate = userCompletedExercisesData && userCompletedExercisesData[exercise.id]?.completedAt;
    
    return (
      <TouchableOpacity
        key={exercise.id}
        style={[
          styles.exerciseCard, 
          { backgroundColor: themeColors.card },
          isCompleted && styles.completedExerciseCard,
          isCompleted && { borderColor: scoreColor, borderWidth: 4 }
        ]}
        onPress={() => handleExercisePress(exercise)}
      >
        <View style={styles.exerciseHeader}>
          <Text style={[styles.exerciseTitle, { color: themeColors.text }]}>
            {exercise.title}
          </Text>
          {isCompleted && (
            <View style={styles.completedContainer}>
              <MaterialCommunityIcons name="check-circle" size={24} color={scoreColor} />
              {scoreDisplay !== null && (
                <View style={[styles.scoreContainer, { backgroundColor: scoreColor }]}>
                  <Text style={styles.scoreText}>{scoreDisplay}/10</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={styles.exerciseFooter}>
          <View style={[styles.difficultyBadge, styles[`difficulty${exercise.difficulty}`]]}>
            <Text style={styles.difficultyText}>
              {translateDifficulty(exercise.difficulty)}
            </Text>
          </View>
          {isCompleted && completionDate && (
            <View style={styles.completionDateContainer}>
              <MaterialCommunityIcons name="calendar-check" size={14} color={themeColors.text + '80'} />
              <Text style={[styles.completionDateText, { color: themeColors.text + '80' }]}>
                {formatCompletionDate(completionDate)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessageLimitContainer = () => (
    <View style={styles.messageLimitContainer}>
      <View style={styles.messageLimitContent}>
        <MaterialCommunityIcons 
          name="crown" 
          size={32} 
          color="#FFD700" 
          style={styles.crownIcon}
        />
        <Text style={[styles.messageLimitTitle, { color: themeColors.text }]}>
          Limite d'exercices atteinte
        </Text>
        <Text style={[styles.messageLimitText, { color: themeColors.text }]}>
          Vous avez atteint votre limite d'exercices gratuits pour aujourd'hui. Passez à Academia Réussite pour un accès illimité !
        </Text>
        <TouchableOpacity 
          style={styles.subscribeButton}
          onPress={() => router.push('/settings/subscriptions')}
        >
          <Text style={styles.subscribeButtonText}>
            Voir les abonnements
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        {renderBackButton()}
        <View style={styles.contentContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      </SafeAreaView>
    );
  }

  if (!chapterData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        {renderBackButton()}
        <View style={styles.contentContainer}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: themeColors.text }]}>
              Contenu non trouvé
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {renderBackButton()}
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#60a5fa']}
              tintColor={isDarkMode ? '#ffffff' : '#000000'}
            />
          }
          scrollEventThrottle={400}
        >
          <View style={[styles.contentCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.headerContainer}>
              <View style={styles.breadcrumbContainer}>
                <View style={styles.breadcrumbRow}>
                  <MaterialCommunityIcons
                    name={subjectIcon as any}
                    size={20}
                    color={parseGradient(subjectGradient as string)[0]}
                  />
                  <Text style={[styles.breadcrumbText, { color: parseGradient(subjectGradient as string)[0] }]} numberOfLines={1} ellipsizeMode="tail">
                    {subjectLabel}
                  </Text>
                  <View style={styles.breadcrumbColumn}>
                    <Feather name="chevron-down" size={14} color={themeColors.text} style={styles.breadcrumbSeparator} />
                    <Text style={styles.breadcrumbText}>
                      {themeLabel}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-down" size={14} color={themeColors.text} style={styles.breadcrumbSeparator} />
              </View>
              <View style={styles.titleContainer}>
                <Text
                  style={[styles.chapterMainTitle, { color: themeColors.text }]}
                  numberOfLines={3}
                  adjustsFontSizeToFit
                >
                  {chapterLabel}
                </Text>
                <View style={styles.titleUnderline} />
              </View>
            </View>
          </View>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Cours
          </Text>
          <TouchableOpacity
            style={[styles.courseCard, { backgroundColor: themeColors.card }]}
            onPress={handleChapterContentPress}
          >
            <View style={styles.courseContent}>
              <View style={styles.courseIconContainer}>
                <MaterialCommunityIcons 
                  name="book-open-page-variant"
                  size={32} 
                  color="#60a5fa" 
                />
              </View>
              <View style={styles.courseTextContainer}>
                <Text style={[styles.courseTitle, { color: themeColors.text }]}>
                  Consulter le cours
                </Text>
                <Text style={[styles.courseDescription, { color: themeColors.text + '99' }]}>
                  Apprenez les concepts clés et les applications pratiques
                </Text>
              </View>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color={themeColors.text} 
                style={styles.courseArrow}
              />
            </View>
          </TouchableOpacity>

          {remainingExercises > 0 && (
            <>
              {!hasActiveSubscription && (
                <View style={styles.exerciseLimitContainer}>
                  <Text style={[styles.exerciseLimitText, { color: themeColors.text }]}>
                    {remainingExercises > 0
                      ? `${remainingExercises} exercice${remainingExercises > 1 ? 's' : ''} restant${remainingExercises > 1 ? 's' : ''} aujourd'hui`
                      : "Limite d'exercices atteinte pour aujourd'hui"}
                  </Text>
                </View>
              )}
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Exercices
              </Text>
              
              {renderFilterButtons()}
              
              {getFilteredExercises().map(renderExerciseCard)}
            </>
          )}

          {!hasActiveSubscription && remainingExercises == 0 && (
            renderMessageLimitContainer()
          )}
          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: Platform.OS === 'android' ? 70 : 60,
    justifyContent: 'center',
  },
  backButton: {
    padding: 16,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  contentCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: 'transparent',
  },
  breadcrumbContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  breadcrumbRow: {
    flexDirection: 'column',
    alignItems: 'center',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  breadcrumbColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 2,
  },
  breadcrumbIcon: {
    marginRight: 6,
    opacity: 0.7,
  },
  breadcrumbText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  breadcrumbSeparator: {
    marginTop: 10,
    marginBottom: 8,
  },
  titleContainer: {
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: '100%',
  },
  chapterMainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  titleUnderline: {
    height: 4,
    backgroundColor: '#60a5fa',
    borderRadius: 2,
    width: '100%',
    marginTop: 4,
  },
  themeSubtitle: {
    fontSize: 15,
    color: '#60a5fa',
    fontWeight: '500',
    marginBottom: 0,
  },
  contentHeader: {
    marginTop: 8,
  },
  contentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 18,
  },
  contentIcon: {
    marginRight: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  difficultyfacile: {
    backgroundColor: '#4CAF50',
  },
  difficultymoyen: {
    backgroundColor: '#FF9800',
  },
  difficultydifficile: {
    backgroundColor: '#F44336',
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
  courseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseIconContainer: {
    padding: 8,
  },
  courseTextContainer: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  courseDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  courseArrow: {
    marginLeft: 12,
  },
  exerciseLimitContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseLimitText: {
    fontSize: 12,
    opacity: 0.8,
  },
  messageLimitContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  messageLimitContent: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  crownIcon: {
    marginBottom: 15,
  },
  messageLimitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  messageLimitText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  subscribeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#60a5fa',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completedContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  scoreContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedExerciseCard: {
    borderWidth: 4,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(22, 27, 22, 0.05)',
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  completionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completionDateText: {
    fontSize: 12,
    opacity: 0.8,
  },
}); 