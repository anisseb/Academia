import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { generateDailyExpression } from '../services/generateDailyExpression';
import React from 'react';
import { getClasseName, getSchoolTypeName } from '../utils/getLabelFromData';

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
  const [dailyExpression, setDailyExpression] = useState<{ title: string; message: string } | null>(null);
  const [isLoadingExpression, setIsLoadingExpression] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

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
    outputRange: [100, 0],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadUserStats();
    loadUserName();
    loadDailyExpression();
  }, []);

  useEffect(() => {
    loadSubjectInfos();
  }, [stats]);

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
      
      completedCourses = Object.keys(cours).length;
      completedAchievements = achievements.length;

      if (profile.exercises) {
        Object.values(profile.exercises).forEach((schoolType: any) => {
          Object.values(schoolType || {}).forEach((classData: any) => {
            Object.values(classData || {}).forEach((subject: any) => {
              Object.values(subject || {}).forEach((theme: any) => {
                Object.values(theme || {}).forEach((chapter: any) => {
                  if (Array.isArray(chapter)) {
                    chapter.forEach((exercise: unknown) => {
                      const exerciseData = exercise as ExerciseData;
                      if (exerciseData.done) {
                        totalScore += exerciseData.score || 0;
                        countExercises++;
                      }
                    });
                  }
                });
              });
            });
          });
        });
      }

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

  const getSubjectInfo = async (subjectId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      const profile = userData.profile || {};
      const schoolType = profile.schoolType;
      const classe = profile.class;

      if (!schoolType || !classe) return null;

      const academiaDoc = await getDoc(doc(db, 'academia', schoolType));
      if (!academiaDoc.exists()) return null;

      const academiaData = academiaDoc.data();
      
      if (academiaData.classes && 
          academiaData.classes[classe] && 
          academiaData.classes[classe].matieres && 
          academiaData.classes[classe].matieres[subjectId]) {
        return academiaData.classes[classe].matieres[subjectId];
      }

    } catch (error) {
      console.error('Erreur lors de la récupération des informations de la matière:', error);
      return null;
    }
  };

  const loadSubjectInfos = async () => {
    try {
      setIsLoadingSubjects(true);
      const newSubjectInfos: Record<string, any> = {};
      for (const subject of Object.keys(stats)) {
        const info = await getSubjectInfo(subject);
        if (info) {
          newSubjectInfos[subject] = info;
        }
      }
      setSubjectInfos(newSubjectInfos);
    } catch (error) {
      console.error('Erreur lors du chargement des infos des matières:', error);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const loadDailyExpression = async () => {
    try {
      setIsLoadingExpression(true);
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const profile = userData.profile || {};
      const schoolType = profile.schoolType;
      const level = profile.class;

      if (!schoolType || !level) return;

      const expression = await generateDailyExpression(await getSchoolTypeName(schoolType), await getClasseName(schoolType, level));
      setDailyExpression(expression);
    } catch (error) {
      console.error('Erreur lors du chargement du proverbe:', error);
    } finally {
      setIsLoadingExpression(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#60a5fa', '#3b82f6']}
          style={styles.headerGradient}
        >
          <Animated.View style={{ opacity: headerOpacity }}>
            <Text style={styles.welcomeText}>Bienvenue {userName} !</Text>
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
        <View style={[styles.dailyExpression, { backgroundColor: themeColors.card }]}>
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
        </View>

        {/* Actions rapides */}
        <View style={[styles.quickActionsContainer, { backgroundColor: themeColors.background }]}>
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

        {/* Progression quotidienne */}
        <View style={[styles.dailyProgress, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Votre progression quotidienne</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '75%', backgroundColor: themeColors.primary }]} />
          </View>
          <Text style={[styles.progressText, { color: themeColors.text }]}>75% de votre objectif quotidien atteint</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 24,
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
    elevation: 4,
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
    marginBottom: 24,
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
    elevation: 4,
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
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginVertical: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  scoreLabel: {
    fontSize: 16,
    opacity: 0.7,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  emptyStatsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStatsIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyStatsText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStatsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  dailyExpression: {
    marginHorizontal: 20,
    marginTop: 140,
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
});