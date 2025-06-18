import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/firebaseConfig';

// Configuration des notifications
export async function configureNotifications() {
  try {
    // Configurer le comportement des notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
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


export async function scheduleMotivationalNotifications(userId: string) {
  try {
    // Ne plus annuler toutes les notifications existantes ici
    // await Notifications.cancelAllScheduledNotificationsAsync();

    // Récupérer les paramètres de l'utilisateur
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const { motivationalFrequency, motivationalTime1, motivationalTime2 } = userData.settings || {};

    // Si les notifications motivantes sont désactivées, ne rien faire
    if (motivationalFrequency === 0) return;

    // Récupérer un message motivant aléatoire
    const motivationsRef = collection(db, 'dailyMotivation');
    const motivationsSnapshot = await getDocs(motivationsRef);
    const motivations = motivationsSnapshot.docs.map(doc => doc.data());
    
    if (motivations.length === 0) return;

    // Sélectionner un message aléatoire
    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];

    // Planifier la première notification
    if (motivationalTime1) {
      const [hours1, minutes1] = motivationalTime1.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours1, minutes1, 0, 0);

      // Si l'heure est déjà passée aujourd'hui, programmer pour demain
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        identifier: 'motivational-1', // identifiant unique
        content: {
          title: randomMotivation.title,
          body: randomMotivation.message,
          data: { type: 'motivational' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours1,
          minute: minutes1,
        },
      });
    }

    // Si la fréquence est de 2, planifier la deuxième notification
    if (motivationalFrequency === 2 && motivationalTime2) {
      const [hours2, minutes2] = motivationalTime2.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours2, minutes2, 0, 0);

      // Si l'heure est déjà passée aujourd'hui, programmer pour demain
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      // Sélectionner un autre message aléatoire pour la deuxième notification
      const randomMotivation2 = motivations[Math.floor(Math.random() * motivations.length)];

      await Notifications.scheduleNotificationAsync({
        identifier: 'motivational-2', // identifiant unique
        content: {
          title: randomMotivation2.title,
          body: randomMotivation2.message,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours2,
          minute: minutes2,
        },
      });
    }
  } catch (error) {
    console.error('Erreur lors de la planification des notifications motivantes:', error);
  }
}