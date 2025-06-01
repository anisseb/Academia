import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, getDocs, query, collection, where } from 'firebase/firestore';

interface SubjectData {
  programme?: {
    content: {
      exercices?: {
        id: string;
      }[];
    }[];
  }[];
}

export const checkScientificRigor = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const profile = userData.profile || {};
    const completedExercises = profile.completedExercises || {};
    const userSchoolType = profile.schoolType;
    const userClass = profile.class;

    if (!userSchoolType || !userClass) return 0;

    // Récupérer le programme complet de la matière
    // Nouvelle structure : on ne passe plus par academia mais par les collections séparées
    const userSubjects = Object.keys(userData.profile?.subjects || {});
    for (const subjectId of userSubjects) {
      const totalExercises = new Set<string>();
      const completedExercisesInSubject = new Set<string>();

      // 1. Récupérer les chapitres de la matière
      const chaptersSnapshot = await getDocs(query(collection(db, 'chapters'), where('subjectId', '==', subjectId)));
      for (const chapterDoc of chaptersSnapshot.docs) {
        // 2. Récupérer les contenus du chapitre
        const contentsSnapshot = await getDocs(query(collection(db, 'contents'), where('chapterId', '==', chapterDoc.id)));
        for (const contentDoc of contentsSnapshot.docs) {
          // 3. Récupérer les exercices du contenu
          const exercisesSnapshot = await getDocs(query(collection(db, 'exercises'), where('contentId', '==', contentDoc.id)));
          for (const exerciseDoc of exercisesSnapshot.docs) {
            totalExercises.add(exerciseDoc.id);
          }
        }
      }

      // Compter les exercices complétés dans la matière
      Object.values(completedExercises).forEach((exercise: any) => {
        if (exercise.done && exercise.subjectId === subjectId) {
          completedExercisesInSubject.add(exercise.exerciceId);
        }
      });

      // Si tous les exercices d'une matière sont complétés, retourner 1
      if (totalExercises.size > 0 && totalExercises.size === completedExercisesInSubject.size) {
        return 1;
      }
    }

    return 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du scientifique rigoureux:', error);
    return 0;
  }
}; 