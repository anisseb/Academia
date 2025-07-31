import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../../firebaseConfig';
import { showAlert, showConfirmAlert } from '../utils/alerts';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const loadUserSettings = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setNotificationsEnabled(userData.notificationsEnabled || false);
        // Charger le thème depuis les paramètres
        if (userData.settings?.isDarkMode !== undefined) {
          if (userData.settings.isDarkMode !== isDarkMode) {
            toggleTheme();
          }
        }
      }
    }
  }, [isDarkMode, toggleTheme]);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  useFocusEffect(
    useCallback(() => {
      loadUserSettings();
    }, [loadUserSettings])
  );

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

  const handleThemeToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const user = auth.currentUser;
    if (user) {
      const newValue = !isDarkMode;
      toggleTheme();
      // Sauvegarder le nouveau thème dans Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.isDarkMode': newValue
      });
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du lien:', error);
      showAlert('Erreur', 'Impossible d\'ouvrir le lien');
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <TouchableOpacity
          style={[styles.notificationButton, { 
            backgroundColor: isDarkMode ? '#3d3d3d' : '#ffffff',
            borderColor: isDarkMode ? '#4d4d4d' : '#e0e0e0'
          }]}
          onPress={() => router.push('/(tabs)/settings/notifications')}
        >
          <View style={styles.notificationContent}>
            <View style={styles.notificationLeft}>
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={isDarkMode ? '#ffffff' : '#000000'} 
              />
              <Text style={[styles.notificationLabel, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Notifications
              </Text>
            </View>
            <View style={styles.notificationRight}>
              <Text style={[styles.notificationStatus, { 
                color: notificationsEnabled ? '#60a5fa' : '#ef4444',
                fontWeight: 'bold'
              }]}>
                {notificationsEnabled ? 'Activées' : 'Désactivées'}
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isDarkMode ? '#666666' : '#999999'} 
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Academia Réussite
        </Text>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => {
            router.push('/(tabs)/settings/subscriptions');
          }}
        >
          <View style={styles.viewContent}>
            <View style={styles.notificationLeft}>
              <Ionicons 
                name="wallet-outline" 
                size={24} 
                color={isDarkMode ? '#ffffff' : '#000000'} 
              />
              <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Abonnement
              </Text>
            </View>
            <Ionicons
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? '#666666' : '#999999'} 
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => {
            router.push('/(tabs)/settings/parrainage');
          }}
        >
          <View style={styles.viewContent}>
            <View style={styles.notificationLeft}>
              <Ionicons 
                name="people-outline" 
                size={24} 
                color={isDarkMode ? '#ffffff' : '#000000'} 
              />
              <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Parrainage
              </Text>
            </View>
            <Ionicons
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? '#666666' : '#999999'} 
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => {
            router.push('/(tabs)/settings/restore-purchase');
          }}
        >
          <View style={styles.viewContent}>
            <View style={styles.notificationLeft}>
              <Ionicons 
                name="refresh-outline" 
                size={24} 
                color={isDarkMode ? '#ffffff' : '#000000'} 
              />
              <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Restaurer un achat
              </Text>
            </View>
            <Ionicons
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? '#666666' : '#999999'} 
            />
          </View>
        </TouchableOpacity>
      </View>

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
            onValueChange={handleThemeToggle}
            trackColor={{ false: '#767577', true: '#60a5fa' }}
            thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => router.push('/(tabs)/settings/accessibility')}
        >
          <View style={styles.viewContent}>
            <View style={styles.notificationLeft}>
              <Ionicons 
                name="accessibility-outline" 
                size={24} 
                color={isDarkMode ? '#ffffff' : '#000000'} 
              />
              <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Modules Accessibilité DYS
              </Text>
            </View>
            <Ionicons
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? '#666666' : '#999999'} 
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Feedback
        </Text>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => router.push('/(tabs)/feedback/satisfaction')}
        >
          <View style={styles.viewContent}>
            <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Enquêtes de satisfaction
            </Text>
            <Ionicons
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? '#666666' : '#999999'} 
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => {
            router.push('/(tabs)/feedback/bugs')
          }}
        >
          <View style={styles.viewContent}>
            <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Signalement de bugs
            </Text>
            <Ionicons
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? '#666666' : '#999999'} 
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => router.push('/(tabs)/feedback/suggestions')}
        >
          <View style={styles.viewContent}>
            <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Suggestions d'amélioration
            </Text>
            <Ionicons
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? '#666666' : '#999999'} 
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Contact
        </Text>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => router.push('/(tabs)/feedback/contact-us')}
        >
          <View style={styles.viewContent}>
            <View style={styles.notificationLeft}>
              <Ionicons 
                name="mail-outline" 
                size={24} 
                color={isDarkMode ? '#ffffff' : '#000000'} 
              />
              <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Contactez-nous
              </Text>
            </View>
            <Ionicons
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? '#666666' : '#999999'} 
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Conditions d'utilisation
        </Text>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => handleOpenLink('https://academiaforkids.com/fr/cgu/')}
        >
          <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Conditions générales d'utilisation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.feedbackItem, { borderBottomColor: isDarkMode ? '#333333' : '#e0e0e0' }]}
          onPress={() => handleOpenLink('https://academiaforkids.com/fr/politique-de-confidentialite-academia/')}
        >
          <Text style={[styles.feedbackText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Politique de confidentialité
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
    </ScrollView>
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
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  feedbackItem: {
    paddingVertical: 12,
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
  notificationButton: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  viewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  abonnementContent:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  notificationStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  abonnementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
  },
  abonnementLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});