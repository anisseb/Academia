import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const checkPerfectSeries = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const profile = userData.profile || {};
    const completedExercises = profile.completedExercises || {};

    // Récupérer tous les exercices complétés avec leur score et date
    const exercises: { score: number; completedAt: string }[] = [];
    
    Object.values(completedExercises).forEach((exercise: any) => {
      if (exercise.done && exercise.completedAt) {
        exercises.push({
          score: exercise.score || 0,
          completedAt: exercise.completedAt
        });
      }
    });

    // Trier les exercices par date
    exercises.sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    // Vérifier les séries de 5 exercices consécutifs avec score > 80%
    let currentSeries = 0;
    let maxSeries = 0;

    for (const exercise of exercises) {
      if (exercise.score >= 80) {
        currentSeries++;
        maxSeries = Math.max(maxSeries, currentSeries);
      } else {
        currentSeries = 0;
      }
    }

    return Math.min(maxSeries, 5);
  } catch (error) {
    console.error('Erreur lors de la vérification de la série parfaite:', error);
    return 0;
  }
}; 