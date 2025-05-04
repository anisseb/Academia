import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkCurious = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const threads = userData.threads || {};
    
    // Compter le nombre total de messages de l'utilisateur dans tous les threads
    let totalUserMessages = 0;
    Object.values(threads).forEach((thread: any) => {
      const messages = thread.messages || [];
      totalUserMessages += messages.filter((msg: any) => !msg.isAI).length;
    });

    return totalUserMessages;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Curieux:', error);
    return 0;
  }
}; 