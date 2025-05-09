import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { parseGradient } from '../utils/subjectGradients';
import React from 'react';
import { setSuccessStats } from './_layout';

interface SubjectStats {
  averageScore: number;
  completedExercises: number;
  consecutiveDays: number;
  correctAnswers: number;
  incorrectAnswers: number;
  precision: number;
}

export default function StatistiquesScreen() {
    const { isDarkMode } = useTheme();
    const [stats, setStats] = useState<Record<string, SubjectStats>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);
    const [subjectInfos, setSubjectInfos] = useState<Record<string, any>>({});
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  
    const themeColors = {
      background: isDarkMode ? '#1a1a1a' : '#ffffff',
      text: isDarkMode ? '#ffffff' : '#000000',
      card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
      primary: '#60a5fa',
    };
    
    useEffect(() => {
      loadUserStats();
      setSuccessStats();
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
        
        // Récupérer tous les exercices complétés de la nouvelle structure
        const exercises = profile.exercises || {};
        const completedExercises: any[] = [];
  
        // Parcourir la structure imbriquée pour extraire tous les exercices
        Object.entries(exercises).forEach(([schoolType, schoolTypeData]) => {
          if (typeof schoolTypeData === 'object' && schoolTypeData !== null) {
            Object.entries(schoolTypeData).forEach(([classe, classeData]) => {
              if (typeof classeData === 'object' && classeData !== null) {
                Object.entries(classeData).forEach(([subject, subjectData]) => {
                  if (typeof subjectData === 'object' && subjectData !== null) {
                    Object.entries(subjectData).forEach(([chapterId, chapterData]) => {
                      if (typeof chapterData === 'object' && chapterData !== null) {
                        Object.entries(chapterData).forEach(([contentId, contentExercises]) => {
                          if (Array.isArray(contentExercises)) {
                            contentExercises.forEach((exercise: any) => {
                              completedExercises.push({
                                ...exercise,
                                subject,
                                chapterId,
                                contentId
                              });
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
        
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
        const newStats: Record<string, SubjectStats> = {};
        
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
          
          newStats[subject] = {
            averageScore: Math.round(averageScore),
            completedExercises: totalExercises,
            consecutiveDays: calculateConsecutiveDays(dates),
            correctAnswers,
            incorrectAnswers,
            precision: correctAnswers + incorrectAnswers > 0 
              ? Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 100) 
              : 0
          };
        });
  
        setStats(newStats);
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    const calculateConsecutiveDays = (dates: string[]) => {
      if (dates.length === 0) return 0;
      
      let consecutiveDays = 1;
      let currentDate = new Date(dates[0]);
      
      for (let i = 1; i < dates.length; i++) {
        const nextDate = new Date(dates[i]);
        const diffTime = Math.abs(currentDate.getTime() - nextDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          consecutiveDays++;
          currentDate = nextDate;
        } else {
          break;
        }
      }
      
      return consecutiveDays;
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
  
    const renderSubjectStats = (subject: string, stats: SubjectStats) => {
      const subjectInfo = subjectInfos[subject];
      if (!subjectInfo) return null;
      
      const cardsColors = 'rgba(13, 103, 172, 0.56)';
  
      return (
        <View key={subject} style={[styles.statsCard, { backgroundColor: 'rgba(234, 232, 232, 0.78)' }]}>
          <View style={styles.subjectHeader}>
            <MaterialCommunityIcons 
              name={subjectInfo.icon || 'book-open-variant'} 
              size={24} 
              color={parseGradient(subjectInfo.gradient)[0]} 
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
                backgroundColor: parseGradient(subjectInfo.gradient)[0]
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
          {isLoadingSubjects ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: themeColors.text }]}>
                Chargement des statistiques...
              </Text>
            </View>
          ) : (
            <>
              {Object.entries(stats).map(([subject, subjectStats]) => 
                renderSubjectStats(subject, subjectStats)
              )}
            </>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });