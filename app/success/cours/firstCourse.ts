import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const checkFirstCourse = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const success = userData.success || {};
    const cours = success.cours || {};

    // Vérifier si l'objet cours contient au moins une entrée
    return Object.keys(cours).length >= 1 ? 1 : 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du premier cours:', error);
    return 0;
  }
};