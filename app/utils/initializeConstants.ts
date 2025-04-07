import { db } from '../../firebaseConfig';
import { doc, setDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { countries, schoolTypes, technologicalSections } from '../constants/education';
import { subjectsList } from '../constants/subjects';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_VERSION = '1.0.0';
const CACHE_KEYS = {
  COUNTRIES: 'constants_countries',
  SCHOOL_TYPES: 'constants_schoolTypes',
  TECHNOLOGICAL_SECTIONS: 'constants_technologicalSections',
  SUBJECTS: 'constants_subjects',
  VERSION: 'constants_version'
};

export const initializeConstants = async () => {
  try {
    const batch = writeBatch(db);

    // Initialiser les pays
    const countriesCol = collection(db, 'countries');
    countries.forEach(country => {
      const docRef = doc(countriesCol, country.id);
      batch.set(docRef, country);

      // Pour chaque pays, créer une sous-collection schoolTypes
      if (country.id === 'fr') {
        const countrySchoolTypesCol = collection(db, `countries/${country.id}/schoolTypes`);
        schoolTypes.forEach(schoolType => {
          const schoolTypeRef = doc(countrySchoolTypesCol, schoolType.id);
          batch.set(schoolTypeRef, schoolType);
        });
      }
    });

    // Initialiser les sections technologiques (spécifique à la France)
    const techSectionsCol = collection(db, 'countries/fr/technologicalSections');
    technologicalSections.forEach(section => {
      const docRef = doc(techSectionsCol, section.id);
      batch.set(docRef, section);
    });

    // Initialiser les matières (spécifique à la France pour l'instant)
    const subjectsCol = collection(db, 'countries/fr/subjects');
    subjectsList.forEach(subject => {
      const docRef = doc(subjectsCol, subject.id);
      batch.set(docRef, subject);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error initializing constants:', error);
    throw error;
  }
};

export const loadConstants = async () => {
  try {
    // Vérifier la version du cache
    const cachedVersion = await AsyncStorage.getItem(CACHE_KEYS.VERSION);
    
    // Si la version du cache correspond, charger depuis le cache
    if (cachedVersion === CACHE_VERSION) {
      const [countries, schoolTypes, technologicalSections, subjects] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.COUNTRIES),
        AsyncStorage.getItem(CACHE_KEYS.SCHOOL_TYPES),
        AsyncStorage.getItem(CACHE_KEYS.TECHNOLOGICAL_SECTIONS),
        AsyncStorage.getItem(CACHE_KEYS.SUBJECTS)
      ]);

      if (countries && schoolTypes && technologicalSections && subjects) {
        return {
          countries: JSON.parse(countries),
          schoolTypes: JSON.parse(schoolTypes),
          technologicalSections: JSON.parse(technologicalSections),
          subjects: JSON.parse(subjects)
        };
      }
    }

    // Si pas de cache ou version différente, charger depuis Firestore
    const [
      countriesSnapshot,
      schoolTypesSnapshot,
      technologicalSectionsSnapshot,
      subjectsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'countries')),
      getDocs(collection(db, 'countries/fr/schoolTypes')),
      getDocs(collection(db, 'countries/fr/technologicalSections')),
      getDocs(collection(db, 'countries/fr/subjects'))
    ]);

    const constants = {
      countries: countriesSnapshot.docs.map(doc => doc.data()),
      schoolTypes: schoolTypesSnapshot.docs.map(doc => doc.data()),
      technologicalSections: technologicalSectionsSnapshot.docs.map(doc => doc.data()),
      subjects: subjectsSnapshot.docs.map(doc => doc.data())
    };

    // Mettre en cache
    await Promise.all([
      AsyncStorage.setItem(CACHE_KEYS.COUNTRIES, JSON.stringify(constants.countries)),
      AsyncStorage.setItem(CACHE_KEYS.SCHOOL_TYPES, JSON.stringify(constants.schoolTypes)),
      AsyncStorage.setItem(CACHE_KEYS.TECHNOLOGICAL_SECTIONS, JSON.stringify(constants.technologicalSections)),
      AsyncStorage.setItem(CACHE_KEYS.SUBJECTS, JSON.stringify(constants.subjects)),
      AsyncStorage.setItem(CACHE_KEYS.VERSION, CACHE_VERSION)
    ]);

    return constants;
  } catch (error) {
    console.error('Error loading constants:', error);
    throw error;
  }
}; 