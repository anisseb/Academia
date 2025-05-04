import { db } from "@/firebaseConfig";
import { doc } from "firebase/firestore";
import { getDoc } from "firebase/firestore";

export const getSchoolTypeName = async (schoolTypeId: string): Promise<string> => {
  try {
      const academiaDoc = await getDoc(doc(db, 'academia', schoolTypeId));
      if (academiaDoc.exists()) {
      return academiaDoc.data().label || schoolTypeId;
      }
      return schoolTypeId;
  } catch (error) {
      console.error('Erreur lors de la récupération du type d\'établissement:', error);
      return schoolTypeId;
  }
};

export const getClasseName = async (schoolTypeId: string, classId: string): Promise<string> => {
  try {
    const academiaDoc = await getDoc(doc(db, 'academia', schoolTypeId));
    if (academiaDoc.exists()) {
      const classes = academiaDoc.data().classes || {};
      return classes[classId]?.label || classId;
    }
    return classId;
  } catch (error) {
    console.error('Erreur lors de la récupération du nom de la classe:', error);
    return classId;
  }
};