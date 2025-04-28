import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  query as firestoreQuery, 
  where, 
  getDocs, 
  DocumentData,
  Query
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { parseGradient } from '../utils/gradientUtils';
import { showConfirmAlert } from '../utils/alerts';
import { sendFriendRequestNotification } from '../utils/notifications';

interface Friend {
  id: string;
  username: string;
  name: string;
  status: 'accepted' | 'pending' | 'sent' | 'search';
  key: string;
}

export default function AmisScreen() {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
    inputBackground: isDarkMode ? '#2d2d2d' : '#f5f5f5',
  };

  const loadFriends = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const friendsList = userData.friends || [];
      const pendingList = userData.pendingRequests || [];
      const sentList = userData.sentRequests || [];

      // Charger les détails des amis
      const friendsDetails = await Promise.all(
        friendsList.map(async (friendId: string) => {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            return {
              id: friendId,
              username: friendData.profile.username,
              name: friendData.profile.name,
              status: 'accepted' as const,
              key: `friend-${friendId}`
            };
          }
          return null;
        })
      );

      // Charger les détails des demandes en attente
      const pendingDetails = await Promise.all(
        pendingList.map(async (friendId: string) => {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            return {
              id: friendId,
              username: friendData.profile.username,
              name: friendData.profile.name,
              status: 'pending' as const,
              key: `pending-${friendId}`
            };
          }
          return null;
        })
      );

      // Charger les détails des demandes envoyées
      const sentDetails = await Promise.all(
        sentList.map(async (friendId: string) => {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            return {
              id: friendId,
              username: friendData.profile.username,
              name: friendData.profile.name,
              status: 'sent' as const,
              key: `sent-${friendId}`
            };
          }
          return null;
        })
      );

      setFriends(friendsDetails.filter(Boolean) as Friend[]);
      setPendingRequests(pendingDetails.filter(Boolean) as Friend[]);
      setSentRequests(sentDetails.filter(Boolean) as Friend[]);
    } catch (error) {
      console.error('Erreur lors du chargement des amis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [friends, pendingRequests, sentRequests]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q: Query = firestoreQuery(
        usersRef,
        where('profile.username', '>=', query.toLowerCase()),
        where('profile.username', '<=', query.toLowerCase() + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      
      const results = querySnapshot.docs
        .filter(doc => doc.id !== auth.currentUser?.uid)
        .map(doc => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            username: data.profile.username,
            name: data.profile.name,
            status: 'search' as const,
            key: `search-${doc.id}`
          };
        });

      setSearchResults(results);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsSearching(true);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      performSearch(text);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const sendFriendRequest = async (friendId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendId);

      // Récupérer les informations de l'utilisateur
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const username = userData?.profile?.username || 'Un utilisateur';

      // Récupérer les informations de l'ami
      const friendDoc = await getDoc(friendRef);
      if (!friendDoc.exists()) {
        console.error('Utilisateur non trouvé');
        return;
      }
      const friendData = friendDoc.data();

      // Vérifier si la demande n'a pas déjà été envoyée dans l'état local
      const isAlreadySent = sentRequests.some(request => request.id === friendId);
      if (isAlreadySent) {
        console.log('Demande déjà envoyée dans l\'état local');
        return;
      }

      // Vérifier si la demande n'a pas déjà été envoyée dans Firestore
      const sentRequestsInFirestore = userData?.sentRequests || [];
      if (sentRequestsInFirestore.includes(friendId)) {
        console.log('Demande déjà envoyée dans Firestore');
        return;
      }

      // Mettre à jour l'état local immédiatement
      setSentRequests(prev => {
        // Vérifier à nouveau pour éviter les doublons pendant la mise à jour
        if (prev.some(request => request.id === friendId)) {
          return prev;
        }
        return [...prev, {
          id: friendId,
          username: friendData.profile.username,
          name: friendData.profile.name,
          status: 'sent',
          key: `sent-${friendId}-${Date.now()}`
        }];
      });

      // Ajouter à mes demandes envoyées dans Firestore
      await updateDoc(userRef, {
        sentRequests: arrayUnion(friendId)
      });

      // Ajouter à la liste des demandes en attente de l'ami
      await updateDoc(friendRef, {
        pendingRequests: arrayUnion(user.uid)
      });

      // Envoyer la notification
      await sendFriendRequestNotification(friendId, username);

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
    }
  };

  const acceptFriendRequest = async (friendId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendId);

      // Ajouter l'ami à ma liste d'amis
      await updateDoc(userRef, {
        friends: arrayUnion(friendId),
        pendingRequests: arrayRemove(friendId)
      });

      // Ajouter à la liste d'amis de l'ami
      await updateDoc(friendRef, {
        friends: arrayUnion(user.uid),
        sentRequests: arrayRemove(user.uid)
      });

      // Mettre à jour l'état local
      const friendDoc = await getDoc(friendRef);
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        setFriends(prev => [...prev, {
          id: friendId,
          username: friendData.profile.username,
          name: friendData.profile.name,
          status: 'accepted',
          key: `friend-${friendId}`
        }]);
        setPendingRequests(prev => prev.filter(f => f.id !== friendId));
      }
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la demande:', error);
    }
  };

  const rejectFriendRequest = async (friendId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendId);

      // Supprimer de mes demandes en attente
      await updateDoc(userRef, {
        pendingRequests: arrayRemove(friendId)
      });

      // Supprimer des demandes envoyées de l'ami
      await updateDoc(friendRef, {
        sentRequests: arrayRemove(user.uid)
      });

      // Mettre à jour l'état local
      setPendingRequests(prev => prev.filter(f => f.id !== friendId));
    } catch (error) {
      console.error('Erreur lors du rejet de la demande:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    showConfirmAlert(
      'Supprimer un ami',
      'Êtes-vous sûr de vouloir supprimer cet ami ?',
      async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;

          const userRef = doc(db, 'users', user.uid);
          const friendRef = doc(db, 'users', friendId);

          // Supprimer l'ami de ma liste d'amis
          await updateDoc(userRef, {
            friends: arrayRemove(friendId)
          });

          // Me supprimer de la liste d'amis de l'ami
          await updateDoc(friendRef, {
            friends: arrayRemove(user.uid)
          });

          // Mettre à jour l'état local
          setFriends(prev => prev.filter(f => f.id !== friendId));
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'ami:', error);
        }
      }
    );
  };

  const cancelFriendRequest = async (friendId: string) => {
    showConfirmAlert(
      'Annuler la demande',
      'Êtes-vous sûr de vouloir annuler cette demande d\'ami ?',
      async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;

          const userRef = doc(db, 'users', user.uid);
          const friendRef = doc(db, 'users', friendId);

          // Supprimer de mes demandes envoyées
          await updateDoc(userRef, {
            sentRequests: arrayRemove(friendId)
          });

          // Supprimer des demandes en attente de l'ami
          await updateDoc(friendRef, {
            pendingRequests: arrayRemove(user.uid)
          });

          // Mettre à jour l'état local
          setSentRequests(prev => prev.filter(f => f.id !== friendId));
        } catch (error) {
          console.error('Erreur lors de l\'annulation de la demande:', error);
        }
      }
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={[styles.friendItem, { backgroundColor: themeColors.card }]}>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: themeColors.text }]}>{item.name}</Text>
        <Text style={[styles.friendUsername, { color: themeColors.text }]}>@{item.username}</Text>
      </View>
      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
            onPress={() => acceptFriendRequest(item.id)}
          >
            <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
            onPress={() => rejectFriendRequest(item.id)}
          >
            <MaterialCommunityIcons name="close" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
      {item.status === 'accepted' && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
          onPress={() => removeFriend(item.id)}
        >
          <MaterialCommunityIcons name="account-remove" size={20} color="#ffffff" />
        </TouchableOpacity>
      )}
      {item.status === 'sent' && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
          onPress={() => cancelFriendRequest(item.id)}
        >
          <MaterialCommunityIcons name="close" size={20} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSearchItem = ({ item }: { item: Friend }) => (
    <View style={[styles.friendItem, { backgroundColor: themeColors.card }]}>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: themeColors.text }]}>{item.name}</Text>
        <Text style={[styles.friendUsername, { color: themeColors.text }]}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: '#60a5fa' }]}
        onPress={() => sendFriendRequest(item.id)}
      >
        <MaterialCommunityIcons name="account-plus" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: themeColors.inputBackground }]}>
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          placeholder="Rechercher un ami..."
          placeholderTextColor={themeColors.text}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={themeColors.text} />
        ) : (
          <MaterialCommunityIcons name="magnify" size={24} color={themeColors.text} />
        )}
      </View>

      <ScrollView style={styles.content}>
        {searchResults.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Résultats de recherche</Text>
            <FlatList
              data={searchResults}
              renderItem={renderSearchItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        ) : searchQuery.length > 0 && !isSearching ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Aucun résultat trouvé</Text>
          </View>
        ) : (
          <>
            {friends.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Amis</Text>
                <FlatList
                  data={friends}
                  renderItem={renderFriendItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {pendingRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Demandes reçues</Text>
                <FlatList
                  data={pendingRequests}
                  renderItem={renderFriendItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {sentRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Demandes envoyées</Text>
                <FlatList
                  data={sentRequests}
                  renderItem={renderFriendItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  friendUsername: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
