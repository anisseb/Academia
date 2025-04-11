import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SubjectStats {
  averageScore: number;
  completedExercises: number;
  consecutiveDays: number;
  correctAnswers: number;
  incorrectAnswers: number;
  precision: number;
}

export default function HomeScreen() {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState<Record<string, SubjectStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [subjectInfos, setSubjectInfos] = useState<Record<string, any>>({});

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    primary: '#60a5fa',
  };

  useEffect(() => {
    loadUserStats();
  }, []);

  useEffect(() => {
    loadSubjectInfos();
  }, [stats]);

  const loadUserStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const profile = userData.profile || {};
      setProfileData(profile);
      const completedExercises = profile.exercises || [];
      
      // Regrouper les exercices par matière
      const exercisesBySubject: Record<string, any[]> = {};
      
      completedExercises.forEach((exercise: any) => {
        const subject = exercise.subject;
        if (!exercisesBySubject[subject]) {
          exercisesBySubject[subject] = [];
        }
        exercisesBySubject[subject].push(exercise);
      });
      
      // Calculer les statistiques pour chaque matière
      Object.entries(exercisesBySubject).forEach(([subject, subjectExercises]) => {
        // Calculer les statistiques pour cette matière
        const totalExercises = subjectExercises.length;
        const validExercises = subjectExercises.filter(ex => ex.score !== undefined && ex.score !== null);
        
        const totalScore = validExercises.reduce((sum, ex) => {
          return sum + (ex.score || 0);
        }, 0);
        
        const averageScore = validExercises.length > 0 ? totalScore / validExercises.length : 0;
        
        // Calculer les jours consécutifs
        const dates = subjectExercises
          .map(ex => new Date(ex.completedAt).toDateString())
          .sort()
          .filter((date, index, array) => array.indexOf(date) === index);
        
        // Calculer les réponses correctes/incorrectes basées sur le score
        const correctAnswers = validExercises.reduce((sum, ex) => {
          return sum + Math.round(((ex.score || 0) / 100) * 10);
        }, 0);
        
        const incorrectAnswers = validExercises.reduce((sum, ex) => {
          return sum + (10 - Math.round(((ex.score || 0) / 100) * 10));
        }, 0);
        
        const subjectStats: Record<string, SubjectStats> = {};
        subjectStats[subject] = {
          averageScore: Math.round(averageScore),
          completedExercises: totalExercises,
          consecutiveDays: calculateConsecutiveDays(dates),
          correctAnswers,
          incorrectAnswers,
          precision: correctAnswers + incorrectAnswers > 0 
            ? Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 100) 
            : 0
        };
        
        // Mettre à jour les statistiques globales
        stats[subject] = subjectStats[subject];
      });

      setStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateConsecutiveDays = (dates: string[]) => {
    // Logique pour calculer les jours consécutifs
    // À implémenter selon vos besoins
    return dates.length;
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
    const newSubjectInfos: Record<string, any> = {};
    for (const subject of Object.keys(stats)) {
      const info = await getSubjectInfo(subject);
      if (info) {
        newSubjectInfos[subject] = info;
      }
    }
    setSubjectInfos(newSubjectInfos);
  };

  const extractGradientColors = (gradientString: string): string[] => {
    if (!gradientString) return ['#60a5fa', '#3b82f6'];
    
    // Extraire les couleurs du format "linear-gradient(to right, #4c1d95, #2563eb)"
    const colorMatch = gradientString.match(/#[0-9a-fA-F]{6}/g);
    if (colorMatch && colorMatch.length >= 2) {
      return [colorMatch[0], colorMatch[1]];
    }
    
    return ['#60a5fa', '#3b82f6'];
  };

  const renderSubjectStats = (subject: string, stats: SubjectStats) => {
    const subjectInfo = subjectInfos[subject];
    if (!subjectInfo) return null;
    
    const gradientColors = extractGradientColors(subjectInfo.gradient);
    const primaryColor = gradientColors[0];
    const secondaryColor = gradientColors[1];
    const cardsColors = 'rgba(13, 103, 172, 0.56)';

    return (
      <View key={subject} style={[styles.statsCard, { backgroundColor: 'rgba(234, 232, 232, 0.78)' }]}>
        <View style={styles.subjectHeader}>
          <MaterialCommunityIcons 
            name={subjectInfo.icon || 'book-open-variant'} 
            size={24} 
            color={primaryColor} 
          />
          <Text style={[styles.subjectTitle, { color: themeColors.text }]}>
            {subjectInfo.label}
          </Text>
        </View>
        
        <View style={[styles.mainStatCard, { backgroundColor: cardsColors }]}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={[styles.scoreText, { color: themeColors.text }]}>
            {stats.averageScore}%
          </Text>
          <Text style={styles.scoreLabel}>Score moyen</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: cardsColors }]}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.completedExercises}</Text>
            <Text style={styles.statLabel}>Quiz terminés</Text>
          </View>

          <View style={[styles.statItem, { backgroundColor: cardsColors }]}>
            <Ionicons name="time" size={20} color="#2196F3" />
            <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.consecutiveDays}</Text>
            <Text style={styles.statLabel}>Jours consécutifs</Text>
          </View>

          <View style={[styles.statItem, { backgroundColor: cardsColors }]}>
            <Ionicons name="checkmark" size={20} color="#4CAF50" />
            <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.correctAnswers}</Text>
            <Text style={styles.statLabel}>Réponses correctes</Text>
          </View>

          <View style={[styles.statItem, { backgroundColor: cardsColors }]}>
            <Ionicons name="close" size={20} color="#F44336" />
            <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.incorrectAnswers}</Text>
            <Text style={styles.statLabel}>Réponses incorrectes</Text>
          </View>
        </View>

        <View style={[styles.precisionContainer]}>
          <View style={styles.precisionBar}>
            <View style={[styles.precisionFill, { 
              width: `${stats.precision}%`,
              backgroundColor: primaryColor
            }]} />
            <Text style={styles.precisionText}>{stats.precision}% de précision</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >      
      {Object.keys(stats).length === 0 ? (
        <View style={styles.emptyStatsContainer}>
          <MaterialCommunityIcons 
            name="chart-line" 
            size={48} 
            color={themeColors.text} 
            style={styles.emptyStatsIcon}
          />
          <Text style={[styles.emptyStatsText, { color: themeColors.text }]}>
            Vous n'avez pas encore de statistiques
          </Text>
          <Text style={[styles.emptyStatsSubtext, { color: themeColors.text }]}>
            Commencez votre entraînement pour voir votre progression
          </Text>
        </View>
      ) : (
        <View>
          <Text style={[styles.title, { color: themeColors.text }]}>Vos statistiques</Text>
          <Text style={[styles.subtitle, { color: themeColors.text }]}>
            Suivez votre progression et améliorez vos compétences
          </Text>
          {Object.entries(stats).map(([subject, subjectStats]) => 
          renderSubjectStats(subject, subjectStats)
        )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 16,
  },
  importButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  features: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  mathTestContainer: {
    marginBottom: 20,
  },
  mathLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  featureNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureNumberText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
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
  mainStatCard: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },
  precisionContainer: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 16,
  },
  precisionBar: {
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  precisionFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  precisionText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 20,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
});