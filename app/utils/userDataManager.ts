import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_USER_KEY = '@offline_user';
const OFFLINE_FAVORITES_KEY = '@offline_favorites';
const OFFLINE_SUBJECT_CONFIGS_KEY = '@offline_subject_configs';

interface UserData {
  profile?: {
    schoolType?: string;
    class?: string;
  };
  favorites?: any[];
}

export const loadUserData = async (): Promise<UserData | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected;

    if (!isOnline) {
      // Charger depuis AsyncStorage en mode hors ligne
      const savedUserData = await AsyncStorage.getItem(OFFLINE_USER_KEY);
      if (savedUserData) {
        return JSON.parse(savedUserData);
      }
      return null;
    }

    // Charger depuis Firestore en mode en ligne
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    
    // Sauvegarder les données pour le mode hors ligne
    await saveUserData(userData);
    
    return userData;
  } catch (error) {
    console.error('Erreur lors du chargement des données utilisateur:', error);
    // En cas d'erreur, essayer de charger depuis AsyncStorage
    const savedUserData = await AsyncStorage.getItem(OFFLINE_USER_KEY);
    if (savedUserData) {
      return JSON.parse(savedUserData);
    }
    return null;
  }
};

export const saveUserData = async (userData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données utilisateur:', error);
  }
};

export const saveFavorites = async (favorites: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(OFFLINE_FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des favoris:', error);
  }
};

export const loadFavorites = async (): Promise<any> => {
  try {
    const savedFavorites = await AsyncStorage.getItem(OFFLINE_FAVORITES_KEY);
    return savedFavorites ? JSON.parse(savedFavorites) : null;
  } catch (error) {
    console.error('Erreur lors du chargement des favoris:', error);
    return null;
  }
};

export const saveSubjectConfigs = async (configs: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(OFFLINE_SUBJECT_CONFIGS_KEY, JSON.stringify(configs));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des configurations des matières:', error);
  }
};

export const loadSubjectConfigs = async (): Promise<any> => {
  try {
    const savedConfigs = await AsyncStorage.getItem(OFFLINE_SUBJECT_CONFIGS_KEY);
    return savedConfigs ? JSON.parse(savedConfigs) : null;
  } catch (error) {
    console.error('Erreur lors du chargement des configurations des matières:', error);
    return null;
  }
}; 