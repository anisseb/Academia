import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { parseGradient } from '../utils/subjectGradients';
import React from 'react';
import { setSuccessStats } from './_layout';
import { router } from 'expo-router';

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
    const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  
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
        
        // Vérifier si l'utilisateur a un abonnement actif
        const hasSubscription = userData.abonnement?.active === true;
        setHasActiveSubscription(hasSubscription);
        
        if (!hasSubscription) {
          setIsLoading(false);
          return;
        }
        
        // Récupérer les exercices complétés depuis la collection completedExercises
        const completedExercisesMap = profile.completedExercises || {};
        const completedExercises = Object.keys(completedExercisesMap).map(id => ({
          id,
          ...completedExercisesMap[id]
        }));

        // Charger les détails de chaque exercice depuis la collection exercices
        const exercicesRef = collection(db, 'exercises');
        const exercicesDetails = await Promise.all(
          completedExercises.map(async (ex: any) => {
              try {
              const exerciceDoc = await getDoc(doc(exercicesRef, ex.exerciseId));
              if (exerciceDoc.exists()) {
                return {
                  ...ex,
                  ...exerciceDoc.data(),
                };
              } else {
                return ex; // fallback si l'exercice n'existe plus
              }
            } catch (e) {
              return ex; // fallback en cas d'erreur
            }
          })
        );

        // Récupérer les informations des matières depuis la collection subjects
        const subjectsRef = collection(db, 'subjects');
        const subjectsSnapshot = await getDocs(subjectsRef);
        const subjectsData = subjectsSnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = { id: doc.id, ...doc.data() };
          return acc;
        }, {} as Record<string, any>);
        
        // Regrouper les exercices par matière (subjectId)
        const exercisesBySubject: Record<string, any[]> = {};
        exercicesDetails.forEach((exercise: any) => {
          const subjectId = exercise.subjectId;
          if (!subjectId) return; // ignorer si pas de matière
          if (!exercisesBySubject[subjectId]) {
            exercisesBySubject[subjectId] = [];
          }
          exercisesBySubject[subjectId].push(exercise);
        });
        
        // Calculer les statistiques pour chaque matière
        const newStats: Record<string, SubjectStats> = {};

        Object.entries(exercisesBySubject).forEach(([subjectId, subjectExercises]) => {
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
          newStats[subjectId] = {
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
        setSubjectInfos(subjectsData);
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
  
    const loadSubjectInfos = async () => {
      setIsLoadingSubjects(false);
    };
  
    const renderSubjectStats = (subject: string, stats: SubjectStats) => {
      const subjectInfo = subjectInfos[subject];
      if (!subjectInfo) return null;
      
      const gradientColors = parseGradient(subjectInfo.gradient);
      const primaryColor = gradientColors[0];
      
      return (
        <View key={subject} style={[styles.statsCard, { 
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }]}>
          <View style={styles.subjectHeader}>
            <MaterialCommunityIcons 
              name={subjectInfo.icon || 'book-open-variant'} 
              size={28} 
              color={primaryColor} 
            />
            <Text style={[styles.subjectTitle, { 
              color: themeColors.text,
              fontSize: 24,
              fontWeight: '700',
              letterSpacing: 0.5,
            }]}>
              {subjectInfo.label}
            </Text>
          </View>
          
          <View style={[styles.mainStatCard, { 
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }]}>
            <View style={styles.scoreContainer}>
              <Ionicons name="trophy" size={32} color="#FFD700" style={styles.trophyIcon} />
              <Text style={[styles.scoreText, { 
                color: themeColors.text,
                fontSize: 48,
                fontWeight: '800',
              }]}>
                {stats.averageScore}%
              </Text>
              <Text style={[styles.scoreLabel, { 
                color: themeColors.text,
                opacity: 0.8,
                fontSize: 16,
                letterSpacing: 1,
              }]}>
                Score moyen
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { 
              backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.statIcon} />
              <Text style={[styles.statValue, { 
                color: themeColors.text,
                fontSize: 28,
                fontWeight: '700',
              }]}>{stats.completedExercises}</Text>
              <Text style={[styles.statLabel, { 
                color: themeColors.text,
                opacity: 0.8,
                fontSize: 14,
                letterSpacing: 0.5,
              }]}>Quiz terminés</Text>
            </View>

            <View style={[styles.statItem, { 
              backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }]}>
              <Ionicons name="time" size={24} color="#3B82F6" style={styles.statIcon} />
              <Text style={[styles.statValue, { 
                color: themeColors.text,
                fontSize: 28,
                fontWeight: '700',
              }]}>{stats.consecutiveDays}</Text>
              <Text style={[styles.statLabel, { 
                color: themeColors.text,
                opacity: 0.8,
                fontSize: 14,
                letterSpacing: 0.5,
              }]}>Jours consécutifs</Text>
            </View>

            <View style={[styles.statItem, { 
              backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }]}>
              <Ionicons name="checkmark" size={24} color="#10B981" style={styles.statIcon} />
              <Text style={[styles.statValue, { 
                color: themeColors.text,
                fontSize: 28,
                fontWeight: '700',
              }]}>{stats.correctAnswers}</Text>
              <Text style={[styles.statLabel, { 
                color: themeColors.text,
                opacity: 0.8,
                fontSize: 14,
                letterSpacing: 0.5,
              }]}>Réponses correctes</Text>
            </View>

            <View style={[styles.statItem, { 
              backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }]}>
              <Ionicons name="close" size={24} color="#EF4444" style={styles.statIcon} />
              <Text style={[styles.statValue, { 
                color: themeColors.text,
                fontSize: 28,
                fontWeight: '700',
              }]}>{stats.incorrectAnswers}</Text>
              <Text style={[styles.statLabel, { 
                color: themeColors.text,
                opacity: 0.8,
                fontSize: 14,
                letterSpacing: 0.5,
              }]}>Réponses incorrectes</Text>
            </View>
          </View>

          <View style={[styles.precisionContainer, {
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }]}>
            <View style={styles.precisionBar}>
              <View style={[styles.precisionFill, { 
                width: `${stats.precision}%`,
                backgroundColor: primaryColor,
                shadowColor: primaryColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
              }]} />
              <Text style={[styles.precisionText, {
                fontSize: 14,
                fontWeight: '600',
                letterSpacing: 0.5,
              }]}>{stats.precision}% de précision</Text>
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
      {!hasActiveSubscription ? (
        <View style={styles.subscriptionContainer}>
          <MaterialCommunityIcons 
            name="star-circle" 
            size={64} 
            color="#FFD700" 
            style={styles.subscriptionIcon}
          />
          <Text style={[styles.subscriptionTitle, { color: themeColors.text }]}>
            Débloquez des statistiques détaillées
          </Text>
          <Text style={[styles.subscriptionDescription, { color: themeColors.text }]}>
            Accédez à des statistiques détaillées et suivez votre progression avec Academia Réussite
          </Text>
          <TouchableOpacity 
            style={styles.subscriptionButton}
            onPress={() => router.push('/settings/subscriptions')}
          >
            <Text style={styles.subscriptionButtonText}>Voir les abonnements</Text>
          </TouchableOpacity>
        </View>
      ) : Object.keys(stats).length === 0 ? (
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
      borderRadius: 24,
      padding: 24,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    mainStatCard: {
      alignItems: 'center',
      marginBottom: 24,
      padding: 24,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    scoreContainer: {
      alignItems: 'center',
    },
    trophyIcon: {
      marginBottom: 8,
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 24,
    },
    statItem: {
      width: '47%',
      alignItems: 'center',
      padding: 20,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    statIcon: {
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
    },
    statLabel: {
      fontSize: 14,
      textAlign: 'center',
      opacity: 0.8,
    },
    precisionContainer: {
      padding: 20,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    precisionBar: {
      height: 32,
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
    },
    precisionFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      borderRadius: 16,
    },
    precisionText: {
      position: 'absolute',
      width: '100%',
      textAlign: 'center',
      lineHeight: 30,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subjectHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      gap: 12,
    },
    subjectTitle: {
      fontSize: 24,
      fontWeight: '700',
    },
    scoreText: {
      fontSize: 48,
      fontWeight: '800',
    },
    scoreLabel: {
      fontSize: 16,
      opacity: 0.8,
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
    subscriptionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      marginTop: 40,
    },
    subscriptionIcon: {
      marginBottom: 24,
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
    },
    subscriptionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 12,
    },
    subscriptionDescription: {
      fontSize: 16,
      textAlign: 'center',
      opacity: 0.8,
      marginBottom: 32,
      lineHeight: 24,
    },
    subscriptionButton: {
      backgroundColor: '#FFD700',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    subscriptionButtonText: {
      color: '#1e293b',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });