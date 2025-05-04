import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

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
    const exercises = profile.exercises || {};
    const userSchoolType = profile.schoolType;
    const userClass = profile.class;

    if (!userSchoolType || !userClass) return 0;

    // Récupérer le programme complet de la matière
    const academiaDoc = await getDoc(doc(db, 'academia', userSchoolType));
    if (!academiaDoc.exists()) return 0;

    const academiaData = academiaDoc.data();
    const subjectProgram = academiaData.classes[userClass]?.matieres || {};

    // Pour chaque matière, vérifier si tous les exercices sont complétés
    for (const [subject, subjectData] of Object.entries(subjectProgram)) {
      const totalExercises = new Set<string>();
      const completedExercises = new Set<string>();

      // Compter le nombre total d'exercices dans la matière
      const typedSubjectData = subjectData as SubjectData;
      if (typedSubjectData.programme) {
        for (const chapter of typedSubjectData.programme) {
          for (const content of chapter.content) {
            if (content.exercices) {
              for (const exercise of content.exercices) {
                totalExercises.add(exercise.id);
              }
            }
          }
        }
      }

      // Compter les exercices complétés dans la matière
      if (exercises[userSchoolType]?.[userClass]?.[subject]) {
        Object.entries(exercises[userSchoolType][userClass][subject]).forEach(([chapterId, chapterData]) => {
          if (typeof chapterData === 'object' && chapterData !== null) {
            Object.entries(chapterData).forEach(([contentId, contentData]) => {
              if (Array.isArray(contentData)) {
                contentData.forEach((exercise: any) => {
                  completedExercises.add(exercise.exerciceId);
                });
              }
            });
          }
        });
      }

      // Si tous les exercices d'une matière sont complétés, retourner 1
      if (totalExercises.size > 0 && totalExercises.size === completedExercises.size) {
        return 1;
      }
    }

    return 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du scientifique rigoureux:', error);
    return 0;
  }
}; 