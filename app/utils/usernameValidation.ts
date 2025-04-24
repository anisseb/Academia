import { FORBIDDEN_USERNAMES, USERNAME_ERRORS, USERNAME_REGEX } from '../constants/forbiddenUsernames';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const isUsernameForbidden = (username: string): boolean => {
  if (!username) return false;
  
  const lowerValue = username.toLowerCase();
  return FORBIDDEN_USERNAMES.some(forbidden => lowerValue.includes(forbidden));
};

export const validateUsername = async (
  username: string,
  currentUsername?: string
): Promise<{ isValid: boolean; error?: string }> => {
  // Vérification de base
  if (!username.trim()) {
    return { isValid: false, error: USERNAME_ERRORS.TOO_SHORT };
  }

  if (username.length < 3) {
    return { isValid: false, error: USERNAME_ERRORS.TOO_SHORT };
  }

  if (username.length > 20) {
    return { isValid: false, error: USERNAME_ERRORS.TOO_LONG };
  }

  if (!USERNAME_REGEX.test(username)) {
    return { isValid: false, error: USERNAME_ERRORS.INVALID_CHARS };
  }

  // Vérification des mots interdits
  if (isUsernameForbidden(username)) {
    return { isValid: false, error: USERNAME_ERRORS.FORBIDDEN };
  }

  // Vérification de l'existence dans la base de données
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('profile.username', '==', username));
    const querySnapshot = await getDocs(q);
    
    // Si c'est le même pseudo que l'utilisateur actuel, on l'autorise
    if (currentUsername && username === currentUsername) {
      return { isValid: true };
    }
    
    if (!querySnapshot.empty) {
      return { isValid: false, error: USERNAME_ERRORS.ALREADY_EXISTS };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Erreur lors de la vérification du pseudo:', error);
    return { isValid: false, error: 'Une erreur est survenue lors de la vérification du pseudo' };
  }
}; 