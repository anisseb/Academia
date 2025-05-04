import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkScannerGenius = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const threads = userData.threads || {};
    
    // Vérifier si l'utilisateur a utilisé la fonction scanner dans au moins un thread
    let hasUsedScanner = 0;
    Object.values(threads).forEach((thread: any) => {
      if (thread.cameraCount && thread.cameraCount > 0) {
        hasUsedScanner = 1;
      }
    });

    return hasUsedScanner;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Scanner de génie:', error);
    return 0;
  }
}; 