import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { getAuth } from 'firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import { DEFAULT_EXPRESSIONS } from '../constants/dailyExpression';
import { collection, getDocs } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { configureNotifications, scheduleMotivationalNotifications } from '../utils/notifications';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface SubjectStats {
  averageScore: number;
  completedExercises: number;
  consecutiveDays: number;
  correctAnswers: number;
  incorrectAnswers: number;
  precision: number;
}

interface ExerciseData {
  completedAt: string;
  done: boolean;
  exerciceId: string;
  score: number;
}

interface DailyExpression {
  id: string;
  title: string;
  message: string;
  createdAt: number;
}

type QuickActionProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  onPress: () => void;
  backgroundColor: string;
  color: string;
  description: string;
};

const QuickAction = ({ icon, title, onPress, backgroundColor, color, description }: QuickActionProps) => (
  <TouchableOpacity 
    style={[styles.quickAction, { backgroundColor: backgroundColor + '30' }]} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: backgroundColor + '40' }]}>
      <MaterialCommunityIcons name={icon} size={28} color={backgroundColor} />
    </View>
    <Text style={[styles.quickActionText, { color }]}>{title}</Text>
    <Text style={[styles.quickActionDescription, { color }]}>{description}</Text>
  </TouchableOpacity>
);

type StatCardProps = {
  title: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  colorText: string;
  trend?: number;
};

const StatCard = ({ title, value, icon, color, colorText, trend }: StatCardProps) => (
  <View style={[styles.statCard, { backgroundColor: color + '30' }]}>
    <View style={styles.statHeader}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      {trend !== undefined && (
        <View style={[styles.trendContainer, { backgroundColor: trend > 0 ? '#4CAF50' + '40' : '#ef4444' + '40' }]}>
          <MaterialCommunityIcons 
            name={trend > 0 ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={trend > 0 ? '#4CAF50' : '#ef4444'} 
          />
          <Text style={[styles.trendText, { color: trend > 0 ? '#4CAF50' : '#ef4444' }]}>
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={[styles.statTitle, { color: colorText }]}>{title}</Text>
  </View>
);

export default function HomeScreen() {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState<Record<string, SubjectStats>>({});
  const [subjectInfos, setSubjectInfos] = useState<Record<string, any>>({});
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [userStats, setUserStats] = useState({
    completedCourses: 0,
    completedExercises: 0,
    totalPoints: 0,
    achievements: 0
  });
  const [userName, setUserName] = useState('');
  const [dailyExpression, setDailyExpression] = useState<DailyExpression | null>(null);
  const [isLoadingExpression, setIsLoadingExpression] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);
  const [todayExercisesCount, setTodayExercisesCount] = useState(0);
  const [todayCourses, setTodayCourses] = useState<any[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState(0);
  const [courseProgress, setCourseProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [reminderTime, setReminderTime] = useState<string>('19:30'); // Par défaut à 20h

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    primary: '#60a5fa',
    secondary: '#4CAF50',
    accent: '#FFD700',
    danger: '#ef4444'
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [140, 0],
    extrapolate: 'clamp',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    loadUserStats();
    loadUserName();
    loadDailyExpression();
    // Vérifier la connexion avant de configurer les notifications
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        configureNotifications();
      }
    });
    loadReminderTime();
  }, []);


  const loadUserStats = async () => {
    try {
      const user = auth.currentUser;
      let totalScore = 0;
      let countExercises = 0;
      let completedCourses = 0;
      let completedAchievements = 0;

      if (!user) {
        setUserStats({
          completedCourses: 0,
          completedExercises: 0,
          totalPoints: 0,
          achievements: 0
        });
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setUserStats({
          completedCourses: 0,
          completedExercises: 0,
          totalPoints: 0,
          achievements: 0
        });
        return;
      }

      const userData = userDoc.data();
      const profile = userData.profile || {};
      const cours = userData.success?.cours || {};
      const achievements = profile.completedAchievements || [];
      const completedExercises = profile.completedExercises || {};
      
      completedCourses = Object.keys(cours).length;
      completedAchievements = achievements.length;

      // Calculer les statistiques des exercices
      Object.values(completedExercises).forEach((exercise: any) => {
        if (exercise.done) {
          totalScore += exercise.score || 0;
          countExercises++;
        }
      });

      setUserStats({
        completedCourses,
        completedExercises: countExercises,
        totalPoints: totalScore,
        achievements: completedAchievements
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setUserStats({
        completedCourses: 0,
        completedExercises: 0,
        totalPoints: 0,
        achievements: 0
      });
    }
  };

  const loadUserName = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const profile = userData.profile || {};
      setUserName(profile.name || '');
    } catch (error) {
      console.error('Erreur lors du chargement du prénom:', error);
    }
  };

  const loadDailyExpression = async () => {
    try {
      setIsLoadingExpression(true);
      const user = auth.currentUser;
      if (!user) {
        // Utiliser une expression par défaut si pas d'utilisateur
        const randomExpression = DEFAULT_EXPRESSIONS[Math.floor(Math.random() * DEFAULT_EXPRESSIONS.length)];
        setDailyExpression({
          id: 'default',
          title: randomExpression.title,
          message: randomExpression.message,
          createdAt: Date.now()
        });
        return;
      }

      // Vérifier la connexion
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        // Utiliser une expression par défaut en mode hors ligne
        const randomExpression = DEFAULT_EXPRESSIONS[Math.floor(Math.random() * DEFAULT_EXPRESSIONS.length)];
        setDailyExpression({
          id: 'default',
          title: randomExpression.title,
          message: randomExpression.message,
          createdAt: Date.now()
        });
        return;
      }

      // Récupérer toutes les expressions
      const expressionsRef = collection(db, 'dailyExpression');
      const expressionsSnapshot = await getDocs(expressionsRef);
      
      if (expressionsSnapshot.empty) {
        const randomExpression = DEFAULT_EXPRESSIONS[Math.floor(Math.random() * DEFAULT_EXPRESSIONS.length)];
        setDailyExpression({
          id: 'default',
          title: randomExpression.title,
          message: randomExpression.message,
          createdAt: Date.now()
        });
        return;
      }

      // Convertir les expressions en tableau
      const expressions = expressionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyExpression[];

      // Sélectionner une expression aléatoire
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
      setDailyExpression(randomExpression);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'expression:', error);
      // Utiliser une expression par défaut en cas d'erreur
      const randomExpression = DEFAULT_EXPRESSIONS[Math.floor(Math.random() * DEFAULT_EXPRESSIONS.length)];
      setDailyExpression({
        id: 'default',
        title: randomExpression.title,
        message: randomExpression.message,
        createdAt: Date.now()
      });
    } finally {
      setIsLoadingExpression(false);
    }
  };

  const loadReminderTime = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();

      if (userData.settings?.reminderTime && userData.settings.reminderTime !== 'none') {
        setReminderTime(userData.settings.reminderTime);
      } else {
        // Valeur par défaut si aucune heure n'est définie
        setReminderTime('19:30');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'heure de rappel:', error);
      // Valeur par défaut en cas d'erreur
      setReminderTime('19:30');
    }
  };

  const scheduleDailyReminder = async () => {
    try {
      // Ne plus annuler toutes les notifications existantes ici
      // await Notifications.cancelAllScheduledNotificationsAsync();

      // Vérifier si l'objectif a été atteint aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const dailyProgress = userData.success?.dailyProgress || {};
      const lastUpdated = dailyProgress.lastUpdated?.toDate();

      const isAlreadyCompleted = lastUpdated && 
        lastUpdated.setHours(0, 0, 0, 0) === today.getTime();

      // Si l'objectif n'a pas été atteint, planifier une notification
      if (!isAlreadyCompleted) {
        const [hours, minutes] = reminderTime.split(':').map(Number);
        const trigger = new Date();
        trigger.setHours(hours, minutes, 0, 0);

        // Si l'heure est déjà passée aujourd'hui, planifier pour demain
        if (trigger.getTime() <= Date.now()) {
          trigger.setDate(trigger.getDate() + 1);
        }

        await Notifications.scheduleNotificationAsync({
          identifier: 'daily-reminder',
          content: {
            title: "Objectif quotidien non atteint",
            body: "N'oubliez pas de compléter vos exercices et cours quotidiens !",
            data: { type: 'daily_reminder' },
            sound: true
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 24 * 60 * 60, // 24 heures
            repeats: true,
          },
        });
      }
    } catch (error) {
      console.error('Erreur lors de la planification de la notification:', error);
    }
  };

  const evaluateDailyProgress = async () => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Récupérer les données de l'utilisateur
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const profile = userData.profile || {};
      const completedExercises = profile.completedExercises || {};
      const courses = userData.success?.cours || {};
      const dailyProgress = userData.success?.dailyProgress || {};

      // Vérifier si l'objectif a déjà été atteint aujourd'hui
      const lastUpdated = dailyProgress.lastUpdated?.toDate();
      const isAlreadyCompleted = lastUpdated && 
        lastUpdated.setHours(0, 0, 0, 0) === today.getTime();

      // Compter les exercices complétés aujourd'hui (max 3)
      let todayExercisesCount = 0;
      Object.values(completedExercises).forEach((exercise: any) => {
        if (exercise.completedAt && todayExercisesCount < 3) {
          const exDate = new Date(exercise.completedAt);
          exDate.setHours(0, 0, 0, 0);
          if (exDate.getTime() === today.getTime()) {
            todayExercisesCount++;
          }
        }
      });

      // Filtrer les cours d'aujourd'hui (max 1)
      const todayCourses = Object.entries(courses)
        .filter(([_, course]: [string, any]) => {
          if (!course.timestamp) {
            return false;
          }
          
          const courseDate = new Date(course.timestamp);
          
          // Créer les dates de début de jour en heure française
          const courseDateStart = new Date(courseDate);
          courseDateStart.setHours(0, 0, 0, 0);
          
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);
          
          return courseDateStart.getTime() === todayStart.getTime();
        })
        .slice(0, 1)
        .map(([_, course]) => course);

      // Calculer la progression
      const exerciseProgress = Math.min(todayExercisesCount / 3, 1); // 3 exercices = 100%
      const courseProgress = todayCourses.length > 0 ? 1 : 0; // 1 cours = 100%
      const totalProgress = Math.round((exerciseProgress + courseProgress) / 2 * 100);

      // Mettre à jour les états
      setTodayExercisesCount(todayExercisesCount);
      setTodayCourses(todayCourses);
      setExerciseProgress(exerciseProgress);
      setCourseProgress(courseProgress);
      setTotalProgress(totalProgress);

      // Si la progression est de 100% et que l'objectif n'a pas déjà été atteint aujourd'hui
      if (totalProgress >= 100 && !isAlreadyCompleted) {
        const userRef = doc(db, 'users', userId);
        const currentCount = dailyProgress.count || 0;
        
        await updateDoc(userRef, {
          'success.dailyProgress': {
            count: currentCount + 1,
            lastUpdated: new Date()
          }
        });

        // Annuler la notification du jour car l'objectif est atteint
        await Notifications.cancelAllScheduledNotificationsAsync();
      } else if (totalProgress < 100 && !isAlreadyCompleted) {
        // Si l'objectif n'est pas atteint, s'assurer qu'une notification est planifiée
        if (userData.notificationsEnabled) {
          await scheduleDailyReminder();
        }
      }

      return totalProgress;
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de la progression:', error);
      setProgress(0);
      return 0;
    }
  };

  useEffect(() => {
    const checkProgress = async () => {
      await evaluateDailyProgress();
    };
    checkProgress();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View 
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.headerTop}>
              <View style={styles.welcomeContainer}>
                <Animated.Text 
                  style={[
                    styles.welcomeText,
                    {
                      transform: [{
                        scale: scrollY.interpolate({
                          inputRange: [-50, 0, 50],
                          outputRange: [1.1, 1, 0.9],
                          extrapolate: 'clamp',
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.welcomePrefix}>Bienvenue</Text>
                </Animated.Text>
                <Animated.Text 
                  style={[
                    styles.welcomeName,
                    {
                      transform: [{
                        translateX: scrollY.interpolate({
                          inputRange: [-50, 0, 50],
                          outputRange: [0, 0, -10],
                          extrapolate: 'clamp',
                        })
                      }]
                    }
                  ]}
                >
                  {userName}
                </Animated.Text>
                <Animated.View 
                  style={[
                    styles.divider,
                    {
                      width: scrollY.interpolate({
                        inputRange: [-50, 0, 50],
                        outputRange: ['90%', '70%', '50%'],
                        extrapolate: 'clamp',
                      }),
                      opacity: scrollY.interpolate({
                        inputRange: [-50, 0, 50],
                        outputRange: [1, 0.8, 0],
                        extrapolate: 'clamp',
                      })
                    }
                  ]}
                />
                <Animated.Text 
                  style={[
                    styles.headerSubtitle,
                    {
                      opacity: scrollY.interpolate({
                        inputRange: [-50, 0, 50],
                        outputRange: [1, 1, 0],
                        extrapolate: 'clamp',
                      })
                    }
                  ]}
                >
                  Prêt à explorer aujourd'hui ?
                </Animated.Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Proverbe du jour */}
        <Animated.View style={[
          styles.dailyExpression, 
          { 
            backgroundColor: themeColors.card,
            marginTop: Animated.add(headerHeight, 30),
            marginBottom: 30
          }
        ]}>
          <MaterialCommunityIcons 
            name="lightbulb-on" 
            size={24} 
            color={themeColors.accent} 
            style={styles.dailyExpressionIcon}
          />
          {isLoadingExpression ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={themeColors.accent} />
              <Text style={[styles.loadingText, { color: themeColors.text }]}>
                Chargement du proverbe du jour...
              </Text>
            </View>
          ) : dailyExpression ? (
            <>
              <Text style={[styles.dailyExpressionTitle, { color: themeColors.text }]}>
                {dailyExpression.title}
              </Text>
              <Text style={[styles.dailyExpressionMessage, { color: themeColors.text }]}>
                {dailyExpression.message}
              </Text>
            </>
          ) : (
            <Text style={[styles.dailyExpressionMessage, { color: themeColors.text }]}>
              Impossible de charger le proverbe du jour.
            </Text>
          )}
        </Animated.View>

        {/* Progression quotidienne */}
        <View style={[
          styles.dailyProgress, 
          { 
            backgroundColor: totalProgress >= 100 ? themeColors.secondary + '20' : themeColors.card,
            borderColor: totalProgress >= 100 ? themeColors.secondary + '40' : 'transparent',
            borderWidth: totalProgress >= 100 ? 1 : 0
          }
        ]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Votre progression quotidienne</Text>
          
          {/* Barre de progression des exercices */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: themeColors.text }]}>
                Exercices ({todayExercisesCount}/3)
              </Text>
              <Text style={[styles.progressPercentage, { color: themeColors.text }]}>
                {Math.round(exerciseProgress * 100)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${exerciseProgress * 100}%`, 
                    backgroundColor: themeColors.secondary 
                  }
                ]} 
              />
            </View>
          </View>

          {/* Barre de progression des cours */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: themeColors.text }]}>
                Cours ({todayCourses.length}/1)
              </Text>
              <Text style={[styles.progressPercentage, { color: themeColors.text }]}>
                {Math.round(courseProgress * 100)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${courseProgress * 100}%`, 
                    backgroundColor: themeColors.secondary 
                  }
                ]} 
              />
            </View>
          </View>

          {/* Indicateur de validation */}
          {totalProgress >= 100 && (
            <View style={styles.validationContainer}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={24} 
                color={themeColors.secondary} 
              />
              <Text style={[styles.validationText, { color: themeColors.secondary }]}>
                Objectif quotidien atteint !
              </Text>
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View style={[styles.quickActionsContainer, { backgroundColor: themeColors.background }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Accès rapide</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="account-group"
              title="Amis"
              description="Connectez-vous avec vos amis"
              onPress={() => router.push('/(tabs)/amis')}
              backgroundColor={themeColors.primary}
              color={themeColors.text}
            />
            <QuickAction
              icon="pencil"
              title="Exercices"
              description="Entraînez-vous"
              onPress={() => router.push('/entrainement')}
              backgroundColor={themeColors.secondary}
              color={themeColors.text}
            />
            <QuickAction
              icon="trophy"
              title="Succès"
              description="Débloquez des récompenses"
              onPress={() => router.push('/success')}
              backgroundColor={themeColors.accent}
              color={themeColors.text}
            />
            <QuickAction
              icon="chart-bar"
              title="Classement"
              description="Comparez vos résultats"
              onPress={() => router.push('/classement')}
              backgroundColor={themeColors.danger}
              color={themeColors.text}
            />
          </View>
        </View>

        {/* Statistiques */}
        <View style={[styles.statsContainer, { backgroundColor: themeColors.background }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Vos statistiques</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Cours visonnés"
              value={userStats.completedCourses}
              icon="book-check"
              color={themeColors.primary}
              colorText={themeColors.text}
            />
            <StatCard
              title="Exercices"
              value={userStats.completedExercises}
              icon="pencil"
              color={themeColors.secondary}
              colorText={themeColors.text}
            />
            <StatCard
              title="Points"
              value={userStats.totalPoints}
              icon="star"
              color={themeColors.danger}
              colorText={themeColors.text}
            />
            <StatCard
              title="Succès"
              value={userStats.achievements}
              icon="trophy"
              color={themeColors.accent}
              colorText={themeColors.text}
            />
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
  },
  welcomeText: {
    marginBottom: 8,
  },
  welcomePrefix: {
    color: '#94a3b8',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 1,
  },
  welcomeName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 28,
  },
  divider: {
    height: 2,
    backgroundColor: '#60a5fa',
    marginBottom: 6,
    borderRadius: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingBottom: 10,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  statsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  dailyProgress: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dailyExpression: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  dailyExpressionIcon: {
    marginBottom: 12,
  },
  dailyExpressionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dailyExpressionMessage: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});