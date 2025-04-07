import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { saveExercisesToFirestore } from '../services/exerciseService';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();
  const [isImporting, setIsImporting] = useState(false);
  
  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
    inputBackground: isDarkMode ? '#1a1a1a' : '#ffffff',
    primary: '#60a5fa',
  };
  
  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/auth');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData?.profile?.is_admin) {
        router.replace('/(tabs)');
        return;
      }
      
      setIsAdmin(true);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut admin:', error);
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const handleImportExercises = async () => {
    Alert.alert(
      "Importer les exercices",
      "Voulez-vous importer les exercices prédéfinis dans Firestore ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Importer", 
          style: "default",
          onPress: async () => {
            setIsImporting(true);
            try {
              const savedIds = await saveExercisesToFirestore();
              Alert.alert(
                "Importation réussie",
                `${savedIds.length} exercices ont été importés avec succès.`,
                [{ text: "OK" }]
              );
            } catch (error: any) {
              console.error('Erreur lors de l\'importation:', error);
              Alert.alert(
                "Erreur d'importation",
                `Une erreur est survenue lors de l'importation des exercices: ${error?.message || 'Erreur inconnue'}`,
                [{ text: "OK" }]
              );
            } finally {
              setIsImporting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>Page d'administration</Text>
      <Text style={[styles.subtitle, { color: themeColors.text }]}>
        Importer des exercices
      </Text>
      <TouchableOpacity
          style={[styles.importButton, { backgroundColor: themeColors.primary }]}
          onPress={handleImportExercises}
          disabled={isImporting}
        >
          {isImporting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.importButtonText}>
              Importer les exercices
            </Text>
          )}
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'left',
  },
  importButton: {
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  importButtonText: {
    color: '#ffffff',
    textAlign: 'center',
  },
}); 