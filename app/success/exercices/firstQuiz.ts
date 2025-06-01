import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const checkFirstQuiz = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const profile = userData.profile || {};
    const completedExercises = profile.completedExercises || {};

    // Vérifier si l'utilisateur a au moins un exercice complété
    const hasCompletedExercise = Object.keys(completedExercises).length > 0;

    return hasCompletedExercise ? 1 : 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du premier QCM:', error);
    return 0;
  }
}; 