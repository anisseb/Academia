import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuration des notifications
export async function configureNotifications() {
  try {
    // Configurer le comportement des notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permission refusée pour les notifications');
      return;
    }

    // Obtenir le token push
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: '05388435-4c2f-49e4-83a2-1ed0d62649b4'
    })).data;

    // Sauvegarder le token dans Firestore
    const user = getAuth().currentUser;
    if (user) {
      const userRef = doc(getFirestore(), 'users', user.uid);
      await updateDoc(userRef, {
        expoPushToken: token
      });
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (error) {
    console.error('Erreur lors de la configuration des notifications:', error);
  }
}

// Fonction pour envoyer une notification de demande d'ami
export async function sendFriendRequestNotification(friendId: string, username: string) {
  try {
    const db = getFirestore();
    const friendDoc = await getDoc(doc(db, 'users', friendId));
    
    if (!friendDoc.exists()) {
      console.log('Utilisateur non trouvé');
      return;
    }

    const friendData = friendDoc.data();
    const friendToken = friendData.expoPushToken;

    if (!friendToken) {
      console.log('Token de notification non trouvé pour l\'utilisateur');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nouvelle demande d\'ami',
        body: `${username} vous a envoyé une demande d\'ami`,
        data: { type: 'friend_request', friendId: getAuth().currentUser?.uid },
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
  }
} 