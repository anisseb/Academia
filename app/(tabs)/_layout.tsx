import { Stack } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { Animated, Alert, Keyboard, Platform, AlertButton, PanResponder } from 'react-native';
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
import * as Haptics from 'expo-haptics';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../../firebaseConfig';

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
            
            try {
              // Supprimer tous les fichiers dans le dossier du thread
              const storageRef = ref(storage, `threads/${auth.currentUser.uid}/${thread.id}`);
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
              // Si le dossier n'existe pas ou s'il y a une erreur, on continue quand même
              console.log('Aucun fichier à supprimer dans le storage:', storageError);
            }
            
            // Supprimer le thread dans Firestore
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

const MenuButton = ({ onPress, color }: { onPress: () => void, color: string }) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={styles.menuButton}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Feather name="menu" size={24} color={color} />
    </TouchableOpacity>
  );
};

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export const setSuccessStats = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const currentDate = new Date();
    const currentWeek = currentDate.getFullYear() + '-' + getWeekNumber(currentDate);
    
    // Vérifier si l'utilisateur a déjà consulté les stats cette semaine
    const progressionViews = userData.progressionViews || {};
    if (progressionViews[currentWeek]) return;

    // Enregistrer la consultation de cette semaine
    await updateDoc(doc(db, 'users', user.uid), {
      [`success.progressionViews.${currentWeek}`]: currentDate.getTime()
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des statistiques:', error);
  }
};

export default function TabLayout() {
  const { isDarkMode } = useTheme();
  const [showSidebar, setShowSidebar] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gestureState) => {
        return gestureState.x0 < 20;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 5 && Math.abs(gestureState.dy) < 10 && gestureState.x0 < 20;
      },
      onPanResponderMove: (_, gestureState) => {
        const multiplier = Platform.OS === 'ios' ? 1.5 : 1;
        const newX = Math.min(Math.max(gestureState.dx * multiplier, 0), 320);
        slideAnim.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = Platform.OS === 'ios' ? 50 : 100;
        if (gestureState.dx > threshold) {
          setShowSidebar(true);
          Animated.spring(slideAnim, {
            toValue: 320,
            useNativeDriver: true,
            friction: 20,
            tension: 70,
          }).start(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          });
        } else {
          setShowSidebar(false);
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 20,
            tension: 70,
          }).start(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          });
        }
      },
    })
  ).current;

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
    const toValue = showSidebar ? 0 : 320;
    setShowSidebar(!showSidebar);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      friction: 20,
      tension: 70,
    }).start();
  };

  const handleMenuPress = () => {
    toggleSidebar();
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
            aiProfile: 'professeur',
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
      <Animated.View 
        style={[
          styles.mainContent,
          {
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
      <Stack
        screenOptions={{
            headerLeft: () => <MenuButton onPress={handleMenuPress} color={themeColors.icon} />,
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTintColor: themeColors.text,
          animation: 'simple_push',
            gestureEnabled: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: '',
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
            name="camera"
            options={{
              headerShown: false,
              animation: 'slide_from_left',
              presentation: 'fullScreenModal',
              contentStyle: { backgroundColor: '#000' },
              gestureEnabled: false
            }}
          />
        <Stack.Screen
          name="profile"
          options={{
            title: '',
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
          name="statistiques"
          options={{
            title: '',
          }}
        />

        <Stack.Screen
          name="favoris"
          options={{
            title: 'Favoris',
          }}
        />

        <Stack.Screen
          name="avatar"
          options={{
            title: '',
          }}
        />

        <Stack.Screen
          name="amis"
          options={{
            title: 'Amis',
          }}
        />

        <Stack.Screen
          name="success"
          options={{
            title: '',
          }}
        />
      </Stack>
      </Animated.View>

      {showSidebar && (
        <Pressable 
          style={styles.overlay} 
          onPress={() => {
            setShowSidebar(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              friction: 20,
              tension: 70,
            }).start();
          }}
        />
      )}

      <View 
        style={styles.gestureArea}
        {...panResponder.panHandlers}
      />

      <Animated.View 
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim.interpolate({
              inputRange: [0, 320],
              outputRange: [-320, 0]
            })}],
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
            <Feather name="home" size={20} color={themeColors.icon} />
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationItem}
            onPress={() => {
              router.push('/(tabs)/statistiques');
              toggleSidebar();
              setSuccessStats();
            }}
          >
            <Feather name="pie-chart" size={20} color={themeColors.icon} />
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Statistiques</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationItem}
            onPress={() => {
              router.push('/(tabs)/classement');
              toggleSidebar();
            }}
          >
            <Feather name="bar-chart-2" size={20} color={themeColors.icon} />
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Classement</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationItem}
            onPress={() => {
              router.push('/(tabs)/success');
              toggleSidebar();
            }}
          >
            <Feather name="award" size={20} color={themeColors.icon} />
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Succès</Text>
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
              router.push('/(tabs)/entrainement');
              toggleSidebar();
            }}
          >
            <Feather name="target" size={20} color={themeColors.icon} />
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Entrainement</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navigationItem}
            onPress={() => {
              router.push('/(tabs)/favoris');
              toggleSidebar();
            }}
          >
            <Feather name="star" size={20} color={themeColors.icon} />
            <Text style={[styles.navigationText, { color: themeColors.text }]}>Favoris</Text>
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
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  gestureArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 2,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    borderRightWidth: 1,
    zIndex: 3,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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