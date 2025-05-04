import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkAllTerrain = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const completedExercises = userData.completedExercises || {};
    
    // Créer un Set pour suivre les matières différentes
    const differentSubjects = new Set<string>();
    
    // Parcourir tous les exercices complétés
    Object.values(completedExercises).forEach((exercise: any) => {
      if (exercise.subject) {
        differentSubjects.add(exercise.subject);
      }
    });

    return differentSubjects.size;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Tout-terrain:', error);
    return 0;
  }
}; 