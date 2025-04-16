import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, RefreshControl, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { ChapterContent } from '../../../constants/programme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Exercise } from '../../../types/exercise';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../firebaseConfig';

export default function ContentPage() {
  const { 
    subject, 
    subjectLabel,
    classe,
    classeLabel,
    chapterIndex,
    chapterLabel,
    content,
    contentId,
    contentLabel 
  } = useLocalSearchParams();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [isLoading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [contentData, setContentData] = useState<ChapterContent | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [userSchoolType, setUserSchoolType] = useState<string>('');
  const [userClass, setUserClass] = useState<string>('');
    // Obtenir la hauteur de la barre de statut
  const statusBarHeight = StatusBar.currentHeight || 0;

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) { 
      const userData = userDoc.data();
      setUserSchoolType(userData.profile.schoolType || '');
      setUserClass(userData.profile.class || '');
      await loadExercises(userData.profile.schoolType, userData.profile.class);
    }
  };  
  

  const loadExercises = async (schoolType: string, classe: string) => {
    try {
      setLoading(true);
      
      let completedExercises: string[] = [];
      const academiaDoc = await getDoc(doc(db, 'academia', schoolType));
      if (!academiaDoc.exists()) {
        console.error('Document academia non trouvé');
        setLoading(false);
        return;
      }

      const academiaData = academiaDoc.data();
      if (!academiaData.classes || 
        !academiaData.classes[classe] || 
        !academiaData.classes[classe].matieres || 
        !academiaData.classes[classe].matieres[subject as string]) {
        console.error('Structure de données invalide');
        setLoading(false);
        return;
      }
      
      // Récupérer le programme de la matière
      const subjectProgram = academiaData.classes[classe].matieres[subject as string].programme || [];
      
      // Trouver le chapitre correspondant
      if (isNaN(parseInt(chapterIndex as string)) || parseInt(chapterIndex as string) < 0 || parseInt(chapterIndex as string) >= subjectProgram.length) {
        console.error('Index de chapitre invalide');
        setLoading(false);
        return;
      }
      const chapter = subjectProgram[parseInt(chapterIndex as string)];

      // Trouver le contenu correspondant
      const contentIndex = parseInt(contentId as string);
      if (isNaN(contentIndex) || contentIndex < 0 || contentIndex >= chapter.content.length) {
        console.error('Index de contenu invalide');
        setLoading(false);
        return;
      }

      const content = chapter.content[contentIndex];
      
      // Vérifier si les exercices existent
      if (!content.exercices) {
        console.error('Exercices non trouvés');
        setLoading(false);
        return;
      }

      // Récupérer les exercices au même niveau que cours
      const exercisesData = content.exercices || [];
      
      // Transformer les exercices pour ajouter le statut de complétion
      const exercisesWithCompletion = exercisesData.map((exercise: any) => ({
        ...exercise,
        isCompleted: completedExercises.includes(exercise.id)
      }));
      
      setExercises(exercisesWithCompletion);
      setContentData({
        id: String(content),
        content: String(contentLabel)
      });
      setChapterTitle(String(chapterLabel));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExercises(userSchoolType, userClass);
  };

  const handleExercisePress = (exercise: Exercise) => {

    router.push({
      pathname: "/exercise/[id]",
      params: { 
        schoolType: String(userSchoolType),
        classe: String(userClass),
        subject: String(subject),
        chapterIndex: String(chapterIndex),
        contentId: String(contentId),
        contentLabel: String(contentLabel),
        exerciseId: exercise.id,
        exercice: exercise
      }
    } as any);
  };

  const handleChapterContentPress = (chapterIndex: number, contentIndex: number) => {
    router.push({
      pathname: '/content/[cours]/cours',
      params: {
        subject: subject as string,
        subjectLabel: subjectLabel as string,
        classe: classe as string,
        classeLabel: classeLabel as string,
        chapter: chapterIndex.toString(),
        chapterLabel: chapterLabel as string,
        contentId: contentIndex.toString(),
        contentLabel: contentLabel as string,
      },
    } as any);
  };

  const renderBackButton = () => (
    <View style={[styles.header, { 
      backgroundColor: themeColors.background,
      paddingTop: Platform.OS === 'android' ? statusBarHeight + 12 : 16,
      paddingBottom: Platform.OS === 'android' ? 12 : 16,
      marginTop: Platform.OS === 'android' ? 10 : 0,
     }]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.replace('/(tabs)/entrainement')}
      >
        <MaterialCommunityIcons 
          name="arrow-left" 
          size={30} 
          color={themeColors.text} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderExerciseCard = (exercise: Exercise) => (
    <TouchableOpacity
      key={exercise.id}
      style={[styles.exerciseCard, { backgroundColor: themeColors.card }]}
      onPress={() => handleExercisePress(exercise)}
    >
      <View style={styles.exerciseHeader}>
        <Text style={[styles.exerciseTitle, { color: themeColors.text }]}>
          {exercise.title}
        </Text>
        {exercise.isCompleted && (
          <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        )}
      </View>
      <View style={[styles.difficultyBadge, styles[`difficulty${exercise.difficulty}`]]}>
        <Text style={styles.difficultyText}>
          {exercise.difficulty}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        {renderBackButton()}
        <View style={styles.contentContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      </SafeAreaView>
    );
  }

  if (!contentData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        {renderBackButton()}
        <View style={styles.contentContainer}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: themeColors.text }]}>
              Contenu non trouvé
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {renderBackButton()}
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#60a5fa']}
              tintColor={isDarkMode ? '#ffffff' : '#000000'}
            />
          }
          scrollEventThrottle={400}
        >
          <View style={[styles.contentCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.breadcrumb}>
              <Text style={[styles.subjectTitle, { color: '#60a5fa' }]}>
                {String(subjectLabel)}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
              <Text style={[styles.chapterTitle, { color: themeColors.text }]}>
                {chapterTitle}
              </Text>
            </View>
            <View style={styles.contentHeader}>
              <View style={styles.contentTitleContainer}>
                <MaterialCommunityIcons 
                  name="book-open-variant" 
                  size={24} 
                  color="#60a5fa" 
                  style={styles.contentIcon}
                />
                <Text style={[styles.contentTitle, { color: themeColors.text }]}>
                  {contentData.content}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Cours
          </Text>
          <TouchableOpacity
            style={[styles.courseCard, { backgroundColor: themeColors.card }]}
            onPress={() => handleChapterContentPress(Number(chapterIndex), Number(contentId))}
          >
            <View style={styles.courseContent}>
              <View style={styles.courseIconContainer}>
                <MaterialCommunityIcons 
                  name="book-open-page-variant"
                  size={32} 
                  color="#60a5fa" 
                />
              </View>
              <View style={styles.courseTextContainer}>
                <Text style={[styles.courseTitle, { color: themeColors.text }]}>
                  Consulter le cours
                </Text>
                <Text style={[styles.courseDescription, { color: themeColors.text + '99' }]}>
                  Apprenez les concepts clés et les applications pratiques
                </Text>
              </View>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color={themeColors.text} 
                style={styles.courseArrow}
              />
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Exercices
          </Text>
          
          {exercises.map(renderExerciseCard)}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: Platform.OS === 'android' ? 70 : 60,
    justifyContent: 'center',
  },
  backButton: {
    padding: 16,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  contentCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  subjectTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    flex: 1,
    flexWrap: 'wrap',
  },
  contentHeader: {
    marginTop: 8,
  },
  contentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentIcon: {
    marginRight: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  difficultyfacile: {
    backgroundColor: '#4CAF50',
  },
  difficultymoyen: {
    backgroundColor: '#FF9800',
  },
  difficultydifficile: {
    backgroundColor: '#F44336',
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
  courseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseIconContainer: {
    padding: 8,
  },
  courseTextContainer: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  courseDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  courseArrow: {
    marginLeft: 12,
  },
}); 