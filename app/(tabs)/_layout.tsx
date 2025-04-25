import { Stack } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { Animated, Alert, Keyboard, Platform, AlertButton } from 'react-native';
import { StyleSheet, Pressable, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { onSnapshot, doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { showAlert, showConfirmAlert } from '../utils/alerts';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

type Thread = {
  id: string;
  title: string;
  timestamp: Date;
};

const ThreadItem = ({ thread, isActive, onPress, onTitleChange }: {
  thread: Thread;
  isActive: boolean;
  onPress: () => void;
  onTitleChange: (newTitle: string) => void;
}) => {
  const { isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(thread.title);

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    activeBackground: isDarkMode ? '#2d2d2d' : '#e5e7eb',
    icon: isDarkMode ? '#666666' : '#666666',
    inputBackground: isDarkMode ? '#2a2a2a' : '#ffffff',
    inputBorder: isDarkMode ? '#60a5fa' : '#60a5fa',
    deleteIcon: '#ef4444',
  };

  const handleCancelEdit = () => {
    setEditedTitle(thread.title);
    setIsEditing(false);
  };

  const handleSaveTitle = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`threads.${thread.id}.title`]: editedTitle,
        [`threads.${thread.id}.lastUpdated`]: new Date()
      });
      setIsEditing(false);
      onTitleChange(editedTitle);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du titre:', error);
      showAlert('Erreur', 'Impossible de mettre à jour le titre');
    }
  };

  const handleDeleteThread = async () => {
    showConfirmAlert(
      'Supprimer la conversation',
      'Êtes-vous sûr de vouloir supprimer cette conversation ?',
      async () => {
        try {
          if (auth.currentUser) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
              [`threads.${thread.id}`]: deleteField()
            });
            
            // Si la conversation supprimée est celle actuellement affichée, rediriger vers la page d'accueil
            router.replace('/(tabs)');
          }
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          showAlert('Erreur', 'Impossible de supprimer la conversation');
        }
      }
    );
  };

  return (
    <View style={[
      styles.threadItem,
      isActive && [styles.activeThreadItem, { backgroundColor: themeColors.activeBackground }]
    ]}>
      <TouchableOpacity 
        style={styles.threadItemContent} 
        onPress={onPress}
      >
        <Feather name="message-circle" size={16} color={themeColors.icon} />
        {isEditing ? (
          <View style={styles.titleEditContainer}>
            <TextInput
              style={[
                styles.titleInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.inputBackground,
                  borderBottomColor: themeColors.inputBorder,
                }
              ]}
              value={editedTitle}
              onChangeText={setEditedTitle}
              autoFocus
              placeholder="Nom de la conversation"
              placeholderTextColor={themeColors.icon}
            />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
                <Feather name="x" size={16} color={themeColors.deleteIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveTitle} style={styles.saveButton}>
                <Feather name="check" size={16} color={themeColors.inputBorder} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.titleContainer}>
            <Text style={[styles.threadTitle, { color: themeColors.text }]} numberOfLines={1}>
              {thread.title || 'Nouvelle conversation'}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                onPress={() => {
                  setEditedTitle(thread.title);
                  setIsEditing(true);
                }}
                style={styles.editButton}
              >
                <Feather name="edit-2" size={14} color={themeColors.icon} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDeleteThread}
                style={styles.deleteButton}
              >
                <Feather name="trash-2" size={14} color={themeColors.deleteIcon} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function TabLayout() {
  const { isDarkMode } = useTheme();
  const [showSidebar, setShowSidebar] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const { threadId } = useLocalSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const auth = getAuth();
  const db = getFirestore();

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    border: isDarkMode ? '#333333' : '#e0e0e0',
    icon: isDarkMode ? '#ffffff' : '#000000',
    sidebarBackground: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    threadBackground: isDarkMode ? '#2d2d2d' : '#e5e7eb',
    inputBackground: isDarkMode ? '#2a2a2a' : '#ffffff',
    placeholder: isDarkMode ? '#666666' : '#999999',
  };

  // Mettre à jour activeThreadId quand threadId change
  useEffect(() => {
    if (threadId) {
      setActiveThreadId(threadId as string);
    } else {
      setActiveThreadId(null);
    }
  }, [threadId]);

  // Charger les threads depuis Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const threads = data.threads || {};
        const threadsList = Object.entries(threads).map(([id, thread]: [string, any]) => ({
          id,
          title: thread.title || 'Nouvelle conversation',
          timestamp: thread.timestamp?.toDate() || new Date(),
        })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setThreads(threadsList);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      const data = doc.data();
      if (data?.pendingRequests) {
        setPendingRequests(data.pendingRequests.length);
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser, pendingRequests]);

  const toggleSidebar = () => {
    Keyboard.dismiss(); // Ferme le clavier
    const toValue = showSidebar ? -320 : 0;
    setShowSidebar(!showSidebar);
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      friction: 20,
      tension: 70,
    }).start();
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const createNewThread = async () => {
    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        if (!userData) {
          showAlert('Erreur', 'Données utilisateur non trouvées');
          return;
        }
        
        const threads = userData.threads || {};
        const newThreadId = `thread_${Date.now()}`;
        
        await updateDoc(userRef, {
          [`threads.${newThreadId}`]: {
            title: 'Nouvelle conversation',
            timestamp: new Date(),
            messages: []
          }
        });
        
        // Fermer la navigation avant de rediriger
        toggleSidebar();
        
        router.push({
          pathname: '/(tabs)/history',
          params: { threadId: newThreadId }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création d\'un nouveau fil:', error);
      showAlert('Erreur', 'Impossible de créer une nouvelle conversation');
    }
  };

  const handleSaveTitle = async (threadId: string, newTitle: string) => {
    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          [`threads.${threadId}.title`]: newTitle
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du titre:', error);
      showAlert('Erreur', 'Impossible de mettre à jour le titre');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Stack
        screenOptions={{
          headerLeft: () => (
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Feather name="menu" size={24} color={themeColors.icon} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTintColor: themeColors.text,
          animation: 'simple_push',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Statistiques',
          }}
        />
        <Stack.Screen 
          name="history" 
          options={({ route }) => {
            const params = route.params as { threadId?: string };
            const thread = threads.find(t => t.id === params?.threadId);
            return {
              title: thread?.title || 'Nouvelle conversation',
            };
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Profil',
          }}
        />
        <Stack.Screen name="settings" options={{ title: 'Paramètres' }} />
        {isAdmin && (
          <Stack.Screen name="admin" options={{ title: 'Admin' }} />
        )}
        <Stack.Screen
          name="entrainement"
          options={{
            title: 'Entraînement',
          }}
        />

        <Stack.Screen
          name="classement"
          options={{
            title: 'Classement',
          }}
        />

        <Stack.Screen
          name="amis"
          options={{
            title: 'Amis',
          }}
        />
      </Stack>

      {showSidebar && (
        <Pressable style={styles.overlay} onPress={toggleSidebar} />
      )}

      <Animated.View 
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            backgroundColor: themeColors.sidebarBackground,
            borderRightColor: themeColors.border,
          }
        ]}
      >
        <View style={[styles.profileSection, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => {
              router.push('/(tabs)/profile');
              toggleSidebar();
            }}
          >
            <Feather name="user" size={24} color={themeColors.icon} />
            <Text style={[styles.profileText, { color: themeColors.text }]}>Profil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navigationSection}>
          <TouchableOpacity 
            style={styles.navigationItem}
            onPress={() => {
              router.push('/(tabs)');
              toggleSidebar();
            }}
          >
            <Feather name="pie-chart" size={20} color={themeColors.icon} />
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Statistiques</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationItem}
            onPress={() => {
              router.push('/(tabs)/avatar');
              toggleSidebar();
            }}
          >
            <Feather name="smile" size={20} color={themeColors.icon} />
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Avatar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationItem}
            onPress={() => {
              router.push('/(tabs)/amis');
              toggleSidebar();
            }}
          >
            <View style={styles.navigationIconContainer}>
            <Feather name="users" size={20} color={themeColors.icon} />
              {pendingRequests > 0 && (
                <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.badgeText}>{pendingRequests}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Amis</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationItem}
            onPress={() => {
              router.push('/(tabs)/classement');
              toggleSidebar();
            }}
          >
            <Feather name="award" size={20} color={themeColors.icon} />
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Classement</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationItem}
            onPress={() => {
              router.push('/(tabs)/entrainement');
              toggleSidebar();
            }}
          >
            <Feather name="target" size={20} color={themeColors.icon} />
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Entrainement</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.newThreadButton}
            onPress={createNewThread}
          >
            <Feather name="plus" size={20} color="white" />
            <Text style={styles.newThreadButtonText}>Nouvelle conversation</Text>
          </TouchableOpacity>

          <View style={styles.threadsContainer}>
            <ScrollView style={styles.threadsList}>
              {threads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={activeThreadId === thread.id}
                  onPress={() => {
                    setActiveThreadId(thread.id);
                    router.push({
                      pathname: '/(tabs)/history',
                      params: { threadId: thread.id }
                    });
                    toggleSidebar();
                  }}
                  onTitleChange={(newTitle) => {
                    handleSaveTitle(thread.id, newTitle);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={[styles.sidebarFooter, { borderTopColor: themeColors.border }]}>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.footerButton}
            onPress={() => {
              router.push('/(tabs)/admin');
              toggleSidebar();
            }}
          >
            <Feather name="users" size={20} color={themeColors.icon} />
            <Text style={[styles.footerButtonText, { color: themeColors.text }]}>Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => {
              router.push('/(tabs)/settings');
              toggleSidebar();
            }}
          >
            <Feather name="settings" size={20} color={themeColors.icon} />
            <Text style={[styles.footerButtonText, { color: themeColors.text }]}>Paramètres</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} onPress={handleLogout}>
            <Feather name="log-out" size={20} color={themeColors.icon} />
            <Text style={[styles.footerButtonText, { color: themeColors.text }]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    borderRightWidth: 1,
    zIndex: 2,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  menuButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  profileSection: {
    padding: 20,
    borderBottomWidth: 1,
    marginTop: 50,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  navigationSection: {
    flex: 1,
    paddingVertical: 15,
  },
  navigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 12,
  },
  navigationText: {
    fontSize: 16,
    marginLeft: 10,
  },
  separator: {
    height: 1,
    marginVertical: 10,
    marginHorizontal: 15,
  },
  newThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#60a5fa',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  newThreadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  threadsContainer: {
    flex: 1,
    maxHeight: '50%',
  },
  threadsList: {
    paddingHorizontal: 15,
    ...Platform.select({
      web: {
        overflowY: 'auto',
      },
      default: {
        overflow: 'hidden',
      }
    }),
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 2,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  threadItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  titleInput: {
    flex: 1,
    fontSize: 14,
    padding: 4,
    borderBottomWidth: 1,
  },
  saveButton: {
    padding: 4,
    marginLeft: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  threadTitle: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
  activeThreadItem: {
    backgroundColor: '#2d2d2d',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    padding: 4,
    marginLeft: 8,
  },
  sidebarFooter: {
    padding: 15,
    marginTop: 'auto',
    borderTopWidth: 1,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  footerButtonText: {
    fontSize: 14,
    marginLeft: 10,
  },
  navigationIconContainer: {
    position: 'relative',
    width: 20,
    height: 20,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});