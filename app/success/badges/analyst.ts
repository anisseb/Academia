import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export const checkAnalyst = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const progressionViews = userData.progressionViews || {};
    
    // Vérifier si l'utilisateur a consulté son tableau de progression cette semaine
    const currentDate = new Date();
    const currentWeek = currentDate.getFullYear() + '-' + getWeekNumber(currentDate);
    
    return progressionViews[currentWeek] ? 1 : 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Analyste:', error);
    return 0;
  }
}; 