import { db } from '../../firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import {
  Country,
  SchoolType,
  Class,
  Subject,
  Theme,
  Chapter,
  Exercise
} from '../types/firestore';

// Countries
export const getCountries = async (): Promise<Country[]> => {
  const countriesRef = collection(db, 'countries');
  const snapshot = await getDocs(countriesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Country));
};

// SchoolTypes
export const getSchoolTypes = async (countryId: string): Promise<SchoolType[]> => {
  const schoolTypesRef = collection(db, 'schoolTypes');
  const q = query(schoolTypesRef, where('countryId', '==', countryId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SchoolType));
};

// Classes
export const getClasses = async (countryId: string, schoolTypeId: string): Promise<Class[]> => {
  const classesRef = collection(db, 'classes');
  const q = query(
    classesRef,
    where('countryId', '==', countryId),
    where('schoolTypeId', '==', schoolTypeId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate()
  } as Class));
};

// Subjects
export const getSubjects = async (countryId: string, classeId: string): Promise<Subject[]> => {
  const subjectsRef = collection(db, 'subjects');
  const q = query(
    subjectsRef,
    where('countryId', '==', countryId),
    where('classeId', '==', classeId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate()
  } as Subject));
};

// Themes
export const getThemes = async (countryId: string, classeId: string, subjectId: string): Promise<Theme[]> => {
  const themesRef = collection(db, 'themes');
  const q = query(
    themesRef,
    where('countryId', '==', countryId),
    where('classeId', '==', classeId),
    where('subjectId', '==', subjectId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate()
  } as Theme));
};

// Chapters
export const getChapters = async (themeId: string): Promise<Chapter[]> => {
  const chaptersRef = collection(db, 'chapters');
  const q = query(
    chaptersRef,
    where('themeId', '==', themeId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate()
  } as Chapter));
};

// Exercises
export const getExercises = async (
  countryId: string,
  schoolTypeId: string,
  classId: string,
  subjectId: string,
  themeId: string,
  chapterId: string
): Promise<Exercise[]> => {
  const exercisesRef = collection(db, 'exercises');
  const q = query(
    exercisesRef,
    where('countryId', '==', countryId),
    where('schoolTypeId', '==', schoolTypeId),
    where('classId', '==', classId),
    where('subjectId', '==', subjectId),
    where('themeId', '==', themeId),
    where('chapterId', '==', chapterId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate()
  } as Exercise));
};

// Create operations
export const createExercise = async (exercise: Omit<Exercise, 'id' | 'createdAt'>): Promise<string> => {
  const exercisesRef = collection(db, 'exercises');
  const docRef = await addDoc(exercisesRef, {
    ...exercise,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const createChapter = async (chapter: Omit<Chapter, 'id' | 'createdAt'>): Promise<string> => {
  const chaptersRef = collection(db, 'chapters');
  const docRef = await addDoc(chaptersRef, {
    ...chapter,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

// Update operations
export const updateExercise = async (id: string, data: Partial<Exercise>): Promise<void> => {
  const exerciseRef = doc(db, 'exercises', id);
  await updateDoc(exerciseRef, data);
};

export const updateChapter = async (id: string, data: Partial<Chapter>): Promise<void> => {
  const chapterRef = doc(db, 'chapters', id);
  await updateDoc(chapterRef, data);
};

// Delete operations
export const deleteExercise = async (id: string): Promise<void> => {
  const exerciseRef = doc(db, 'exercises', id);
  await deleteDoc(exerciseRef);
};

export const deleteChapter = async (id: string): Promise<void> => {
  const chapterRef = doc(db, 'chapters', id);
  await deleteDoc(chapterRef);
};

// Récupérer le nom du type d'établissement
export const getSchoolTypeName = async (countryId: string, schoolTypeId: string): Promise<string> => {
  const schoolTypeRef = doc(db, 'schoolTypes', schoolTypeId);
  const docSnap = await getDoc(schoolTypeRef);
  if (docSnap.exists() && docSnap.data().countryId === countryId) {
    return docSnap.data().label || '';
  }
  return '';
};

// Récupérer le nom de la classe
export const getClassName = async (countryId: string, schoolTypeId: string, classId: string): Promise<string> => {
  const classRef = doc(db, 'classes', classId);
  const docSnap = await getDoc(classRef);
  if (
    docSnap.exists() &&
    docSnap.data().countryId === countryId &&
    docSnap.data().schoolTypeId === schoolTypeId
  ) {
    return docSnap.data().label || '';
  }
  return '';
};