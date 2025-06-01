import { useState, useEffect } from 'react';
import { 
  getCountries, 
  getSchoolTypes, 
  getClasses, 
  getSubjects 
} from '../services/firestoreService';
import type { Country, SchoolType, Class, Subject } from '../types/firestore';

export const useSchoolData = (countryId?: string, schoolTypeId?: string, classeId?: string) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<SchoolType[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesData = await getCountries();
        setCountries(countriesData);
      } catch (err) {
        setError('Erreur lors du chargement des pays');
        console.error(err);
      }
    };

    loadCountries();
  }, []);

  useEffect(() => {
    const loadSchoolTypes = async () => {
      if (!countryId) {
        setSchoolTypes([]);
        return;
      }

      try {
        const schoolTypesData = await getSchoolTypes(countryId);
        setSchoolTypes(schoolTypesData);
      } catch (err) {
        setError('Erreur lors du chargement des types d\'établissements');
        console.error(err);
      }
    };

    loadSchoolTypes();
  }, [countryId]);

  useEffect(() => {
    const loadClasses = async () => {
      if (!countryId || !schoolTypeId) {
        setClasses([]);
        return;
      }

      try {
        const classesData = await getClasses(countryId, schoolTypeId);
        setClasses(classesData);
      } catch (err) {
        setError('Erreur lors du chargement des classes');
        console.error(err);
      }
    };

    loadClasses();
  }, [countryId, schoolTypeId]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!countryId || !classeId) {
        setSubjects([]);
        return;
      }

      try {
        const subjectsData = await getSubjects(countryId, classeId);
        setSubjects(subjectsData);
      } catch (err) {
        setError('Erreur lors du chargement des matières');
        console.error(err);
      }
    };

    loadSubjects();
  }, [countryId, classeId]);

  useEffect(() => {
    setLoading(false);
  }, [countries, schoolTypes, classes, subjects]);

  return {
    countries,
    schoolTypes,
    classes,
    subjects,
    loading,
    error
  };
}; 