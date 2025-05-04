import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const calculateConsecutiveDays = (dates: string[]): number => {
  if (dates.length === 0) return 0;
  
  let consecutiveDays = 1;
  let currentDate = new Date(dates[0]);
  
  for (let i = 1; i < dates.length; i++) {
    const nextDate = new Date(dates[i]);
    const diffTime = Math.abs(currentDate.getTime() - nextDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      consecutiveDays++;
      currentDate = nextDate;
    } else {
      break;
    }
  }
  
  return consecutiveDays;
};

export const checkDailyExpert = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return 0;

    const userData = userDoc.data();
    const success = userData.success || {};
    const cours = success.cours || {};

    // Extraire tous les timestamps des cours
    const dates = Object.values(cours)
      .map((course: any) => course.timestamp)
      .sort();

    const consecutiveDays = calculateConsecutiveDays(dates);
    return Math.min(consecutiveDays, 7);
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'expert du jour:', error);
    return 0;
  }
}; 