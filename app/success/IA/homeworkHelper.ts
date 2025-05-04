import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkHomeworkHelper = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const profile = userData.profile || {};
    const threads = userData.threads || {};
    
    // Récupérer la liste des matières de l'utilisateur
    const userSubjects = profile.subjects || [];
    if (userSubjects.length === 0) return 0;

    // Créer un Set pour suivre les matières où l'utilisateur a obtenu de l'aide
    const subjectsWithHelp = new Set<string>();
    
    // Parcourir tous les threads pour trouver les matières où l'utilisateur a obtenu de l'aide
    Object.values(threads).forEach((thread: any) => {
      const subject = thread.subject;
      if (subject && userSubjects.includes(subject)) {
        subjectsWithHelp.add(subject);
      }
    });

    // Vérifier si l'utilisateur a obtenu de l'aide dans toutes ses matières
    return subjectsWithHelp.size === userSubjects.length ? 1 : 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Aide aux devoirs:', error);
    return 0;
  }
}; 