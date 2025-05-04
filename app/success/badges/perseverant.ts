import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkPerseverant = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const completedExercises = userData.completedExercises || {};
    
    // Vérifier si un exercice a été réessayé 3 fois avant d'être réussi
    let hasPersevered = 0;
    Object.values(completedExercises).forEach((exercise: any) => {
      if (exercise.attempts && exercise.attempts >= 3) {
        hasPersevered = 1;
      }
    });

    return hasPersevered;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Persévérant:', error);
    return 0;
  }
}; 