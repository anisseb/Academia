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
    const exercises = profile.exercises || {};

    // Récupérer tous les exercices complétés avec leur score et date
    const completedExercises: { score: number; completedAt: string }[] = [];
    
    Object.entries(exercises).forEach(([schoolType, schoolTypeData]) => {
      if (typeof schoolTypeData === 'object' && schoolTypeData !== null) {
        Object.entries(schoolTypeData).forEach(([classe, classeData]) => {
          if (typeof classeData === 'object' && classeData !== null) {
            Object.entries(classeData).forEach(([subject, subjectData]) => {
              if (typeof subjectData === 'object' && subjectData !== null) {
                Object.entries(subjectData).forEach(([chapterId, chapterData]) => {
                  if (typeof chapterData === 'object' && chapterData !== null) {
                    Object.entries(chapterData).forEach(([contentId, contentData]) => {
                      if (Array.isArray(contentData)) {
                        contentData.forEach((exercise: any) => {
                          completedExercises.push({
                            score: exercise.score,
                            completedAt: exercise.completedAt
                          });
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    // Trier les exercices par date
    completedExercises.sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    // Vérifier les séries de 5 exercices consécutifs avec score > 80%
    let currentSeries = 0;
    let maxSeries = 0;

    for (const exercise of completedExercises) {
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