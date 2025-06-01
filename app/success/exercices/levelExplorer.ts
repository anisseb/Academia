import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const checkLevelExplorer = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const profile = userData.profile || {};
    const completedExercises = profile.completedExercises || {};

    // Ensemble pour stocker les niveaux de difficulté complétés
    const completedLevels = new Set<string>();
    
    // Parcourir les exercices complétés
    Object.values(completedExercises).forEach((exercise: any) => {
      if (exercise.done && exercise.difficulty) {
        completedLevels.add(exercise.difficulty);
      }
    });

    // Vérifier si l'utilisateur a complété les trois niveaux
    const hasEasy = completedLevels.has('facile');
    const hasMedium = completedLevels.has('moyen');
    const hasHard = completedLevels.has('difficile');

    return (hasEasy ? 1 : 0) + (hasMedium ? 1 : 0) + (hasHard ? 1 : 0);
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'explorateur de niveaux:', error);
    return 0;
  }
}; 