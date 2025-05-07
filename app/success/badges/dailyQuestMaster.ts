import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';


export const checkDailyQuestMaster = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const success = userData.success || {};
    const dailyProgress = success.dailyProgress || {};
    
    // Récupérer le nombre de quêtes complétées
    const completedQuests = dailyProgress.count || 0;
    
    // Retourner la progression (nombre de quêtes complétées sur 20)
    return Math.min(completedQuests, 20);
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Maître des quêtes:', error);
    return 0;
  }
}; 