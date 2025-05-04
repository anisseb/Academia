import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const checkScholar = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const success = userData.success || {};
    const cours = success.cours || {};

    // Compter le nombre total de cours ouverts
    const totalCoursesOpened = Object.keys(cours).length;

    return Math.min(totalCoursesOpened, 10);
  } catch (error) {
    console.error('Erreur lors de la vérification du savant en herbe:', error);
    return 0;
  }
}; 