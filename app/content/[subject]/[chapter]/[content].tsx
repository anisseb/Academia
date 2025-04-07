import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { ChapterContent } from '../../../constants/programme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Exercise } from '../../../types/exercise';
import { getExercisesByPath } from '../../../services/exerciseService';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../firebaseConfig';

export default function ContentPage() {
  const { 
    subject, 
    subjectLabel,
    classe,
    classeLabel,
    chapter,
    chapterLabel,
    content, 
    contentLabel 
  } = useLocalSearchParams();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [isLoading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [contentData, setContentData] = useState<ChapterContent | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
  };

  const loadExercises = async () => {
    try {
      setLoading(true);
      
      // Récupérer les exercices avec la nouvelle structure
      const exercisesList = await getExercisesByPath(
        String(subject),
        String(classe),
        String(chapter),
        String(content)
      );

      // Récupérer les exercices complétés par l'utilisateur
      const user = auth.currentUser;
      let completedExercises: string[] = [];
      
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userExercises = userData.exercises?.[String(subject)]?.[String(classe)]?.[String(chapter)]?.[String(content)] || {};
          completedExercises = Object.keys(userExercises).filter(id => userExercises[id].done);
        }
      }

      // Filtrer les exercices non complétés par difficulté
      const easyExercises = exercisesList.filter(ex => 
        ex.difficulty === 'facile' && !completedExercises.includes(ex.id)
      );
      const mediumExercises = exercisesList.filter(ex => 
        ex.difficulty === 'moyen' && !completedExercises.includes(ex.id)
      );
      const hardExercises = exercisesList.filter(ex => 
        ex.difficulty === 'difficile' && !completedExercises.includes(ex.id)
      );

      // Sélectionner un exercice de chaque difficulté
      const selectedExercises = [];
      if (easyExercises.length > 0) selectedExercises.push(easyExercises[0]);
      if (mediumExercises.length > 0) selectedExercises.push(mediumExercises[0]);
      if (hardExercises.length > 0) selectedExercises.push(hardExercises[0]);
      
      setExercises(selectedExercises);
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
    await loadExercises();
  };

  useEffect(() => {
    loadExercises();
  }, [subject, chapter, content]);

  const handleBack = () => {
    router.back();
  };

  const handleExercisePress = (exercise: Exercise) => {
    router.push({
      pathname: "/exercise/[id]",
      params: { 
        id: exercise.id,
        subject: String(subject),
        classe: String(classe),
        chapter: String(chapter),
        content: String(content)
      }
    } as any);
  };

  const renderBackButton = () => (
    <View style={[styles.header, { backgroundColor: themeColors.background }]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBack}
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
    height: 60,
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
  },
  subjectTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
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
}); 