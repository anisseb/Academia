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
      return;
    }

    const friendData = friendDoc.data();
    const friendToken = friendData.expoPushToken;

    if (!friendToken) {
      return;
    }

    const message = {
      to: friendToken,
      sound: 'notif.wav',
      title: 'Nouvelle demande d\'ami',
      body: `${username} vous a envoyé une demande d\'ami`,
      data: { type: 'friend_request', friendId: friendId },
      android: {
        icon: './assets/images/icon.png',
        color: '#231f70',
        sound: './assets/sounds/notif.wav',
        channelId: 'default'
      },
      ios: {
        sound: './assets/sounds/notif.wav'
      }
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
  }
} 