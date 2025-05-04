import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkScannerDocuments = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const threads = userData.threads || {};
    
    // Compter le nombre total d'utilisations du scanner dans tous les threads
    let totalScannerUses = 0;
    Object.values(threads).forEach((thread: any) => {
      if (thread.cameraCount) {
        totalScannerUses += thread.cameraCount;
      }
    });

    return totalScannerUses;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Scanner de documents:', error);
    return 0;
  }
}; 