import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkHomeworkHelper = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    // Récupérer le document utilisateur pour vérifier les matières déjà enregistrées
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const profile = userData.profile || {};
    
    // Récupérer la liste des matières de l'utilisateur
    const userSubjects = profile.subjects || [];
    if (userSubjects.length === 0) return 0;

    // Créer un Set pour suivre les matières où l'utilisateur a obtenu de l'aide
    const subjectsWithHelp = new Set<string>();
    
    // Ajouter les matières déjà enregistrées
    const savedSubjects = userData.success?.helpedSubjects || [];
    savedSubjects.forEach((subject: string) => subjectsWithHelp.add(subject));
    
    // Récupérer tous les threads de l'utilisateur depuis la collection threads
    const threadRef = doc(db, 'threads', user.uid);
    const threadDoc = await getDoc(threadRef);
    if (threadDoc.exists()) {
      const threadData = threadDoc.data();
      
      // Parcourir toutes les conversations pour trouver les matières où l'utilisateur a obtenu de l'aide
      Object.values(threadData.threads).forEach((conversation: any) => {
        const subject = conversation.subject;
        console.log('subject', subject);
        console.log('userSubjects', userSubjects);
        // Vérifier si la matière est dans la liste des matières de l'utilisateur en comparant les labels
        if (subject && userSubjects.some((userSubject: any) => userSubject.label === subject)) {
          subjectsWithHelp.add(subject);
        }
      });
    }

    // Sauvegarder la liste mise à jour des matières aidées
    await updateDoc(userRef, {
      'success.helpedSubjects': Array.from(subjectsWithHelp)
    });

    // Retourner la valeur de success.helpedSubjects
    const updatedUserDoc = await getDoc(userRef);
    if (updatedUserDoc.exists()) {
      const updatedUserData = updatedUserDoc.data();
      const helpedSubjects = updatedUserData.success?.helpedSubjects || [];
      return helpedSubjects.length === userSubjects.length ? 1 : 0;
    }

    return 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Aide aux devoirs:', error);
    return 0;
  }
}; 