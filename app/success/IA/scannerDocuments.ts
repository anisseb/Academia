import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkScannerDocuments = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;
    const userData = userDoc.data();
  
    if (userData.success?.cameraCount >= 10) {
      return 10;
    } else {
      return userData.success?.cameraCount || 0;
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Scanner de documents:', error);
    return 0;
  }
}; 