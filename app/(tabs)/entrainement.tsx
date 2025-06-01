import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSchoolData } from '../hooks/useSchoolData';
import { parseGradient } from '../utils/subjectGradients';
import type { Subject, Theme, Chapter } from '../types/firestore';

interface ThemeWithChapters extends Theme {
  chapters: Chapter[];
}

interface SubjectSceneProps {
  subject: Subject;
  themeColors: {
    background: string;
    text: string;
    card: string;
    border: string;
  };
}

const SubjectScene: React.FC<SubjectSceneProps> = ({ subject, themeColors }) => {
  const [userClass, setUserClass] = useState<string>('');
  const [userCountry, setUserCountry] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<ThemeWithChapters[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadUserProfile();
  }, [subject]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.profile) {
          setUserClass(userData.profile.class || '');
          setUserCountry(userData.profile.country || '');
          
          // Récupérer les thèmes
          const themesRef = collection(db, 'theme');
          const themesQuery = query(
            themesRef,
            where('countryId', '==', userData.profile.country),
            where('classeId', '==', userData.profile.class),
            where('subjectId', '==', subject.id),
            orderBy('createdAt', 'asc')
          );

          const themesSnapshot = await getDocs(themesQuery);
          const themesData = themesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Theme[];

          // Pour chaque thème, récupérer ses chapitres
          const themesWithChapters = await Promise.all(
            themesData.map(async (theme) => {
              const chaptersRef = collection(db, 'chapters');
              const chaptersQuery = query(
                chaptersRef,
                where('themeId', '==', theme.id),
                orderBy('createdAt', 'asc')
              );

              const chaptersSnapshot = await getDocs(chaptersQuery);
              const chapters = chaptersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Chapter[];

              return {
                ...theme,
                chapters
              };
            })
          );

          setThemes(themesWithChapters);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setThemes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterPress = (theme: Theme, chapter: Chapter) => {
    router.push({
      pathname: '/content/[subject]/[chapter]/[content]',
      params: {
        subject: subject.id,
        subjectLabel: subject.label,
        themeId: theme.id,
        themeLabel: theme.title,
        chapterId: chapter.id,
        chapterLabel: chapter.title,
      },
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (!themes || themes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.noContentText, { color: themeColors.text }]}>
          Aucun thème disponible pour votre niveau
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {themes.map((theme) => (
        <View
          key={theme.id}
          style={[styles.themeCard, { backgroundColor: themeColors.card }]}
        >
          <LinearGradient
            colors={parseGradient(subject.gradient)}
            style={styles.themeHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.themeTitle}>
              {theme.title}
            </Text>
          </LinearGradient>
          
          <View style={styles.chaptersContainer}>
            {theme.chapters.map((chapter, index) => (
              <TouchableOpacity
                key={chapter.id}
                style={[
                  styles.chapterItem,
                  { 
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                  }
                ]}
                onPress={() => handleChapterPress(theme, chapter)}
              >
                <View style={styles.chapterContent}>
                  <View style={styles.chapterHeader}>
                    <View style={styles.chapterNumber}>
                      <Text style={[styles.chapterNumberText, { color: themeColors.text }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.chapterTitleContainer}>
                      <Text style={[styles.chapterTitle, { color: themeColors.text }]}>
                        {chapter.title}
                      </Text>
                    </View>
                  </View>
                  <Text 
                    style={[styles.chapterDescription, { color: themeColors.text }]}
                    numberOfLines={2}
                  >
                    {chapter.cours.content}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={themeColors.text}
                  style={styles.chapterIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default function EntrainementScreen() {
  const { isDarkMode } = useTheme();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
  };

  const { subjects, loading: subjectsLoading } = useSchoolData(
    userProfile?.country,
    userProfile?.schoolType,
    userProfile?.class
  );

  // Sélectionner automatiquement le premier sujet lorsque les sujets sont chargés
  useEffect(() => {
    if (subjects && subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      if (userData.profile) {
        setUserProfile(userData.profile);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  if (loading || subjectsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.noSubjectsText, { color: themeColors.text }]}>
          Aucune matière sélectionnée dans votre profil
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        {subjects.map((subject) => (
          <TouchableOpacity
            key={subject.id}
            onPress={() => setSelectedSubject(subject)}
            style={[
              styles.tabButton,
              { borderColor: selectedSubject?.id === subject.id ? '#60a5fa' : themeColors.border }
            ]}
          >
            <LinearGradient
              colors={selectedSubject?.id === subject.id ? 
                parseGradient(subject.gradient) : 
                [themeColors.card, themeColors.card] as const}
              style={styles.tabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons
                name={subject.icon as any}
                size={20}
                color={selectedSubject?.id === subject.id ? '#ffffff' : themeColors.text}
              />
              <Text style={[
                styles.tabText,
                { color: selectedSubject?.id === subject.id ? '#ffffff' : themeColors.text }
              ]}>
                {subject.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedSubject && (
        <SubjectScene
          subject={selectedSubject}
          themeColors={themeColors}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 60,
  },
  tabButton: {
    marginHorizontal: 6,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    height: 44,
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: '100%',
    minWidth: 120,
  },
  tabText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 20,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  exerciseContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  noSubjectsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noContentText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  themeCard: {
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  themeHeader: {
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  themeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chaptersContainer: {
    padding: 16,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    minHeight: 80,
  },
  chapterContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chapterHeader: {
    flexDirection: 'row',
    paddingTop: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chapterNumberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chapterTitleContainer: {
    flex: 3,
    justifyContent: 'flex-end',
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  chapterDescription: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  chapterIcon: {
    opacity: 0.5,
    marginLeft: 4,
  },
}); 