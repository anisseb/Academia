import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { renderMathText as MathText } from '../../utils/mathRenderer';

interface CoursSection {
  title: string;
  content: string;
  examples?: string[];
  keyPoints?: string[];
}

interface CoursContent {
  title: string;
  introduction: string;
  sections: CoursSection[];
  conclusion: string;
}

export default function CoursScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  
  // Obtenir la hauteur de la barre de statut
  const statusBarHeight = StatusBar.currentHeight || 0;
  
  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
    accent: '#60a5fa',
  };

  const [coursContent, setCoursContent] = useState<CoursContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState<string>('');
  const [userSchoolType, setUserSchoolType] = useState<string>('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.profile) {
          setUserLevel(userData.profile.class || '');
          setUserSchoolType(userData.profile.schoolType || '');
          await loadCourse(userData.profile.class, userData.profile.schoolType);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      setLoading(false);
    }
  };

  const loadCourse = async (level: string, schoolType: string) => {
    try {
      setLoading(true);
      
      // Récupérer le cours depuis la collection academia
      const academiaDoc = await getDoc(doc(db, 'academia', schoolType));
      if (!academiaDoc.exists()) {
        console.error('Document academia non trouvé');
        setLoading(false);
        return;
      }
      
      const academiaData = academiaDoc.data();
      
      // Vérifier si les données nécessaires existent
      if (!academiaData.classes || 
          !academiaData.classes[level] || 
          !academiaData.classes[level].matieres || 
          !academiaData.classes[level].matieres[params.subject as string]) {
        console.error('Structure de données invalide');
        setLoading(false);
        return;
      }
      
      // Récupérer le programme de la matière
      const subjectProgram = academiaData.classes[level].matieres[params.subject as string].programme || [];
      
      // Trouver le chapitre correspondant
      const chapterIndex = parseInt(params.chapter as string);
      if (isNaN(chapterIndex) || chapterIndex < 0 || chapterIndex >= subjectProgram.length) {
        console.error('Index de chapitre invalide');
        setLoading(false);
        return;
      }
      
      const chapter = subjectProgram[chapterIndex];
      
      // Trouver le contenu correspondant
      const contentIndex = parseInt(params.contentId as string);
      if (isNaN(contentIndex) || contentIndex < 0 || contentIndex >= chapter.content.length) {
        console.error('Index de contenu invalide');
        setLoading(false);
        return;
      }
      
      const content = chapter.content[contentIndex];
      
      // Vérifier si le cours existe
      if (!content.cours) {
        console.error('Cours non trouvé');
        setLoading(false);
        return;
      }
      
      // Utiliser le cours existant
      setCoursContent(content.cours);
      
    } catch (error) {
      console.error('Erreur lors du chargement du cours:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Chargement du cours...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!coursContent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themeColors.text }]}>
            Impossible de charger le cours
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          borderBottomColor: themeColors.border,
          paddingTop: Platform.OS === 'android' ? statusBarHeight + 12 : 16,
          paddingBottom: Platform.OS === 'android' ? 12 : 16,
          marginTop: Platform.OS === 'android' ? 10 : 0,
        }
      ]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/revision')}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={themeColors.text} 
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.subjectLabel, { color: themeColors.accent }]}>
            {params.subjectLabel}
          </Text>
          <Text style={[styles.chapterLabel, { color: themeColors.text }]}>
            {params.chapterLabel}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={[styles.courseCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.courseTitle, { color: themeColors.text }]}>
            {coursContent.title}
          </Text>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.accent }]}>
              Introduction
            </Text>
            <View style={styles.mathContent}>
              <MathText
                content={coursContent.introduction}
                type="cours"
                isDarkMode={isDarkMode}
              />
            </View>
          </View>

          {coursContent.sections.map((section: CoursSection, index: number) => (
            <View key={index} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.accent }]}>
                {section.title}
              </Text>
              <View style={styles.mathContent}>
              <MathText
                content={section.content}
                type="cours"
                isDarkMode={isDarkMode}
              />
              </View>
              
              {section.examples && (
                <View style={styles.examples}>
                  {section.examples.map((example, i) => (
                    <View key={i} style={[styles.exampleBox, { backgroundColor: themeColors.background }]}>
                      <View style={styles.mathContent}>
                        <MathText
                          content={example}
                          type="cours"
                          isDarkMode={isDarkMode}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {section.keyPoints && (
                <View style={styles.keyPoints}>
                  {section.keyPoints.map((point, i) => (
                    <View key={i} style={styles.keyPointItem}>
                      <MaterialCommunityIcons 
                        name="check-circle" 
                        size={20} 
                        color={themeColors.accent} 
                      />
                     <MathText
                        content={point}
                        type="cours"
                        isDarkMode={isDarkMode}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.accent }]}>
              Conclusion
            </Text>
            <MathText
              content={coursContent.conclusion}
              type="cours"
              isDarkMode={isDarkMode}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    minHeight: Platform.OS === 'android' ? 70 : 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    marginLeft: 16,
  },
  subjectLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chapterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  courseCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  examples: {
    marginTop: 12,
    gap: 8,
  },
  exampleBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  exampleText: {
    fontSize: 15,
  },
  keyPoints: {
    marginTop: 12,
    gap: 8,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyPointText: {
    fontSize: 15,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  mathContent: {
    height: 'auto',
  },
});