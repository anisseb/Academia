import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { configureNotifications } from '../utils/notifications';
import * as Haptics from 'expo-haptics';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../../firebaseConfig';
import { showAlert, showConfirmAlert } from '../utils/alerts';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const loadNotificationPreferences = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setNotificationsEnabled(userDoc.data().notificationsEnabled || false);
        }
      }
    };
    loadNotificationPreferences();
  }, []);

  const toggleNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const user = auth.currentUser;
    if (user) {
      const newValue = !notificationsEnabled;
      if (newValue) {
        await configureNotifications();
      }
      setNotificationsEnabled(newValue);
      await updateDoc(doc(db, 'users', user.uid), {
        notificationsEnabled: newValue
      });
    }
  };

  const handleDeleteAccount = async () => {
    showConfirmAlert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données.',
      async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;

          // Supprimer tous les fichiers dans le storage
          try {
            const storageRef = ref(storage, `threads/${user.uid}`);
            const listResult = await listAll(storageRef);
            
            // Supprimer tous les fichiers dans le dossier
            const deletePromises = listResult.items.map(item => deleteObject(item));
            await Promise.all(deletePromises);
            
            // Supprimer tous les sous-dossiers et leurs fichiers
            for (const prefix of listResult.prefixes) {
              const subFolderRef = ref(storage, prefix.fullPath);
              const subFolderList = await listAll(subFolderRef);
              const subFolderDeletePromises = subFolderList.items.map(item => deleteObject(item));
              await Promise.all(subFolderDeletePromises);
            }
          } catch (storageError) {
            console.log('Erreur lors de la suppression des fichiers:', storageError);
          }

          // Supprimer le document utilisateur dans Firestore
          await deleteDoc(doc(db, 'users', user.uid));

          // Supprimer le compte utilisateur
          await user.delete();

          // Rediriger vers la page d'authentification
          router.replace('/auth');
        } catch (error) {
          console.error('Erreur lors de la suppression du compte:', error);
          showAlert('Erreur', 'Impossible de supprimer le compte');
        }
      }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Apparence
        </Text>
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Mode sombre
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#60a5fa' }}
            thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Notifications
        </Text>
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Activer les notifications
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#767577', true: '#60a5fa' }}
            thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Feedback
        </Text>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => router.push('/(tabs)/feedback/satisfaction')}
        >
          <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Enquêtes de satisfaction
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => {
            router.push('/(tabs)/feedback/bugs')
          }}
        >
          <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Signalement de bugs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => router.push('/(tabs)/feedback/suggestions')}
        >
          <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Suggestions d'amélioration
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Compte
        </Text>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: isDarkMode ? '#ef4444' : '#dc2626' }]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  feedbackItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  feedbackText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});