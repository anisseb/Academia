import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkAllProfessors = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    // Liste des profils de professeurs disponibles
    const professorProfiles = ['professeur', 'tuteur', 'ami'];
    
    // Créer un Set pour suivre les profils avec lesquels l'utilisateur a interagi
    const interactedProfiles = new Set<string>();
    
    // Récupérer le document utilisateur pour vérifier les profils déjà enregistrés
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const savedProfiles = userData.success?.interactedProfiles || [];
      savedProfiles.forEach((profile: string) => interactedProfiles.add(profile));
    }

    // Récupérer tous les threads de l'utilisateur depuis la collection threads
    const threadRef = doc(db, 'threads', user.uid);
    const threadDoc = await getDoc(threadRef);
    if (threadDoc.exists()) {
      const threadData = threadDoc.data();
      
      // Parcourir toutes les conversations pour trouver les profils avec lesquels l'utilisateur a interagi
      Object.values(threadData.threads).forEach((conversation: any) => {
        if (conversation.aiProfile && professorProfiles.includes(conversation.aiProfile)) {
          interactedProfiles.add(conversation.aiProfile);
        }
      });
    }

    // Sauvegarder la liste mise à jour des profils interagis
    await updateDoc(userRef, {
      'success.interactedProfiles': Array.from(interactedProfiles)
    });

    // Retourner la valeur de success.interactedProfiles
    const updatedUserDoc = await getDoc(userRef);
    if (updatedUserDoc.exists()) {
      const updatedUserData = updatedUserDoc.data();
      return updatedUserData.success?.interactedProfiles?.length || 0;
    }

    return 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Posez une question à tous les professeurs:', error);
    return 0;
  }
}; 