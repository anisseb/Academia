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
    const exercises = profile.exercises || {};

    // Vérifier si l'utilisateur a obtenu 100% à au moins un exercice
    let hasPerfectScore = false;
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
                          if (exercise.score === 100) {
                            hasPerfectScore = true;
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
      }
    });

    return hasPerfectScore ? 1 : 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du perfectionniste:', error);
    return 0;
  }
}; 