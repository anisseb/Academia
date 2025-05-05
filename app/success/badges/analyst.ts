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
    const progressionViews = userData.success.progressionViews || {};
    
    // Vérifier si l'utilisateur a consulté les stats toutes les semaines du mois
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const weeksInMonth = [];
    let currentWeekDate = new Date(firstDayOfMonth);
    
    while (currentWeekDate <= lastDayOfMonth) {
      const weekNumber = getWeekNumber(currentWeekDate);
      weeksInMonth.push(currentYear + '-' + weekNumber);
      currentWeekDate.setDate(currentWeekDate.getDate() + 7);
    }

    const hasViewedAllWeeks = weeksInMonth.every(week => progressionViews[week]);
    
    return hasViewedAllWeeks ? 1 : 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du succès Analyste:', error);
    return 0;
  }
}; 