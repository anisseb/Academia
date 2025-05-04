import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkAllProfessors = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const threads = userData.threads || {};
    
    // Liste des profils de professeurs disponibles
    const professorProfiles = ['professeur', 'tuteur', 'ami'];
    
    // Créer un Set pour suivre les profils avec lesquels l'utilisateur a interagi
    const interactedProfiles = new Set<string>();
    
    // Parcourir tous les threads pour trouver les profils avec lesquels l'utilisateur a interagi
    Object.values(threads).forEach((thread: any) => {
      const profile = thread.profile;
      if (profile && professorProfiles.includes(profile)) {
        interactedProfiles.add(profile);
      }
    });

    // Vérifier si l'utilisateur a interagi avec tous les profils de professeurs
    return interactedProfiles.size === professorProfiles.length ? 1 : 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Posez une question à tous les professeurs:', error);
    return 0;
  }
}; 