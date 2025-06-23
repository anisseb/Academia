import { useState, useEffect } from 'react';
import { auth, validateSession, updateSessionToken, logoutOtherSessions } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

const SESSION_TOKEN_KEY = '@session_token';
const CHECK_INTERVAL = 10000; // Vérifier toutes les 10 secondes

export const useSession = () => {
  const [isValidating, setIsValidating] = useState(true);
  const router = useRouter();

  const handleSessionExpired = async () => {
    Alert.alert(
      "Session expirée",
      "Vous ne pouvez pas utiliser le même compte sur plusieurs appareils différents.",
      [{ 
        text: "OK",
        onPress: async () => {
          await auth.signOut();
          await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
          router.replace('/auth');
        }
      }]
    );
  };

  const validateUserSession = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setIsValidating(false);
        return;
      }

      // Récupérer le token stocké localement
      const localToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      
      if (!localToken) {
        // Si pas de token stocké, en créer un nouveau
        const newToken = await updateSessionToken(user.uid);
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, newToken);
      } else {
        // Vérifier si la session est toujours valide
        const storedToken = await validateSession(user.uid, localToken);
        
        if (!storedToken) {
          await handleSessionExpired();
        } else {
          // Vérifier si d'autres sessions ont été créées
          const wasLoggedOut = await logoutOtherSessions(user.uid, localToken);
          if (wasLoggedOut) {
            await handleSessionExpired();
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la validation de la session:', error);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    validateUserSession();

    // Vérification continue de la session
    const intervalId = setInterval(validateUserSession, CHECK_INTERVAL);

    // Écouter les changements d'état de l'authentification
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // À chaque connexion, mettre à jour le token
        const newToken = await updateSessionToken(user.uid);
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, newToken);
      } else {
        // À la déconnexion, supprimer le token
        await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      }
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  return { isValidating };
}; 