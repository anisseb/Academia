import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { getSubjectInfo } from '../constants/education';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { programmes, Programme, Chapter } from '../constants/programme';
import { useFocusEffect } from '@react-navigation/native';

interface Subject {
  id: string;
  label: string;
  icon: string;
  gradient: string[];
  key: string;
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
  const [userSection, setUserSection] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [programme, setProgramme] = useState<Programme | null>(null);
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
          setUserSection(userData.profile.section);
          
          // Rechercher le programme correspondant
          const foundProgramme = programmes.find(p => 
            p.country === 'fr' && 
            p.class === userData.profile.class && 
            p.subject === subject.id &&
            (!p.section || p.section === userData.profile.section)
          );
          
          setProgramme(foundProgramme || null);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterContentPress = (chapterId: string, contentId: string) => {
    router.push({
      pathname: '/content/[cours]/cours',
      params: {
        subject: subject.id,
        subjectLabel: subject.label,
        chapter: chapterId,
        chapterLabel: programme?.chapters.find(c => c.id === chapterId)?.title,
        contentId: contentId,
        contentLabel: programme?.chapters.find(c => c.id === chapterId)?.content.find(c => c.id === contentId)?.content,
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

  if (!programme) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.noContentText, { color: themeColors.text }]}>
          Aucun programme disponible pour votre niveau
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.content}>
      {programme.chapters.map((chapter) => (
        <View
          key={chapter.id}
          style={[styles.chapterCard, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.chapterTitle, { color: themeColors.text }]}>
            {chapter.title}
          </Text>
          {chapter.content.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.contentItem}
              onPress={() => handleChapterContentPress(chapter.id, item.id)}
            >
              <Text style={[styles.contentText, { color: themeColors.text }]}>
                {item.content}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={themeColors.text}
              />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

export default function RevisionScreen() {
  const { isDarkMode } = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserSubjects();
      }
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        if (auth.currentUser) {
          await loadUserSubjects();
        }
      };
      
      loadData();
    }, [])
  );

  const loadUserSubjects = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.profile && userData.profile.subjects) {
          const userSubjects = userData.profile.subjects
            .map((id: string) => {
              const subject = getSubjectInfo(id);
              return subject ? { ...subject, id, key: id } : null;
            })
            .filter((subject: { id: string; label: string; icon: string; gradient: string[]; key: string; } | null): subject is Subject => subject !== null);
          setSubjects(userSubjects);
          if (userSubjects.length > 0) {
            setSelectedSubject(userSubjects[0]);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (subjects.length === 0) {
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
                [subject.gradient[0], subject.gradient[1]] as const : 
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
  chapterCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  contentText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
}); 