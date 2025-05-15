import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { 
  COURSE_PROGRESSION_ACHIEVEMENTS, 
  EXERCISE_ACHIEVEMENTS, 
  IA_ACHIEVEMENTS, 
  SPECIAL_BADGES_ACHIEVEMENTS 
} from '../constants/achievements';

import { getSchoolTypeName, getClasseName } from '../utils/getLabelFromData';

interface UserRanking {
  id: string;
  username: string;
  name: string;
  score: number;
  rank: number;
  schoolType?: string;
  class?: string;
  completedAchievements?: string[];
  displayedAchievements?: string[];
}

interface ExerciseData {
  completedAt: string;
  done: boolean;
  exerciceId: string;
  score: number;
}

interface Subject {
  id: string;
  label: string;
}

type TabType = 'global' | 'friends' | 'subject';

export default function ClassementScreen() {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState<UserRanking[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showPicker, setShowPicker] = useState(false);
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRanking | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [schoolTypeName, setSchoolTypeName] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
    tabActive: isDarkMode ? '#3b82f6' : '#2563eb',
    tabInactive: isDarkMode ? '#2d2d2d' : '#f5f5f5',
  };

  const medalColors = {
    gold: ['#FFD700', '#FFA500'] as const,
    silver: ['#C0C0C0', '#A9A9A9'] as const,
    bronze: ['#CD7F32', '#8B4513'] as const
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    mainTabsContainer: {
      flexDirection: 'row',
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    subjectsContainer: {
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      backgroundColor: themeColors.card,
      padding: 8,
      margin: 8,
      borderRadius: 8,
    },
    subjectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: themeColors.card,
    },
    subjectButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    pickerContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 1,
      backgroundColor: themeColors.card,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      marginTop: 4,
    },
    picker: {
      height: 200,
      color: themeColors.text,
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginHorizontal: 8,
      borderWidth: 1,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
    },
    listContainer: {
      padding: 16,
    },
    rankingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    rankContainer: {
      marginRight: 16,
    },
    rankBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '500',
    },
    username: {
      fontSize: 14,
      opacity: 0.7,
    },
    scoreContainer: {
      alignItems: 'flex-end',
    },
    score: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    scoreLabel: {
      fontSize: 12,
      opacity: 0.7,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userIcon: {
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    modalScrollView: {
      maxHeight: '80%',
    },
    modalItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    modalItemText: {
      fontSize: 16,
    },
    userPositionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
      alignSelf: 'flex-start',
      marginLeft: 8,
    },
    userPositionText: {
      color: '#ffffff',
      marginLeft: 8,
      fontWeight: '500',
    },
    paginationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    paginationButton: {
      padding: 8,
    },
    paginationText: {
      marginHorizontal: 16,
      fontSize: 16,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    emptyIcon: {
      marginBottom: 16,
      opacity: 0.7,
    },
    emptyText: {
      fontSize: 16,
      textAlign: 'center',
      opacity: 0.7,
    },
    userModalContent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: '80%',
      padding: 20,
    },
    userInfoSection: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      marginBottom: 3,
    },
    userInfoLabel: {
      fontSize: 14,
      opacity: 0.7,
      marginBottom: 8,
    },
    userInfoValue: {
      fontSize: 16,
      fontWeight: '500',
    },
    achievementsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 12,
    },
    achievementCard: {
      width: '48%',
      padding: 12,
      borderRadius: 12,
      borderWidth: 3,
      alignItems: 'center',
      backgroundColor: themeColors.card,
    },
    achievementImage: {
      width: 48,
      height: 48,
      marginBottom: 12,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    achievementIcon: {
      fontSize: 28,
      marginBottom: 12,
    },
    achievementTitle: {
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '500',
    },
    currentUserItem: {
      borderWidth: 2,
      borderColor: '#60a5fa',
      backgroundColor: 'rgba(96, 165, 250, 0.1)',
      borderRadius: 12,
    },
  });

  const calculateTotalScore = (profile: any, subjectId?: string): number => {
    let totalScore = 0;
    
    // Si une matière est sélectionnée, on ne compte que les exercices de cette matière
    if (subjectId) {
      Object.values(profile.exercises || {}).forEach((schoolType: any) => {
        Object.values(schoolType || {}).forEach((classData: any) => {
          // Vérifier si la matière existe dans cette classe
          if (classData[subjectId]) {
            Object.values(classData[subjectId] || {}).forEach((theme: any) => {
              Object.values(theme || {}).forEach((chapter: any) => {
                if (Array.isArray(chapter)) {
                  chapter.forEach((exercise: unknown) => {
                    const exerciseData = exercise as ExerciseData;
                    if (exerciseData.done) {
                      totalScore += exerciseData.score;
                    }
                  });
                }
              });
            });
          }
        });
      });
    } else {
      // Sinon, on compte tous les exercices
      Object.values(profile.exercises || {}).forEach((schoolType: any) => {
        Object.values(schoolType || {}).forEach((classData: any) => {
          Object.values(classData || {}).forEach((subject: any) => {
            Object.values(subject || {}).forEach((theme: any) => {
              Object.values(theme || {}).forEach((chapter: any) => {
                if (Array.isArray(chapter)) {
                  chapter.forEach((exercise: unknown) => {
                    const exerciseData = exercise as ExerciseData;
                    if (exerciseData.done) {
                      totalScore += exerciseData.score;
                    }
                  });
                }
              });
            });
          });
        });
      });
    }

    return totalScore;
  };

  const loadSubjects = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const userSchoolType = userData.profile?.schoolType;
      const academiaDoc = await getDoc(doc(db, 'academia', userSchoolType));
      
      //load la classe de l'utilisateur

      const userClass = userData.profile?.class;
      
      if (!userClass) {
          console.error('Classe de l\'utilisateur non trouvée');
          return;
      }

      const subjectsList: Subject[] = [];
      if (academiaDoc.exists()) {
        const academiaData = academiaDoc.data();
          // Vérifier que la structure des données est correcte
          if (!academiaData.classes || !academiaData.classes[userClass]) {
          console.error('Structure de données incorrecte pour la classe:', userClass);
          return;
          }

          // Parcourir les matières de la classe
          Object.entries(academiaData.classes[userClass].matieres || {}).forEach(([id, subject]: [string, any]) => {
          if (subject && subject.label) {
              subjectsList.push({
              id,
              label: subject.label,
              });
          }
          });
      }
      
      setSubjects(subjectsList);
      } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
      }
  };

  const loadFriends = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      setFriends(userData.friends || []);
    } catch (error) {
      console.error('Erreur lors du chargement des amis:', error);
    }
  };

  const loadRankings = async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);

      const rankings: UserRanking[] = [];
      const currentUserId = auth.currentUser?.uid;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.profile) {
          const totalScore = calculateTotalScore(data.profile, selectedSubject || undefined);
          
          if (activeTab === 'friends' && !friends.includes(doc.id) && doc.id !== currentUserId) return;
          
          rankings.push({
            id: doc.id,
            username: data.profile.username,
            name: data.profile.name,
            score: totalScore,
            rank: 0,
            schoolType: data.profile.schoolType,
            class: data.profile.class,
            completedAchievements: data.profile.completedAchievements || [],
            displayedAchievements: data.profile.displayedAchievements || [],
          });
        }
      });

      rankings.sort((a, b) => b.score - a.score);
      rankings.forEach((ranking, index) => {
        ranking.rank = index + 1;
        if (ranking.id === currentUserId) {
          setUserRank(index + 1);
        }
      });

      setUsers(rankings);
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToUserPosition = () => {
    if (userRank) {
      const page = Math.ceil(userRank / ITEMS_PER_PAGE);
      setCurrentPage(page);
      
      // Calculer l'index dans la page courante
      const indexInPage = (userRank - 1) % ITEMS_PER_PAGE;
      
      // Scroll vers l'index après un court délai pour laisser le temps au rendu
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: indexInPage,
          animated: true,
          viewPosition: 0.5
        });
      }, 100);
    }
  };

  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);

  useEffect(() => {
    loadSubjects();
    loadFriends();
  }, []);

  useEffect(() => {
    setLoading(true);
    loadRankings();
  }, [activeTab, selectedSubject]);

  useEffect(() => {
    const loadNames = async () => {
      if (selectedUser?.schoolType) {
        const schoolName = await getSchoolTypeName(selectedUser.schoolType);
        setSchoolTypeName(schoolName);
      }
      if (selectedUser?.schoolType && selectedUser?.class) {
        const classLabel = await getClasseName(selectedUser.schoolType, selectedUser.class);
        setClassName(classLabel);
      }
    };
    loadNames();
  }, [selectedUser]);

  const renderTab = (title: string, type: TabType) => (
    <TouchableOpacity
      style={[
        styles.tab,
        { 
          backgroundColor: activeTab === type ? themeColors.tabActive : themeColors.tabInactive,
          borderColor: themeColors.border,
        }
      ]}
      onPress={() => {
        setActiveTab(type);
      }}
    >
      <Text style={[
        styles.tabText,
        { color: activeTab === type ? '#ffffff' : themeColors.text }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderUserModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.userModalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Profil de {selectedUser.name}
              </Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.userInfoSection}>
                <Text style={[styles.userInfoLabel, { color: themeColors.text }]}>Pseudo</Text>
                <Text style={[styles.userInfoValue, { color: themeColors.text }]}>
                  @{selectedUser.username}
                </Text>
              </View>

              <View style={styles.userInfoSection}>
                <Text style={[styles.userInfoLabel, { color: themeColors.text }]}>Établissement</Text>
                <Text style={[styles.userInfoValue, { color: themeColors.text }]}>
                  {schoolTypeName || 'Non spécifié'}
                </Text>
              </View>

              <View style={styles.userInfoSection}>
                <Text style={[styles.userInfoLabel, { color: themeColors.text }]}>Classe</Text>
                <Text style={[styles.userInfoValue, { color: themeColors.text }]}>
                  {className || 'Non spécifiée'}
                </Text>
              </View>

              <View style={styles.userInfoSection}>
                <Text style={[styles.userInfoLabel, { color: themeColors.text }]}>Succès complétés</Text>
                <View style={styles.achievementsGrid}>
                  {selectedUser.completedAchievements
                    ?.filter(achievementId => selectedUser.displayedAchievements?.includes(achievementId))
                    .map((achievementId) => {
                    const achievement = [...COURSE_PROGRESSION_ACHIEVEMENTS, ...EXERCISE_ACHIEVEMENTS, ...IA_ACHIEVEMENTS, ...SPECIAL_BADGES_ACHIEVEMENTS]
                      .find(a => a.id === achievementId);
                    
                    if (!achievement) return null;

                    return (
                      <View key={achievementId} style={[styles.achievementCard, { borderColor: themeColors.border }]}>
                        {achievement.imagePath ? (
                          <Image
                            source={achievement.imagePath}
                            style={styles.achievementImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                        )}
                        <Text style={[styles.achievementTitle, { color: themeColors.text }]}>
                          {achievement.title}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderRankingItem = ({ item }: { item: UserRanking }) => {
    const isCurrentUser = item.id === auth.currentUser?.uid;
    
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedUser(item);
          setShowUserModal(true);
        }}
      >
        <View style={[
          styles.rankingItem, 
          { backgroundColor: themeColors.card },
          isCurrentUser && styles.currentUserItem
        ]}>
          <View style={styles.rankContainer}>
            {item.rank <= 3 ? (
              <LinearGradient
                colors={
                  item.rank === 1 ? medalColors.gold : 
                  item.rank === 2 ? medalColors.silver : 
                  medalColors.bronze
                }
                style={styles.rankBadge}
              >
                <Text style={styles.rankText}>{item.rank}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.rankBadge, { backgroundColor: themeColors.border }]}>
                <Text style={[styles.rankText, { color: themeColors.text }]}>{item.rank}</Text>
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameContainer}>
              <Text style={[styles.userName, { color: themeColors.text }]}>{item.name}</Text>
              {isCurrentUser && (
                <MaterialCommunityIcons 
                  name="account" 
                  size={16} 
                  color="#60a5fa" 
                  style={styles.userIcon}
                />
              )}
            </View>
            <Text style={[styles.username, { color: themeColors.text }]}>@{item.username}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.score, { color: themeColors.text }]}>{item.score}</Text>
            <Text style={[styles.scoreLabel, { color: themeColors.text }]}>points</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getSelectedSubjectLabel = () => {
    const subject = subjects.find(s => s.id === selectedSubject);
    return subject ? subject.label : 'Toutes les matières';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.mainTabsContainer}>
        {renderTab('Global', 'global')}
        {renderTab('Amis', 'friends')}
      </View>

      <View style={styles.subjectsContainer}>
        <TouchableOpacity
          style={[styles.subjectButton, { borderColor: themeColors.border }]}
          onPress={() => setShowPicker(true)}
        >
          <Text style={[styles.subjectButtonText, { color: themeColors.text }]}>
            {getSelectedSubjectLabel()}
          </Text>
          <MaterialCommunityIcons 
            name="chevron-down" 
            size={20} 
            color={themeColors.text} 
          />
        </TouchableOpacity>

        {activeTab === 'global' && userRank && (
          <TouchableOpacity
            style={[styles.userPositionButton, { backgroundColor: themeColors.tabActive }]}
            onPress={goToUserPosition}
          >
            <MaterialCommunityIcons name="account-search" size={20} color="#ffffff" />
            <Text style={styles.userPositionText}>Voir ma position ({userRank})</Text>
          </TouchableOpacity>
        )}

        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Sélectionner une matière</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={themeColors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: themeColors.border }]}
                  onPress={() => {
                    setSelectedSubject('');
                    setShowPicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: themeColors.text }]}>Toutes les matières</Text>
                </TouchableOpacity>
                {subjects.map(subject => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[styles.modalItem, { borderBottomColor: themeColors.border }]}
                    onPress={() => {
                      setSelectedSubject(subject.id);
                      setShowPicker(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: themeColors.text }]}>{subject.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>

      <FlatList
        ref={flatListRef}
        data={paginatedUsers}
        renderItem={renderRankingItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          activeTab === 'friends' && users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="emoticon-sad" 
                size={48} 
                color={themeColors.text} 
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: themeColors.text }]}>
                Vous n'avez pas d'amis
              </Text>
            </View>
          ) : null
        }
      />

      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color={themeColors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.paginationText, { color: themeColors.text }]}>
            Page {currentPage} sur {totalPages}
          </Text>
          
          <TouchableOpacity
            style={[styles.paginationButton, { opacity: currentPage === totalPages ? 0.5 : 1 }]}
            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <MaterialCommunityIcons name="chevron-right" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      )}
      {renderUserModal()}
    </View>
  );
}

