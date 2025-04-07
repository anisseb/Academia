import { Exercise, ExerciseGenerationPrompt } from '../types/exercise';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Mistral } from '@mistralai/mistralai';

const MISTRAL_API_KEY = '5YC1BWCbnpIqsViDDsK9zBbc1NgqjwAj';

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

export async function generateExercises(prompt: ExerciseGenerationPrompt): Promise<Exercise[]> {
  try {
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });
    
    const systemPrompt = `Tu es un professeur expérimenté qui crée des exercices de type QCM.
    Génère 3 exercices pour des élèves de ${prompt.class}${prompt.section ? ` en section ${prompt.section}` : ''} 
    en ${prompt.subject} sur le chapitre "${prompt.chapter}", plus précisément sur "${prompt.content}".
    IMPORTANT: Génère exactement un exercice de chaque niveau de difficulté (facile, moyen, difficile).
    IMPORTANT: les formules mathematiques doivent etre au format latex, il faut que le format soit correcte pour etre pris en compte par katex.
    IMPORTANT : il faut que le format puisse etre parser en JSON directement par le code, il faut donc que le format soit correcte.
    Chaque exercice doit avoir un titre clair, une difficulté et 10 questions à choix multiples.
    Réponds uniquement en JSON valide avec le format suivant, sans texte supplémentaire. chaque question doit avoir une explication de la réponse correcte IMPORTANT: correctAnswer doit être un nombre entre 0 et 3:
    {
      "exercises": [
        {
          "id": "string unique",
          "title": "titre de l'exercice",
          "difficulty": "facile|moyen|difficile",
          "questions": [
            {
              "id": "string unique",
              "question": "texte de la question",
              "options": ["option 1", "option 2", "option 3", "option 4"],
              "correctAnswer": 0-3,
              "explanation": "explication de la réponse correcte"
            }
          ]
        }
      ]
    }`;

    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Génère les exercices maintenant.' }
      ],
      temperature: 0.7,
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Réponse invalide de l\'API Mistral');
    }

    const content = response.choices[0].message.content;
    
    if (typeof content !== 'string') {
      throw new Error('Le contenu de la réponse n\'est pas une chaîne de caractères');
    }
    
    // Nettoyer la réponse en retirant les backticks et le mot "json"
    const cleanedContent = content
      .replace(/```json\n/, '')
      .replace(/```$/, '')
      .trim();

    const exercisesData = JSON.parse(cleanedContent.replace(/\\/g, '\\\\'));

    // Créer les exercices avec traitement des expressions mathématiques
    const exercises = exercisesData.exercises.map((exercise: Partial<Exercise>) => {
      // Générer un ID unique pour l'exercice
      const exerciseId = generateId();
      
      // Traiter les questions
      const processedQuestions = exercise.questions?.map(question => {
        // Générer un ID unique pour la question
        const questionId = generateId();
        
        // Traiter le texte de la question avec extractMathExpressions
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
      }) || [];
      
      return {
        id: exerciseId,
        title: exercise.title,
        difficulty: exercise.difficulty as 'facile' | 'moyen' | 'difficile',
        questions: processedQuestions,
        metadata: {
          class: prompt.class,
          section: prompt.section,
          subject: prompt.subject,
          chapter: prompt.chapter,
          content: prompt.content,
          createdAt: new Date().toISOString(),
        }
      };
    });

    // Sauvegarder les exercices dans Firestore
    await Promise.all(exercises.map((exercise: Exercise) => 
      setDoc(doc(db, 'exercises', exercise.id), exercise)
    ));

    return exercises;
  } catch (error) {
    console.error('Erreur lors de la génération des exercices:', error);
    throw error;
  }
} 