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
  const [userSchoolType, setUserSchoolType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [programme, setProgramme] = useState<any[]>([]);
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
          setUserSchoolType(userData.profile.schoolType || '');
          
          // Récupérer le programme depuis la collection academia
          const academiaDoc = await getDoc(doc(db, 'academia', userData.profile.schoolType));
          if (academiaDoc.exists()) {
            const academiaData = academiaDoc.data();
            
            // Vérifier si les données nécessaires existent
            if (academiaData.classes && 
                academiaData.classes[userData.profile.class] && 
                academiaData.classes[userData.profile.class].matieres && 
                academiaData.classes[userData.profile.class].matieres[subject.id]) {
              
              // Récupérer le programme de la matière
              const subjectProgram = academiaData.classes[userData.profile.class].matieres[subject.id].programme || [];
              setProgramme(subjectProgram);
            } else {
              setProgramme([]);
            }
          } else {
            setProgramme([]);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setProgramme([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterContentPress = (chapterIndex: number, contentIndex: number) => {
    const chapter = programme[chapterIndex];
    const content = chapter.content[contentIndex];
    
    router.push({
      pathname: '/content/[subject]/[chapter]/[content]',
      params: {
        subject: subject.id,
        subjectLabel: subject.label,
        chapterIndex: chapterIndex,
        chapterLabel: chapter.title,
        contentId: contentIndex,
        contentLabel: content.content,
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

  if (!programme || programme.length === 0) {
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
      {programme.map((chapter, chapterIndex) => (
        <View
          key={chapterIndex}
          style={[styles.chapterCard, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.chapterTitle, { color: themeColors.text }]}>
            {chapter.title}
          </Text>
          {chapter.content.map((item: any, contentIndex: number) => (
            <TouchableOpacity
              key={contentIndex}
              style={styles.contentItem}
              onPress={() => handleChapterContentPress(chapterIndex, contentIndex)}
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

export default function EntrainementScreen() {
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
            .map((subjectData: any) => {
              // Vérifier si gradient existe avant d'appeler split
              const gradientArray = subjectData.gradient ? subjectData.gradient.split(',') : ['#60a5fa', '#3b82f6'];
              
              return {
                id: subjectData.id,
                label: subjectData.label,
                icon: subjectData.icon || 'book-open-variant',
                gradient: gradientArray,
                key: subjectData.id
              };
            });
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