import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const checkPerfectionist = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const profile = userData.profile || {};
    const completedExercises = profile.completedExercises || {};

    // Vérifier si l'utilisateur a obtenu 100% à au moins un exercice
    let hasPerfectScore = false;
    
    Object.values(completedExercises).forEach((exercise: any) => {
      if (exercise.done && exercise.score === 100) {
        hasPerfectScore = true;
      }
    });

    return hasPerfectScore ? 1 : 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du perfectionniste:', error);
    return 0;
  }
}; 