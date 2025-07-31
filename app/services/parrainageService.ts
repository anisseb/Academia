import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { showAlert } from '../utils/alerts';

// Configuration des réductions pour tous les utilisateurs (parrains et filleuls)
const PARRAINAGE_REDUCTIONS = {
  standard: { pourcentage: 20 }, // 20% pour chaque affiliation
  5: { pourcentage: 30 }, // 30% pour 5 affiliations
  10: { pourcentage: 40 }, // 40% pour 10 affiliations
  20: { pourcentage: 50 }, // 50% pour 20 affiliations
};

export class ParrainageService {
  /**
   * Vérifie et attribue automatiquement les récompenses et réductions
   */
  static async checkAndAwardRewards(userId: string): Promise<void> {
    try {
      const parrainageDoc = await getDoc(doc(db, 'parrainage', userId));
      if (!parrainageDoc.exists()) return;

      const parrainageData = parrainageDoc.data();
      const parrainagesCount = parrainageData.parrainages || 0;
      const currentReductions = parrainageData.reductions || [];
      let newReductions: any[] = [];

      // Vérifier les réductions pour tous les utilisateurs (parrains et filleuls)
      const standardConfig = PARRAINAGE_REDUCTIONS.standard;
      const existingStandardReduction = currentReductions.find((r: any) => 
        r.pourcentage === standardConfig.pourcentage
      );
      
      if (!existingStandardReduction) {
        newReductions.push({
          active: true,
          pourcentage: standardConfig.pourcentage,
          type: 'mois',
          reason: 'affiliation_standard' // Pour identifier que c'est un bonus d'affiliation standard
        });
      }

      // Vérifier les réductions pour les paliers d'affiliation
      for (const [seuil, config] of Object.entries(PARRAINAGE_REDUCTIONS)) {
        if (seuil === 'standard') continue; // Ignorer la réduction standard déjà traitée
        
        const seuilNum = parseInt(seuil);
        if (parrainagesCount >= seuilNum) {
          // Vérifier si une réduction pour ce seuil existe déjà
          const existingReduction = currentReductions.find((r: any) => 
            r.pourcentage === config.pourcentage
          );
          
          if (!existingReduction) {
            newReductions.push({
              active: true,
              pourcentage: config.pourcentage,
              type: 'mois',
              reason: `affiliation_${seuil}` // Pour identifier le palier d'affiliation
            });
          }
        }
      }

      // Mettre à jour les données si de nouvelles réductions sont obtenues
      if (newReductions.length > 0) {
        const updatedParrainage = {
          ...parrainageData,
          reductions: [...currentReductions, ...newReductions],
          updatedAt: new Date()
        };

        await updateDoc(doc(db, 'parrainage', userId), updatedParrainage);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des récompenses:', error);
    }
  }

  /**
   * Génère un code de parrainage unique
   */
  static async generateUniqueCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = result;

      // Vérifier l'unicité dans la collection parrainage
      const q = query(collection(db, 'parrainage'), where('codeParrain', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error('Impossible de générer un code unique après plusieurs tentatives');
    }

    return code!;
  }

  /**
   * Vérifie si un code de parrainage existe
   */
  static async checkCodeExists(code: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'parrainage');
      const q = query(usersRef, where('codeParrain', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      return false;
    }
  }

  /**
   * Trouve un utilisateur par son code de parrainage
   */
  static async findUserByCode(code: string): Promise<string | null> {
    try {
      const parrainageRef = collection(db, 'parrainage');
      const q = query(parrainageRef, where('codeParrain', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;

      return querySnapshot.docs[0].id;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Établit une relation de parrainage
   */
  static async establishParrainage(parrainId: string, filleulId: string): Promise<boolean> {
    try {

      // Vérifier qu'il n'y a pas déjà une affiliation mutuelle
      const existingParrainDoc = await getDoc(doc(db, 'parrainage', parrainId));
      if (existingParrainDoc.exists()) {
        const existingParrainData = existingParrainDoc.data();
        // Vérifier si le parrain a déjà affilié le filleul ou si le filleul a déjà affilié le parrain
        if (existingParrainData.parrains && existingParrainData.parrains.includes(filleulId)) {
         throw new Error('affiliation mutuelle');
        }
      }

      // Vérifier que l'utilisateur n'a pas déjà utilisé ce code d'affiliation
      const existingFilleulDoc = await getDoc(doc(db, 'parrainage', filleulId));
      if (existingFilleulDoc.exists()) {
        const existingFilleulData = existingFilleulDoc.data();
        if (existingFilleulData.parrains && existingFilleulData.parrains.includes(parrainId)) {
          throw new Error('code affiliation déjà utilisé');
        }
      }

      // Créer ou mettre à jour le document parrainage du parrain (celui dont le code a été utilisé)
      const parrainParrainageDoc = await getDoc(doc(db, 'parrainage', parrainId));
      let parrainParrainageData: any = {};
      
      if (parrainParrainageDoc.exists()) {
        parrainParrainageData = parrainParrainageDoc.data();
        // Ajouter le filleul à la liste des parrains du parrain
        const updatedParrains = [...(parrainParrainageData.parrains || []), filleulId];
        parrainParrainageData = {
          ...parrainParrainageData,
          parrains: updatedParrains,
          parrainages: (parrainParrainageData.parrainages || 0) + 1,
          pointsParrainage: (parrainParrainageData.pointsParrainage || 0) + 50,
          updatedAt: new Date()
        };
      } else {
        // Créer un nouveau document parrainage pour le parrain
        const newCode = await this.generateUniqueCode();
        parrainParrainageData = {
          userId: parrainId,
          codeParrain: newCode,
          parrains: [filleulId], // Ajouter le filleul à la liste
          parrainages: 1,
          pointsParrainage: 50,
          reductions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      await setDoc(doc(db, 'parrainage', parrainId), parrainParrainageData);

      // Créer ou mettre à jour le document parrainage du filleul
      const filleulParrainageDoc = await getDoc(doc(db, 'parrainage', filleulId));
      let filleulParrainageData: any = {};
      
      if (filleulParrainageDoc.exists()) {
        filleulParrainageData = filleulParrainageDoc.data();
        // Ajouter le nouveau parrain à la liste des parrains
        const updatedParrains = [...(filleulParrainageData.parrains || []), parrainId];
        filleulParrainageData = {
          ...filleulParrainageData,
          parrains: updatedParrains,
          parrainages: (filleulParrainageData.parrainages || 0) + 1,
          pointsParrainage: (filleulParrainageData.pointsParrainage || 0) + 50,
          updatedAt: new Date()
        };
      } else {
        // Créer un nouveau document parrainage pour le filleul
        const filleulCode = await this.generateUniqueCode();
        filleulParrainageData = {
          userId: filleulId,
          parrains: [parrainId],
          codeParrain: filleulCode,
          parrainages: 1, // Premier parrainage pour le filleul
          pointsParrainage: 50, // Bonus pour avoir utilisé un code
          reductions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      await setDoc(doc(db, 'parrainage', filleulId), filleulParrainageData);

      // Vérifier et attribuer les récompenses pour le parrain
      await this.checkAndAwardRewards(parrainId);
      
      // Vérifier et attribuer les récompenses pour le filleul aussi
      await this.checkAndAwardRewards(filleulId);

      return true;
    } catch (error: any) {
        console.error('Erreur lors de l\'utilisation du code:', error);
        if (error.message && error.message.includes('mutuel')) {
          showAlert('Parrainage Mutuel', 'Vous ne pouvez pas utiliser ce code car un parrainage mutuel existe déjà entre vous et cet utilisateur. Vous avez déjà échangé vos codes de parrainage !');
        } else {
            showAlert('Erreur', 'Impossible d\'établir le parrainage. Veuillez réessayer.');
            console.error('Erreur lors de l\'établissement du parrainage:', error);
        }
        return false;
      }
  }

  /**
   * Récupère les statistiques de parrainage d'un utilisateur
   */
  static async getParrainageStats(userId: string): Promise<{
    affiliationsCount: number;
    points: number;
    level: string;
  }> {
    try {
      const parrainageDoc = await getDoc(doc(db, 'parrainage', userId));
      if (!parrainageDoc.exists()) {
        return {
          affiliationsCount: 0,
          points: 0,
          level: 'Débutant'
        };
      }

      const parrainageData = parrainageDoc.data();
      const parrainagesCount = parrainageData.parrainages || 0;
      const points = parrainageData.pointsParrainage || 0;

      // Déterminer le niveau
      let level = 'Débutant';
      if (parrainagesCount >= 20) level = 'Légende';
      else if (parrainagesCount >= 10) level = 'Maître';
      else if (parrainagesCount >= 5) level = 'Expert';
      else if (parrainagesCount >= 1) level = 'Parrain';

      return {
        affiliationsCount: parrainagesCount,
        points,
        level
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        affiliationsCount: 0,
        points: 0,
        level: 'Débutant'
      };
    }
  }

  // Méthode supprimée car les filleuls ne sont plus gérés individuellement

  /**
   * Récupère les réductions actives d'un utilisateur
   */
  static async getActiveReductions(userId: string): Promise<Array<{
    pourcentage: number;
    type: 'mois' | 'an';
    active: boolean;
  }>> {
    try {
      const parrainageDoc = await getDoc(doc(db, 'parrainage', userId));
      if (!parrainageDoc.exists()) return [];

      const parrainageData = parrainageDoc.data();
      if (!parrainageData?.reductions) return [];

      return parrainageData.reductions
        .filter((reduction: any) => reduction.active)
        .map((reduction: any) => ({
          pourcentage: reduction.pourcentage,
          type: reduction.type,
          active: reduction.active
        }))
        .sort((a: any, b: any) => b.pourcentage - a.pourcentage); // Trier par pourcentage décroissant
    } catch (error) {
      console.error('Erreur lors de la récupération des réductions:', error);
      return [];
    }
  }

  /**
   * Applique la meilleure réduction disponible
   */
  static async applyBestReduction(userId: string, type: 'mois' | 'an'): Promise<number> {
    try {
      const activeReductions = await this.getActiveReductions(userId);
      const applicableReductions = activeReductions.filter(r => r.type === type || r.type === 'mois');
      
      if (applicableReductions.length === 0) return 0;
      
      // Retourner le pourcentage de réduction le plus élevé
      return Math.max(...applicableReductions.map(r => r.pourcentage));
    } catch (error) {
      console.error('Erreur lors de l\'application de la réduction:', error);
      return 0;
    }
  }

  /**
   * Consomme une réduction après utilisation
   */
  static async consumeReduction(userId: string, pourcentage: number): Promise<void> {
    try {
      const parrainageDoc = await getDoc(doc(db, 'parrainage', userId));
      if (!parrainageDoc.exists()) return;

      const parrainageData = parrainageDoc.data();
      if (!parrainageData?.reductions) return;

      // Marquer la réduction comme utilisée
      const updatedReductions = parrainageData.reductions.map((reduction: any) => {
        if (reduction.pourcentage === pourcentage && reduction.active) {
          return { ...reduction, active: false };
        }
        return reduction;
      });

      await updateDoc(doc(db, 'parrainage', userId), {
        reductions: updatedReductions,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la consommation de la réduction:', error);
    }
  }

  /**
   * Initialise ou récupère le code de parrainage d'un utilisateur
   */
  static async initializeOrGetCode(userId: string): Promise<string> {
    try {
      const parrainageDoc = await getDoc(doc(db, 'parrainage', userId));
      
      if (parrainageDoc.exists()) {
        const parrainageData = parrainageDoc.data();
        if (parrainageData.codeParrain) {
          return parrainageData.codeParrain;
        }
      }

      // Si le document n'existe pas ou n'a pas de code, créer un nouveau
      const newCode = await this.generateUniqueCode();
      
      const parrainageData = {
        userId: userId,
        codeParrain: newCode,
        parrains: [],
        parrainages: 0,
        pointsParrainage: 0,
        reductions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'parrainage', userId), parrainageData);
      return newCode;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du code de parrainage:', error);
      throw error;
    }
  }
} 