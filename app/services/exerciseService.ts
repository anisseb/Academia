import { doc, setDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Exercise, Exercices } from '../types/exercise';
import { exercices } from '../constants/exercices';
import { auth } from '../../firebaseConfig';

// Fonction pour générer un ID unique simple
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

// Fonction pour extraire les expressions mathématiques d'un texte
function extractMathExpressions(text: string): string {
  if (!text) return text;

  // Regex pour capturer les expressions entre \( et \)
  const mathRegex = /\\\((.*?)\\\)/g;
  
  // Vérifier si le texte contient des expressions mathématiques
  if (!mathRegex.test(text)) {
    return text;
  }
  
  // Réinitialiser lastIndex car test() l'a modifié
  mathRegex.lastIndex = 0;
  
  // Remplacer les expressions mathématiques par leur version avec délimiteurs $
  // mais sans les délimiteurs \( et \)
  const processedText = text.replace(mathRegex, (match, expression) => {
    // Envelopper l'expression avec des délimiteurs $ pour KaTeX
    const mathWithDelimiters = `$${expression}$`;
    
    // Retourner l'expression avec délimiteurs $ mais sans délimiteurs \( \)
    return mathWithDelimiters;
  });

  return processedText;
}

// Fonction pour vérifier si un exercice existe déjà dans Firestore
async function exerciseExists(exerciseId: string): Promise<boolean> {
  try {
    const exerciseRef = doc(db, 'exercises', exerciseId);
    const exerciseSnap = await getDoc(exerciseRef);
    return exerciseSnap.exists();
  } catch (error) {
    console.error(`Erreur lors de la vérification de l'existence de l'exercice ${exerciseId}:`, error);
    return false;
  }
}

// Fonction pour enregistrer les exercices prédéfinis dans Firestore
export async function saveExercisesToFirestore(): Promise<string[]> {
  try {
    const savedIds: string[] = [];
    const processedIds: Set<string> = new Set(); // Pour suivre les IDs déjà traités
    
    // Vérifier que le tableau d'exercices existe
    if (!exercices || !Array.isArray(exercices) || exercices.length === 0) {
      throw new Error('Aucun exercice trouvé dans le fichier exercices.ts');
    }
    
    // Traiter chaque exercice
    for (const exerciseData of exercices) {
      // Utiliser l'ID existant de l'exercice ou en générer un nouveau
      const exerciseId = generateId();
      
      // Vérifier si l'ID a déjà été traité dans cette session
      if (processedIds.has(exerciseId)) {
        console.log(`L'exercice avec l'ID ${exerciseId} a déjà été traité, ignoré.`);
        continue;
      }
      
      // Ajouter l'ID à l'ensemble des IDs traités
      processedIds.add(exerciseId);
      
      if (!exerciseData.questions || !Array.isArray(exerciseData.questions)) {
        console.warn(`L'exercice ${exerciseId} n'a pas de questions valides, ignoré.`);
        continue;
      }
      
      // Traiter chaque question
      const processedQuestions = exerciseData.questions.map((question, questionIndex) => {
        const questionId = question.id || `q${questionIndex + 1}`;
        
        // Traiter le texte de la question avec la fonction extractMathExpressions
        const processedQuestion = extractMathExpressions(question.question);
        
        // Traiter les options
        const processedOptions = question.options.map(option => 
          extractMathExpressions(option)
        );
        
        // Traiter l'explication
        const processedExplanation = extractMathExpressions(question.explanation);
        
        return {
          id: questionId,
          question: processedQuestion,
          options: processedOptions,
          correctAnswer: question.correctAnswer,
          explanation: processedExplanation
        };
      });
      
      // Créer l'objet Exercise avec les propriétés directement
      const exercise: Exercise = {
        id: exerciseId,
        title: exerciseData.title,
        difficulty: exerciseData.difficulty as 'facile' | 'moyen' | 'difficile',
        questions: processedQuestions,
        subject: 'maths', // Valeur par défaut
        class: 'seconde', // Valeur par défaut
        chapter: 'nombres-calculs', // Valeur par défaut
        content: 'nombres-reels', // Valeur par défaut
        createdAt: new Date().toISOString()
      };
      
      // Chemin hiérarchique dans Firestore avec un nombre pair de segments
      const path = `exercises/${exercise.subject}/${exercise.class}/${exercise.chapter}/${exercise.content}/${exerciseId}`;
      
      // Sauvegarder dans Firestore avec le chemin hiérarchique
      await setDoc(doc(db, path), exercise);
      savedIds.push(exerciseId);
    }
    
    console.log(`Total d'exercices importés: ${savedIds.length} / ${exercices.length}`);
    return savedIds;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des exercices:', error);
    throw error;
  }
}

// Fonction pour récupérer tous les exercices d'une matière, classe, chapitre et contenu spécifiques
export async function getExercisesByPath(subject: string, classLevel: string, chapter: string, content: string): Promise<Exercise[]> {
  try {
    // Récupérer le profil utilisateur
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('Profil utilisateur non trouvé');
    }

    const userData = userDoc.data();
    const userExercises = userData.profile?.exercises || {};

    // Construire le chemin hiérarchique
    const path = `exercises/${subject}/${classLevel}/${chapter}/${content}`;
    const exercisesRef = collection(db, path);
    const snapshot = await getDocs(exercisesRef);
    
    // Transformer les documents en exercices avec les informations du profil
    const exercises = snapshot.docs.map(doc => {
      const exerciseData = doc.data();
      const exercisePath = `${subject}.${chapter}.${content}`;
      const exerciseStatus = userExercises[exercisePath]?.[doc.id];
      
      return {
        id: doc.id,
        title: exerciseData.title,
        difficulty: exerciseData.difficulty,
        questions: exerciseData.questions,
        subject: exerciseData.subject,
        class: exerciseData.class,
        chapter: exerciseData.chapter,
        content: exerciseData.content,
        createdAt: exerciseData.createdAt,
        isCompleted: exerciseStatus?.done || false,
        score: exerciseStatus?.score || 0
      } as Exercise;
    });

    // Trier les exercices par difficulté
    const difficultyOrder = {
      'facile': 1,
      'moyen': 2,
      'difficile': 3
    };

    return exercises.sort((a, b) => 
      difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
      difficultyOrder[b.difficulty as keyof typeof difficultyOrder]
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des exercices:', error);
    throw error;
  }
}

// Fonction pour récupérer tous les exercices
export async function getAllExercises(): Promise<Exercise[]> {
  try {
    const exercisesRef = collection(db, 'exercises');
    const snapshot = await getDocs(exercisesRef);
    
    return snapshot.docs.map(doc => doc.data() as Exercise);
  } catch (error) {
    console.error('Erreur lors de la récupération des exercices:', error);
    throw error;
  }
}

// Fonction pour récupérer les exercices par matière et chapitre
export async function getExercisesBySubjectAndChapter(subject: string, chapter: string): Promise<Exercise[]> {
  try {
    const exercisesRef = collection(db, 'exercises');
    const q = query(
      exercisesRef, 
      where('metadata.subject', '==', subject),
      where('metadata.chapter', '==', chapter)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data() as Exercise);
  } catch (error) {
    console.error('Erreur lors de la récupération des exercices:', error);
    throw error;
  }
} 