import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { 
  Achievement, 
  AFFILIATION_ACHIEVEMENTS, 
  COURSE_PROGRESSION_ACHIEVEMENTS, 
  EXERCISE_ACHIEVEMENTS, 
  IA_ACHIEVEMENTS,
  SPECIAL_BADGES_ACHIEVEMENTS
} from '../constants/achievements';
import { checkFirstCourse } from '../success/cours/firstCourse';
import { checkScholar } from '../success/cours/scholar';
import { checkDailyExpert } from '../success/cours/dailyExpert';
import { checkFirstQuiz } from '../success/exercices/firstQuiz';
import { checkPerfectionist } from '../success/exercices/perfectionist';
import { checkPerfectSeries } from '../success/exercices/perfectSeries';
import { checkLevelExplorer } from '../success/exercices/levelExplorer';
import { checkScientificRigor } from '../success/exercices/scientificRigor';
import { checkCurious } from '../success/IA/curious';
import { checkAllProfessors } from '../success/IA/allProfessors';
import { checkScannerGenius } from '../success/IA/scannerGenius';
import { checkScannerDocuments } from '../success/IA/scannerDocuments';
import { checkHomeworkHelper } from '../success/IA/homeworkHelper';
import { checkAllTerrain } from '../success/badges/allTerrain';
import { checkPerseverant } from '../success/badges/perseverant';
import { checkAnalyst } from '../success/badges/analyst';
import { checkSharer } from '../success/badges/sharer';
import { checkSuggester } from '../success/badges/suggester';
import { checkSatisfaction } from '../success/badges/satisfaction';
import { checkDailyQuestMaster } from '../success/badges/dailyQuestMaster';
import { checkFirstAffiliation } from '../success/affiliation/firstAffiliation';
import { checkAffiliationNetworker } from '../success/affiliation/affiliationNetworker';
import { checkAffiliationExpert } from '../success/affiliation/affiliationExpert';
import { checkAffiliationMaster } from '../success/affiliation/affiliationMaster';

import { auth, db } from '../../firebaseConfig';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_ACHIEVEMENTS_KEY = '@offline_achievements';
const OFFLINE_USER_KEY = '@offline_user';

export default function SuccessScreen() {
  const { isDarkMode } = useTheme();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected;
      const user = auth.currentUser;

      // Charger les succès depuis AsyncStorage immédiatement
        const savedAchievements = await AsyncStorage.getItem(OFFLINE_ACHIEVEMENTS_KEY);
        if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      }

      // Si hors ligne, on garde les données du cache
      if (!isOnline) {
        setLoading(false);
        return;
      }

      // Charger les succès par catégorie
      const categories = [
        { name: 'Progression des cours', achievements: COURSE_PROGRESSION_ACHIEVEMENTS },
        { name: 'Exercices', achievements: EXERCISE_ACHIEVEMENTS },
        { name: 'IA', achievements: IA_ACHIEVEMENTS },
        { name: 'Badges spéciaux', achievements: SPECIAL_BADGES_ACHIEVEMENTS },
        { name: 'Affiliation', achievements: AFFILIATION_ACHIEVEMENTS }
      ];

      const newAchievements: Achievement[] = [];
      const completedAchievements: string[] = [];

      for (const category of categories) {
        setLoadingCategory(category.name);
        for (const achievement of category.achievements) {
        const progress = await checkAchievementProgress(achievement.id);
        const completed = progress === achievement.maxProgress;
          newAchievements.push({
          ...achievement,
          progress
        });
        if (completed) {
          completedAchievements.push(achievement.id);
        }
      }
      }

      // Mettre à jour l'état avec les nouveaux succès
      setAchievements(newAchievements);

      // Mettre à jour Firestore et AsyncStorage
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const currentData = userDoc.data();
          const currentProfile = currentData.profile || {};
          
            await updateDoc(doc(db, 'users', user.uid), {
              ...currentData,
              profile: {
                ...currentProfile,
                completedAchievements
              }
            });

          await AsyncStorage.setItem(OFFLINE_ACHIEVEMENTS_KEY, JSON.stringify(newAchievements));
          await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify({
            ...currentData,
            profile: {
              ...currentProfile,
              completedAchievements
            }
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des succès:', error);
    } finally {
      setLoading(false);
      setLoadingCategory(null);
    }
  };

  const checkAchievementProgress = async (achievementId: string): Promise<number> => {
    switch (achievementId) {
      case 'first_course':
        return await checkFirstCourse();
      case 'scholar':
        return await checkScholar();
      case 'daily_expert':
        return await checkDailyExpert();
      case 'first_quiz':
        return await checkFirstQuiz();
      case 'perfectionist':
        return await checkPerfectionist();
      case 'perfect_series':
        return await checkPerfectSeries();
      case 'level_explorer':
        return await checkLevelExplorer();
      case 'scientific_rigor':
        return await checkScientificRigor();
      case 'curious':
        return await checkCurious();
      case 'scanner_genius':
        return await checkScannerGenius();
      case 'scanner_documents':
        return await checkScannerDocuments();
      case 'homework_helper':
        return await checkHomeworkHelper();
      case 'all_professors':
        return await checkAllProfessors();
      case 'all_terrain':
        return await checkAllTerrain();
      case 'perseverant':
        return await checkPerseverant();
      case 'analyst':
        return await checkAnalyst();
      case 'sharer':
        return await checkSharer();
      case 'suggester':
        return await checkSuggester();
      case 'satisfaction':
        return await checkSatisfaction();
      case 'daily_quest_master':
        return await checkDailyQuestMaster();
      case 'first_affiliation':
        return await checkFirstAffiliation();
      case 'affiliation_networker':
        return await checkAffiliationNetworker();
      case 'affiliation_expert':
        return await checkAffiliationExpert();
      case 'affiliation_master':
        return await checkAffiliationMaster();
      default:
        return 0;
    }
  };

  const renderAchievements = () => {
    const categories = [...new Set(achievements.map(a => a.category))];
    
    return categories.map(category => (
      <View key={category} style={[styles.achievementCategory, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <Text style={[styles.categoryTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          {category}
        </Text>
        {achievements
          .filter(a => a.category === category)
          .map(achievement => (
            <View key={achievement.id} style={[styles.achievementCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
              <View style={styles.achievementHeader}>
                {achievement.imagePath ? (
                  <Image 
                    source={achievement.imagePath} 
                    style={styles.achievementImage}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                )}
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                    {achievement.description}
                  </Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${((achievement.progress ?? 0) / achievement.maxProgress) * 100}%`,
                        backgroundColor: (achievement.progress ?? 0) === achievement.maxProgress ? '#4CAF50' : '#60a5fa'
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  {achievement.progress}/{achievement.maxProgress}
                </Text>
              </View>
            </View>
          ))}
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#60a5fa" />
        {loadingCategory && (
          <Text style={[styles.loadingText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Chargement des {loadingCategory.toLowerCase()}...
          </Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
        Vos trophées
      </Text>
      
      {/* Barre de progression globale */}
      <View style={[styles.globalProgressContainer, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <Text style={[styles.globalProgressTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Progression globale
        </Text>
        <View style={styles.globalProgressBar}>
          <View 
            style={[
              styles.globalProgressFill, 
              { 
                width: `${(achievements.filter(a => a.progress === a.maxProgress).length / achievements.length) * 100}%`,
                backgroundColor: '#4CAF50'
              }
            ]} 
          />
        </View>
        <Text style={[styles.globalProgressText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          {achievements.filter(a => a.progress === a.maxProgress).length} / {achievements.length} succès complétés
        </Text>
      </View>

      {renderAchievements()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  achievementCategory: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  achievementCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  achievementImage: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'white',
  },
  globalProgressContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  globalProgressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  globalProgressBar: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  globalProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  globalProgressText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
}); 