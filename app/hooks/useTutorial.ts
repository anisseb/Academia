import { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { 
  getFirstConnexionData, 
  createFirstConnexionData, 
  markTutorialCompleted 
} from '../services/firestoreService';

export const useTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkTutorialStatus();
  }, []);

  const checkTutorialStatus = async () => {
    try {
      setIsLoading(true);
      
      const user = auth.currentUser;
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const firstConnexionData = await getFirstConnexionData(user.uid);
      
      if (!firstConnexionData) {
        // Première connexion - créer les données et montrer le tutoriel
        await createFirstConnexionData(user.uid);
        setShowTutorial(true);
      } else if (!firstConnexionData.tutoCompleted) {
        // L'utilisateur existe mais n'a pas terminé le tutoriel
        setShowTutorial(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut du tutoriel:', error);
      setIsLoading(false);
    }
  };

  const completeTutorial = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await markTutorialCompleted(user.uid);
      }
      setShowTutorial(false);
    } catch (error) {
      console.error('Erreur lors de la finalisation du tutoriel:', error);
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  return {
    showTutorial,
    isLoading,
    completeTutorial,
    skipTutorial,
  };
}; 