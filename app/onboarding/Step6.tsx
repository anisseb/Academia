import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSubjectInfo } from '../constants/education';

type Step6Props = {
  onNext: (data: Partial<{ name: string; birthDate: string; subjects: string[] }>) => void;
  data: { name: string; birthDate: string; subjects: string[] };
};

export default function Step5({ onNext, data }: Step6Props) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

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

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleSaveAndContinue = async () => {
    try {
      setIsSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'profile.name': data.name,
        'profile.age': calculateAge(data.birthDate),
        'profile.birthDate': data.birthDate,
        'profile.subjects': data.subjects,
        'profile.onboardingCompleted': true,
      });

      onNext(data);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      alert('Une erreur est survenue lors de la sauvegarde de votre profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
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
            <View style={styles.subjectsList}>
              {data.subjects.map((subject) => {
                const subjectInfo = getSubjectInfo(subject);
                return (
                  <LinearGradient
                    key={subject}
                    colors={subjectInfo.gradient as [string, string]}
                    style={styles.subjectCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons 
                      name={subjectInfo.icon as any}
                      size={16} 
                      color="#fff" 
                    />
                    <Text style={styles.subjectText} numberOfLines={1}>
                      {subjectInfo.label}
                    </Text>
                  </LinearGradient>
                );
              })}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleSaveAndContinue}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Commencer l'aventure</Text>
                <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
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
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
    width: '48%',
    marginBottom: 8,
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
}); 