import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
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
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';

interface SubjectStats {
  averageScore: number;
  completedExercises: number;
  consecutiveDays: number;
  correctAnswers: number;
  incorrectAnswers: number;
  precision: number;
  progressionData?: {
    labels: string[];
    datasets: {
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }[];
  };
}

export default function StatistiquesScreen() {
    const { isDarkMode } = useTheme();
    const [stats, setStats] = useState<Record<string, SubjectStats>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);
    const [subjectInfos, setSubjectInfos] = useState<Record<string, any>>({});
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [userSubjects, setUserSubjects] = useState<any[]>([]);
    const [isLoadingUserSubjects, setIsLoadingUserSubjects] = useState(false);
  
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
      loadUserSubjects();
    }, [profileData]);

    useEffect(() => {
      loadSubjectInfos();
    }, [stats]);


  
    const loadUserSubjects = async () => {
      if (!profileData?.class) return;
      
      setIsLoadingUserSubjects(true);
      try {
        // Récupérer toutes les matières de la classe de l'utilisateur
        const subjectsRef = collection(db, 'subjects');
        const subjectsQuery = query(subjectsRef, where('classeId', '==', profileData.class));
        const subjectsSnapshot = await getDocs(subjectsQuery);
        
        const subjects = subjectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUserSubjects(subjects);
      } catch (error) {
        console.error('Erreur lors du chargement des matières:', error);
      } finally {
        setIsLoadingUserSubjects(false);
      }
    };

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

          // Générer les données de progression par difficulté
          const progressionData = generateProgressionData(subjectExercises);

          newStats[subjectId] = {
            averageScore: Math.round(averageScore),
            completedExercises: totalExercises,
            consecutiveDays: calculateConsecutiveDays(dates),
            correctAnswers,
            incorrectAnswers,
            precision: correctAnswers + incorrectAnswers > 0 
              ? Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 100) 
              : 0,
            progressionData
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

    const generateProgressionData = (exercises: any[]) => {
      if (exercises.length === 0) return undefined;

      // Trier les exercices par date de completion et filtrer les données valides
      const sortedExercises = exercises
        .filter(ex => ex.completedAt && ex.score !== undefined && ex.score !== null && !isNaN(ex.score))
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

      if (sortedExercises.length === 0) return undefined;

      // Utiliser tous les exercices pour la progression
      const allExercises = sortedExercises;
      
      // Créer les labels (numéros d'exercices)
      const labels = allExercises.map((_, index) => `Ex ${index + 1}`);

      // Données pour les scores uniquement
      const scoreData = allExercises.map(ex => {
        const score = parseFloat(ex.score);
        return isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
      });

      // Vérifier que les données sont valides
      const allDataValid = scoreData.every(score => !isNaN(score));

      if (!allDataValid) {
        console.warn('Données de progression invalides détectées:', { scoreData });
        return undefined;
      }

      return {
        labels,
        datasets: [
          {
            data: scoreData,
            color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`, // Bleu pour les scores
            strokeWidth: 3,
          },
        ],
      };
    };
  
    const loadSubjectInfos = async () => {
      setIsLoadingSubjects(false);
    };

    const generateGlobalStats = () => {
      if (Object.keys(stats).length === 0) return null;

      // Statistiques globales
      const totalExercises = Object.values(stats).reduce((sum, subject) => sum + subject.completedExercises, 0);
      const averageScore = Object.values(stats).reduce((sum, subject) => sum + subject.averageScore, 0) / Object.keys(stats).length;
      const totalCorrectAnswers = Object.values(stats).reduce((sum, subject) => sum + subject.correctAnswers, 0);
      const totalIncorrectAnswers = Object.values(stats).reduce((sum, subject) => sum + subject.incorrectAnswers, 0);
      const totalPrecision = totalCorrectAnswers + totalIncorrectAnswers > 0 
        ? Math.round((totalCorrectAnswers / (totalCorrectAnswers + totalIncorrectAnswers)) * 100) 
        : 0;

      // Répartition par matière (pour le camembert)
      const subjectDistribution = Object.entries(stats).map(([subjectId, subjectStats]) => {
        const subjectInfo = subjectInfos[subjectId];
        const gradientColors = parseGradient(subjectInfo?.gradient || 'rgba(128, 128, 128, 1)');
        return {
          name: subjectInfo?.label || 'Inconnue',
          exercises: subjectStats.completedExercises,
          color: gradientColors[0],
          legendFontColor: isDarkMode ? '#FFFFFF' : '#000000',
          legendFontSize: 12,
        };
      });

      // Toutes les matières par score moyen
      const topSubjects = Object.entries(stats)
        .map(([subjectId, subjectStats]) => ({
          subjectId,
          name: subjectInfos[subjectId]?.label || 'Inconnue',
          averageScore: subjectStats.averageScore,
          color: parseGradient(subjectInfos[subjectId]?.gradient || 'rgba(128, 128, 128, 1)')[0]
        }))
        .sort((a, b) => b.averageScore - a.averageScore);

      return {
        totalExercises,
        averageScore: Math.round(averageScore),
        totalCorrectAnswers,
        totalIncorrectAnswers,
        totalPrecision,
        subjectDistribution,
        topSubjects
      };
    };

    const getFilteredStats = () => {
      if (selectedSubject === 'all') {
        return stats;
      }
      return stats[selectedSubject] ? { [selectedSubject]: stats[selectedSubject] } : {};
    };



    const renderSubjectSelector = () => {
      if (isLoadingUserSubjects || userSubjects.length === 0) {
        return null;
      }

      return (
        <View style={[styles.selectorContainer, {
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }]}>
          <Text style={[styles.selectorTitle, { color: themeColors.text }]}>
            Filtrer par matière
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.subjectOption,
                selectedSubject === 'all' && styles.selectedSubjectOption,
                { 
                  backgroundColor: selectedSubject === 'all' 
                    ? themeColors.primary 
                    : isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }
              ]}
              onPress={() => setSelectedSubject('all')}
            >
              <MaterialCommunityIcons 
                name="view-list" 
                size={20} 
                color={selectedSubject === 'all' ? '#ffffff' : themeColors.text} 
              />
              <Text style={[
                styles.subjectOptionText,
                { 
                  color: selectedSubject === 'all' ? '#ffffff' : themeColors.text,
                  fontWeight: selectedSubject === 'all' ? '600' : '400',
                }
              ]}>
                Toutes les matières
              </Text>
            </TouchableOpacity>

            {userSubjects.map((subject) => {
              const gradientColors = parseGradient(subject.gradient);
              const primaryColor = gradientColors[0];
              const isSelected = selectedSubject === subject.id;
              
              return (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectOption,
                    isSelected && styles.selectedSubjectOption,
                    { 
                      backgroundColor: isSelected 
                        ? primaryColor 
                        : isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }
                  ]}
                  onPress={() => setSelectedSubject(subject.id)}
                >
                  <MaterialCommunityIcons 
                    name={subject.icon || 'book-open-variant'} 
                    size={20} 
                    color={isSelected ? '#ffffff' : primaryColor} 
                  />
                  <Text style={[
                    styles.subjectOptionText,
                    { 
                      color: isSelected ? '#ffffff' : themeColors.text,
                      fontWeight: isSelected ? '600' : '400',
                    }
                  ]}>
                    {subject.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
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

          {stats.progressionData && stats.progressionData.labels.length > 1 && (
            <View style={[styles.chartContainer, {
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }]}>
              <Text style={[styles.chartTitle, { color: themeColors.text }]}>
                Progression des scores
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chartScrollContent}
              >
                <LineChart
                  data={stats.progressionData}
                  width={Math.max(Dimensions.get('window').width - 120, stats.progressionData.labels.length * 60)}
                  height={220}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                  },
                }}
                bezier
                style={styles.chart}
                withDots={true}
                withShadow={false}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={true}
                                  yAxisSuffix="%"
                  yAxisInterval={1}
                />
              </ScrollView>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgba(96, 165, 250, 1)' }]} />
                  <Text style={[styles.legendText, { color: themeColors.text }]}>Score (%)</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      );
    };

    const filteredStats = getFilteredStats();

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
          
          {renderSubjectSelector()}
          
          {selectedSubject === 'all' && (() => {
            const globalStats = generateGlobalStats();
            if (!globalStats) return null;
            return (
              <View style={[styles.statsCard, {
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }]}>
                <Text style={[styles.chartTitle, { color: isDarkMode ? 'white' : 'black' }]}>
                  Vue d'ensemble globale
                </Text>
                {/* Statistiques numériques */}
                <View style={styles.globalStatsGrid}>
                  <View style={styles.globalStatItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <Text style={[styles.globalStatValue, { color: isDarkMode ? 'white' : 'black' }]}>{globalStats.totalExercises}</Text>
                    <Text style={[styles.globalStatLabel, { color: isDarkMode ? 'white' : 'black' }]}>Total exercices</Text>
                  </View>
                  <View style={styles.globalStatItem}>
                    <Ionicons name="trophy" size={24} color="#FFD700" />
                    <Text style={[styles.globalStatValue, { color: isDarkMode ? 'white' : 'black' }]}>{globalStats.averageScore}%</Text>
                    <Text style={[styles.globalStatLabel, { color: isDarkMode ? 'white' : 'black' }]}>Score moyen</Text>
                  </View>
                  <View style={styles.globalStatItem}>
                    <Ionicons name="analytics" size={24} color="#3B82F6" />
                    <Text style={[styles.globalStatValue, { color: isDarkMode ? 'white' : 'black' }]}>{globalStats.totalPrecision}%</Text>
                    <Text style={[styles.globalStatLabel, { color: isDarkMode ? 'white' : 'black' }]}>Précision globale</Text>
                  </View>
                </View>
                {/* Camembert */}
                {globalStats.subjectDistribution.length > 0 && (
                  <View style={styles.pieChartContainer}>
                    <Text style={[styles.chartSubtitle, { color: isDarkMode ? 'white' : 'black' }]}>Répartition par matière</Text>
                    <PieChart
                      data={globalStats.subjectDistribution}
                      width={Dimensions.get('window').width - 80}
                      height={200}
                      chartConfig={{ color: (opacity = 1) => `rgba(255,255,255,${opacity})` }}
                      accessor="exercises"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                    />
                  </View>
                )}
                {/* Scores par matière */}
                {globalStats.topSubjects.length > 0 && (
                  <View style={styles.topSubjectsContainer}>
                    <Text style={[styles.chartSubtitle, { color: isDarkMode ? 'white' : 'black' }]}>Scores par matière</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 20 }}
                    >
                      <BarChart
                        data={{
                          labels: globalStats.topSubjects.map(s => s.name),
                          datasets: [{ data: globalStats.topSubjects.map(s => s.averageScore) }]
                        }}
                        width={Math.max(Dimensions.get('window').width - 80, globalStats.topSubjects.length * 80)}
                        height={180}
                        yAxisLabel=""
                        chartConfig={{
                          backgroundColor: 'transparent',
                          backgroundGradientFrom: 'transparent',
                          backgroundGradientTo: 'transparent',
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                          labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                          style: { borderRadius: 16 },
                          propsForLabels: { fontSize: 10 },
                        }}
                        style={styles.chart}
                        fromZero
                        yAxisSuffix="%"
                      />
                    </ScrollView>
                  </View>
                )}
              </View>
            );
          })()}
          
          {isLoadingSubjects ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: themeColors.text }]}>
                Chargement des statistiques...
              </Text>
            </View>
          ) : (
            <>
                             {Object.keys(filteredStats).length === 0 ? (
                 <View style={styles.emptyFilterContainer}>
                   <MaterialCommunityIcons 
                     name="filter-off" 
                     size={48} 
                     color={themeColors.text} 
                     style={styles.emptyFilterIcon}
                   />
                   <Text style={[styles.emptyFilterText, { color: themeColors.text }]}>
                     Aucune statistiques pour cette matiere
                   </Text>
                   <Text style={[styles.emptyFilterSubtext, { color: themeColors.text }]}>
                     Commencez des exercices dans cette matière pour voir vos statistiques
                   </Text>
                 </View>
               ) : (
                Object.entries(filteredStats).map(([subject, subjectStats]) => 
                  renderSubjectStats(subject, subjectStats)
                )
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
    selectorContainer: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    selectorTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
    },
    selectorScrollContent: {
      paddingHorizontal: 4,
      gap: 12,
    },
    subjectOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    selectedSubjectOption: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    subjectOptionText: {
      fontSize: 14,
      fontWeight: '500',
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
    emptyFilterContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      marginTop: 40,
    },
    emptyFilterIcon: {
      marginBottom: 16,
      opacity: 0.5,
    },
    emptyFilterText: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyFilterSubtext: {
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
    chartContainer: {
      padding: 20,
      borderRadius: 20,
      marginTop: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 16,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
      flexWrap: 'wrap',
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: 12,
      fontWeight: '500',
    },
    chartScrollContent: {
      paddingHorizontal: 8,
    },
    subjectLegend: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    legendTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
    },
    subjectLegendGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
    },
    subjectLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minWidth: '45%',
    },
    subjectChartContainer: {
      marginRight: 16,
      alignItems: 'center',
    },
    subjectChartTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
    },
    globalStatsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 12,
    },
    globalStatItem: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
    },
    globalStatValue: {
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 8,
    },
    globalStatLabel: {
      fontSize: 12,
      opacity: 0.8,
      textAlign: 'center',
      marginTop: 4,
    },
    pieChartContainer: {
      marginBottom: 24,
      alignItems: 'center',
    },
    topSubjectsContainer: {
      marginBottom: 16,
    },
    chartSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
    },
  });