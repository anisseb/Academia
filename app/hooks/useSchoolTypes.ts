import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export type Subject = {
  id: string;
  label: string;
  description: string;
  gradient: string;
  icon: string;
};

export type Class = {
  id: string;
  label: string;
  matieres: { [key: string]: Subject };
};

export type SchoolType = {
  id: string;
  label: string;
  classes: { [key: string]: Class };
};

export function useSchoolTypes() {
  const [schoolTypes, setSchoolTypes] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolTypes = async () => {
      try {
        const schoolTypesRef = collection(db, 'academia');
        const snapshot = await getDocs(schoolTypesRef);
        const types = snapshot.docs.map(doc => ({
          id: doc.id,
          label: doc.data().label,
          classes: doc.data().classes || {}
        }));
        setSchoolTypes(types);
      } catch (err) {
        setError('Erreur lors de la récupération des types d\'établissements');
        console.error('Erreur lors de la récupération des types d\'établissements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolTypes();
  }, []);

  return { schoolTypes, loading, error };
} 