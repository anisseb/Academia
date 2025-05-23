import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSubjects, parseGradient } from '../utils/subjectGradients';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { saveFavorites, saveSubjectConfigs } from '../utils/userDataManager';

interface FavoriteCourse {
  id: string;
  subject: string;
  subjectLabel: string;
  chapter: string;
  chapterLabel: string;
  contentId: string;
  courseTitle: string;
  timestamp: number;
}

interface GroupedFavorites {
  [subject: string]: {
    label: string;
    courses: FavoriteCourse[];
  };
}

interface SubjectConfig {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  gradientColors: [string, string];
}

const OFFLINE_FAVORITES_KEY = '@offline_favorites';
const OFFLINE_SUBJECT_CONFIGS_KEY = '@offline_subject_configs';
const OFFLINE_USER_KEY = '@offline_user';

export default function FavorisScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<GroupedFavorites>({});
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [subjectConfigs, setSubjectConfigs] = useState<Record<string, SubjectConfig>>({});
  const [userSchoolType, setUserSchoolType] = useState<string>('');
  const [userClass, setUserClass] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);
  
  const statusBarHeight = StatusBar.currentHeight || 0;
  
  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
    accent: '#60a5fa',
  };

  useEffect(() => {
    // Vérifier la connexion internet
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      // Vérifier si nous sommes en ligne
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        // Charger les données hors ligne
        await loadOfflineData();
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      if (userData.profile) {
        setUserSchoolType(userData.profile.schoolType || '');
        setUserClass(userData.profile.class || '');
        
        // Charger les favoris
        const favorites = await getFavorites();
        setFavorites(favorites);
        await saveFavorites(favorites);
        
        // Charger et sauvegarder les configurations
        const configs = await loadSubjectConfigs(userData.profile.schoolType, userData.profile.class);
        setSubjectConfigs(configs);
        await saveSubjectConfigs(configs);
        
        // Sauvegarder les données utilisateur
        await saveUserData(userData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      // En cas d'erreur, essayer de charger les données hors ligne
      await loadOfflineData();
    } finally {
      setLoading(false);
    }
  };

  const saveOfflineData = async () => {
    try {
      await AsyncStorage.setItem(OFFLINE_FAVORITES_KEY, JSON.stringify(favorites));
      await AsyncStorage.setItem(OFFLINE_SUBJECT_CONFIGS_KEY, JSON.stringify(subjectConfigs));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données hors ligne:', error);
    }
  };

  const loadOfflineData = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(OFFLINE_FAVORITES_KEY);
      const savedConfigs = await AsyncStorage.getItem(OFFLINE_SUBJECT_CONFIGS_KEY);
      const savedUserData = await AsyncStorage.getItem(OFFLINE_USER_KEY);

      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
      if (savedConfigs) {
        setSubjectConfigs(JSON.parse(savedConfigs));
      }
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        if (userData.profile) {
          setUserSchoolType(userData.profile.schoolType || '');
          setUserClass(userData.profile.class || '');
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données hors ligne:', error);
      setLoading(false);
    }
  };

  const loadSubjectConfigs = async (schoolType: string, classe: string) => {
    try {
      // Créer un tableau d'objets SubjectInput à partir des favoris
      const userFavorites = await getFavorites();
      const subjectInputs = Object.keys(userFavorites).map(subjectId => ({
        id: subjectId,
        label: userFavorites[subjectId].label
      }));

      // Utiliser getSubjects pour obtenir les configurations des matières
      const subjects = await getSubjects(subjectInputs, schoolType, classe);
      
      const configs: Record<string, SubjectConfig> = {};
      subjects.forEach(subject => {
        configs[subject.id] = {
          icon: subject.icon as keyof typeof MaterialCommunityIcons.glyphMap,
          gradientColors: parseGradient(subject.gradient)
        };
      });

      return configs;
    } catch (error) {
      console.error('Erreur lors du chargement des configurations des matières:', error);
      return {};
    }
  };

  const getFavorites = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return {};

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return {};

      const userData = userDoc.data();
      const userFavorites = userData.favorites || [];
      
      // Grouper les favoris par matière
      const grouped: GroupedFavorites = {};
      userFavorites.forEach((fav: FavoriteCourse) => {
        if (!grouped[fav.subject]) {
          grouped[fav.subject] = {
            label: fav.subjectLabel,
            courses: []
          };
        }
        grouped[fav.subject].courses.push(fav);
      });

      // Trier les cours par date d'ajout (plus récent en premier)
      Object.values(grouped).forEach(subject => {
        subject.courses.sort((a, b) => b.timestamp - a.timestamp);
      });

      return grouped;
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      return {};
    }
  };

  const loadFavorites = async () => {
    const favorites = await getFavorites();
    setFavorites(favorites);
    setLoading(false);
  };

  const handleCoursePress = (course: FavoriteCourse) => {
    router.push({
      pathname: '/content/[cours]/cours',
      params: {
        subject: course.subject as string,
        subjectLabel: course.subjectLabel as string,
        classe: userClass as string,
        chapter: course.chapter as string,
        chapterLabel: course.chapterLabel as string,
        contentId: course.contentId as string,
      },
    } as any);
  };

  const getSubjectConfig = (subject: string): SubjectConfig => {
    return subjectConfigs[subject] || {
      icon: 'book' as keyof typeof MaterialCommunityIcons.glyphMap,
      gradientColors: ['#64748b', '#94a3b8'] as [string, string]
    };
  };

  const saveUserData = async (userData: any) => {
    try {
      await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données utilisateur:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons name="wifi-off" size={20} color="#fff" />
          <Text style={styles.offlineText}>Mode hors ligne</Text>
        </View>
      )}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.entries(favorites).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.text }]}>
              Aucun cours en favoris
            </Text>
          </View>
        ) : (
          Object.entries(favorites).map(([subject, data]) => {
            const { icon, gradientColors } = getSubjectConfig(subject);
            return (
              <View key={subject} style={[styles.subjectCard, { backgroundColor: themeColors.card }]}>
                <TouchableOpacity
                  style={styles.subjectHeader}
                  onPress={() => setExpandedSubject(expandedSubject === subject ? null : subject)}
                >
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGradient}
                  >
                    <View style={styles.headerContent}>
                      <MaterialCommunityIcons name={icon} size={24} color="#fff" />
                      <Text style={styles.subjectTitle}>
                        {data.label}
                      </Text>
                      <MaterialCommunityIcons 
                        name={expandedSubject === subject ? "chevron-up" : "chevron-down"} 
                        size={24} 
                        color="#fff" 
                      />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                
                {expandedSubject === subject && (
                  <View style={[styles.coursesList, { borderTopColor: themeColors.border }]}>
                    {data.courses.map((course, index) => (
                      <TouchableOpacity
                        key={`${course.id}-${index}`}
                        style={[styles.courseItem, { borderBottomColor: themeColors.border }]}
                        onPress={() => handleCoursePress(course)}
                      >
                        <View>
                          <Text style={[styles.chapterLabel, { color: themeColors.text }]}>
                            {course.chapterLabel}
                          </Text>
                          <Text style={[styles.courseTitle, { color: themeColors.accent }]}>
                            {course.courseTitle}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subjectCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectHeader: {
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerGradient: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  coursesList: {
    borderTopWidth: 1,
  },
  courseItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  chapterLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  offlineBanner: {
    backgroundColor: '#f59e0b',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  offlineText: {
    color: '#fff',
    fontWeight: '500',
  },
}); 