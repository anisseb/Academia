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
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { parseGradient } from '../utils/subjectGradients';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { saveFavorites, saveSubjectConfigs } from '../utils/userDataManager';

interface FavoriteMinimal {
  chapterId: string;
  timestamp: number;
}

interface FavoriteDisplay {
  chapterId: string;
  chapterTitle: string;
  themeLabel: string;
  subjectId: string;
  subjectLabel: string;
  subjectIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  subjectGradient: [string, string];
  timestamp: number;
}

interface GroupedFavorites {
  [subject: string]: {
    label: string;
    courses: FavoriteDisplay[];
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
  const [favorites, setFavorites] = useState<FavoriteDisplay[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const statusBarHeight = StatusBar.currentHeight || 0;
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
    accent: '#60a5fa',
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadUserFavorites();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserFavorites();
    }, [])
  );

  const loadUserFavorites = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setLoading(false);
        return;
      }
      const userData = userDoc.data();
      const userFavorites: FavoriteMinimal[] = userData.favorites || [];
      if (userFavorites.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      // Batch fetch chapters
      const chapterIds = userFavorites.map(fav => fav.chapterId);
      const chaptersQuery = query(collection(db, 'chapters'), where('__name__', 'in', chapterIds));
      const chaptersSnapshot = await getDocs(chaptersQuery);
      const chaptersMap: Record<string, any> = {};
      chaptersSnapshot.forEach(doc => {
        chaptersMap[doc.id] = doc.data();
      });
      // Batch fetch themes
      const themeIds = Array.from(new Set(Object.values(chaptersMap).map((ch: any) => ch.themeId)));
      const themesQuery = query(collection(db, 'theme'), where('__name__', 'in', themeIds));
      const themesSnapshot = await getDocs(themesQuery);
      const themesMap: Record<string, any> = {};
      themesSnapshot.forEach(doc => {
        themesMap[doc.id] = doc.data();
      });
      // Batch fetch subjects
      const subjectIds = Array.from(new Set(Object.values(themesMap).map((th: any) => th.subjectId)));
      const subjectsQuery = query(collection(db, 'subjects'), where('__name__', 'in', subjectIds));
      const subjectsSnapshot = await getDocs(subjectsQuery);
      const subjectsMap: Record<string, any> = {};
      subjectsSnapshot.forEach(doc => {
        subjectsMap[doc.id] = doc.data();
      });
      // Build displayFavorites
      const displayFavorites: FavoriteDisplay[] = [];
      for (const fav of userFavorites) {
        const chapterData = chaptersMap[fav.chapterId];
        if (!chapterData) continue;
        const themeData = themesMap[chapterData.themeId];
        if (!themeData) continue;
        const subjectData = subjectsMap[themeData.subjectId];
        if (!subjectData) continue;
        // Sécurité supplémentaire : ignorer les favoris mal formés
        if (!chapterData.title || !subjectData.label || !subjectData.icon) {
          continue;
        }
        // Sécurisation du gradient
        const safeGradient = typeof subjectData.gradient === 'string' && subjectData.gradient.includes('linear-gradient')
          ? subjectData.gradient
          : 'linear-gradient(to right, #60a5fa, #3b82f6)';
        displayFavorites.push({
          chapterId: fav.chapterId,
          chapterTitle: chapterData.title,
          themeLabel: themeData.title,
          subjectId: themeData.subjectId,
          subjectLabel: subjectData.label,
          subjectIcon: subjectData.icon as keyof typeof MaterialCommunityIcons.glyphMap,
          subjectGradient: parseGradient(safeGradient),
          timestamp: fav.timestamp,
        });
      }
      // Trier par date d'ajout (plus récent en premier)
      displayFavorites.sort((a, b) => b.timestamp - a.timestamp);
      setFavorites(displayFavorites);
      await AsyncStorage.setItem('@offline_favorites', JSON.stringify(displayFavorites));
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      // Essayer de charger les favoris hors-ligne
      try {
        const savedFavorites = await AsyncStorage.getItem('@offline_favorites');
        if (savedFavorites) {
          const parsed = JSON.parse(savedFavorites);
          const validFavorites = Array.isArray(parsed)
            ? parsed.filter(fav => fav.chapterId && fav.chapterTitle && fav.subjectId && fav.subjectLabel && fav.subjectIcon && fav.subjectGradient)
            : [];
          setFavorites(validFavorites);
        } else {
          setFavorites([]);
        }
      } catch (e) {
        setFavorites([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCoursePress = (course: FavoriteDisplay) => {
    router.push({
      pathname: '/content/[cours]/cours',
      params: {
        chapterId: course.chapterId,
        subject: course.subjectId,
        subjectLabel: course.subjectLabel,
        chapterLabel: course.chapterTitle,
        themeLabel: course.themeLabel,
        subjectGradient: course.subjectGradient,
      },
    } as any);
  };

  // Regrouper les favoris par matière
  const groupedFavorites = favorites.reduce((acc, fav) => {
    if (!acc[fav.subjectId]) {
      acc[fav.subjectId] = {
        subjectLabel: fav.subjectLabel,
        subjectIcon: fav.subjectIcon,
        subjectGradient: fav.subjectGradient,
        courses: [],
      };
    }
    acc[fav.subjectId].courses.push(fav);
    return acc;
  }, {} as Record<string, {
    subjectLabel: string;
    subjectIcon: keyof typeof MaterialCommunityIcons.glyphMap;
    subjectGradient: [string, string];
    courses: FavoriteDisplay[];
  }>);

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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {Object.keys(groupedFavorites).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.text }]}>Aucun cours en favoris</Text>
          </View>
        ) : (
          Object.entries(groupedFavorites).map(([subjectId, data]) => (
            <View key={subjectId} style={[styles.subjectCard, { backgroundColor: themeColors.card }]}> 
              <TouchableOpacity
                style={styles.subjectHeader}
                onPress={() => setExpandedSubject(expandedSubject === subjectId ? null : subjectId)}
              >
                <LinearGradient
                  colors={data.subjectGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.headerGradient}
                >
                  <View style={styles.headerContent}>
                    <MaterialCommunityIcons name={data.subjectIcon} size={24} color="#fff" />
                    <Text style={styles.subjectTitle}>{data.subjectLabel}</Text>
                    <MaterialCommunityIcons
                      name={expandedSubject === subjectId ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color="#fff"
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              {expandedSubject === subjectId && (
                <View style={[styles.coursesList, { borderTopColor: themeColors.border }]}> 
                  {data.courses.map((fav) => (
                    <TouchableOpacity
                      key={fav.chapterId}
                      style={[styles.courseItem, { borderBottomColor: themeColors.border }]}
                      onPress={() => handleCoursePress(fav)}
                    >
                      <View>
                        <Text style={[styles.chapterLabel, { color: themeColors.text }]}> {fav.chapterTitle} </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))
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
  courseInfo: {
    padding: 16,
  },
  subjectHeader: {
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  coursesList: {
    borderTopWidth: 1,
  },
  courseItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
}); 