import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

interface Subject {
  id: string;
  label: string;
  icon: string;
  gradient: string;
  key: string;
}

interface SubjectInput {
  id: string;
  label: string;
}

export const parseGradient = (gradientString: string): [string, string] => {
    const colors = gradientString.match(/#[0-9a-fA-F]{6}/g);
    if (colors && colors.length >= 2) {
      return [colors[0], colors[1]];
    }
    return ['#60a5fa', '#3b82f6']; // Valeur par défaut
  };

export const getSubjects = async (
  subjects: SubjectInput[],
  schoolType: string,
  className: string
): Promise<Subject[]> => {
  try {
    if (!subjects.length || !schoolType || !className) return [];

    // Charger les données des matières
    const academiaDoc = await getDoc(doc(db, 'academia', schoolType));
    if (!academiaDoc.exists()) return [];

    const academiaData = academiaDoc.data();
    if (!academiaData.classes || 
        !academiaData.classes[className] || 
        !academiaData.classes[className].matieres) {
      return [];
    }

    const matieres = academiaData.classes[className].matieres;
    // Créer les objets subjects avec les données à jour
    return subjects.map((subjectData) => {
      const subjectInfo = matieres[subjectData.id];
      return {
        id: subjectData.id,
        label: subjectData.label,
        icon: subjectInfo?.icon || 'book-open-variant',
        gradient: (subjectInfo?.gradient || '#60a5fa, #3b82f6'),
        key: subjectData.id
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des gradients des matières:', error);
    return [];
  }
}; 