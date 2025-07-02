import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { showErrorAlert } from '../utils/alerts';
import { OnboardingButton } from '../components/OnboardingButton';
import { getSubjects } from '../services/firestoreService';
import { parseGradient } from '../utils/subjectGradients';

type Step7Props = {
  onBack: () => void;
  onNext: (data: Partial<{ name: string; username: string; country: string; schoolType: string; class: string; subjects: Array<{ id: string; label: string }>, notificationsEnabled: boolean }>) => void;
  data: { name?: string; username?: string; country?: string; schoolType?: string; class?: string; subjects?: Array<{ id: string; label: string }>, notificationsEnabled?: boolean };
};

export default function Step7({ onNext, onBack, data }: Step7Props) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const [isSaving, setIsSaving] = useState(false);
  const [subjects, setSubjects] = useState<Array<{
    id: string;
    label: string;
    icon: string;
    gradient: string;
    key: string;
  }>>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!data.subjects || data.subjects.length === 0) return;
      
      try {
        // Récupérer les objets complets des matières sélectionnées
        const subjectsRef = collection(db, 'subjects');
        const subjectsQuery = query(subjectsRef, where('__name__', 'in', data.subjects.map(s => s.id)));
        const subjectsSnapshot = await getDocs(subjectsQuery);
        
        const loadedSubjects = subjectsSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          label: doc.data().label,
          icon: doc.data().icon,
          gradient: doc.data().gradient,
          key: doc.id,
        }));
        
        setSubjects(loadedSubjects);
      } catch (error) {
        console.error('Erreur lors du chargement des matières:', error);
        setSubjects([]);
      }
    };
    loadSubjects();
  }, [data.subjects]);

  const handleSaveAndContinue = async () => {
    try {
      setIsSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'profile.name': data.name,
        'profile.username': data.username,
        'profile.country': data.country,
        'profile.schoolType': data.schoolType,
        'profile.class': data.class,
        'profile.subjects': data.subjects,
        'profile.onboardingCompleted': true,
        'notificationsEnabled': data.notificationsEnabled,
      });

      onNext(data);
    } catch (error) {
      showErrorAlert('Erreur', 'Une erreur est survenue lors de la sauvegarde de votre profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenue sur AcademIA !</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.welcomeText}>
          Ravi de te rencontrer, <Text style={styles.nameText}>{data.name}</Text> !
        </Text>
        <Text style={styles.subjectsTitle}>
          Voici les matières que nous allons explorer ensemble :
        </Text>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {data.subjects && data.subjects.length > 0 ? (
          <View style={styles.grid}>
            {subjects?.map((subject) => {
              return (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectButton,
                    styles.selectedSubject,
                  ]}
                >
                  <LinearGradient
                    colors={parseGradient(subject.gradient)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                  >
                    <View style={styles.checkmarkContainer}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color="#22c55e"
                      />
                    </View>
                    <MaterialCommunityIcons
                      name={subject.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={32}
                      color="#fff"
                      style={styles.icon}
                    />
                    <Text 
                      style={styles.subjectLabel}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {subject.label}
                    </Text>
                  </LinearGradient> 
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noSubjectsText}>
            Aucune matière sélectionnée
          </Text>
        )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <OnboardingButton
          icon="arrow-left"
          onPress={onBack}
          style={styles.backButton}
        />
        <OnboardingButton
          label="Continuer"
          onPress={handleSaveAndContinue}
          disabled={isSaving}
          style={styles.continueButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    marginTop: 20,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    flex: 1,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 8,
  },
  nameText: {
    color: '#60a5fa',
    fontWeight: 'bold',
  },
  subjectsTitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 16,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    zIndex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  icon: {
    marginBottom: 12,
    alignSelf: 'center',
  },
  subjectLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    alignSelf: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  subjectButton: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedSubject: {
    transform: [{ scale: 0.95 }],
  },
  subjectText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  button: {
    backgroundColor: '#60a5fa',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noSubjectsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#60a5fa',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    width: 50,
    height: 50,
  },
}); 