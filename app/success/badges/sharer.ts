import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

export const checkSharer = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const coursSuccess = userData.success?.cours || {};
    
    // Compter le nombre total d'exports PDF
    let totalExports = 0;
    Object.values(coursSuccess).forEach((cours: any) => {
      totalExports += cours.pdfExported || 0;
    });
    
    return totalExports;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Partageur:', error);
    return 0;
  }
}; 