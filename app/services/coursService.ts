import { Mistral } from '@mistralai/mistralai';
import { db } from '../../firebaseConfig';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';

const MISTRAL_API_KEY = '5YC1BWCbnpIqsViDDsK9zBbc1NgqjwAj';

interface CoursSection {
  title: string;
  content: string;
  examples?: string[];
  keyPoints?: string[];
}

interface CoursContent {
  title: string;
  introduction: string;
  sections: CoursSection[];
  conclusion: string;
}

export async function generateCourse(
  subject: string,
  chapter: string,
  topic: string,
  level: string
): Promise<CoursContent> {
  const prompt = `Génère un cours structuré sur ${topic} pour un élève de ${level} dans la matière ${subject}, chapitre ${chapter}.
   IMPORTANT: les formules mathematiques doivent etre au format latex, il faut que le format soit correcte pour etre pris en compte par katex.
  Le cours doit suivre strictement ce format JSON :
  {
    "title": "Titre du cours",
    "introduction": "Introduction claire et concise...",
    "sections": [
      {
        "title": "Titre de la section",
        "content": "Contenu détaillé...",
        "examples": ["Exemple concret 1", "Exemple concret 2"],
        "keyPoints": ["Point clé 1", "Point clé 2", "Point clé 3"]
      }
    ],
    "conclusion": "Résumé des points importants..."
  }

  Le cours doit être pédagogique, adapté au niveau ${level}, et inclure des exemples concrets.`;

  try {
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });

    const response = await client.chat.complete({
        model: 'mistral-large-latest',
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7,
        maxTokens: 2048
    });

    if (!response.choices?.[0]?.message?.content) {
        throw new Error('Réponse invalide de l\'API Mistral');
    }

    const content = response.choices[0].message.content;

    if (typeof content !== 'string') {
        throw new Error('Le contenu de la réponse n\'est pas une chaîne de caractères');
    }

    const cleanedContent = content
    .replace(/```json\n/, '')
    .replace(/```$/, '')
    .trim();

    const coursContent = JSON.parse(cleanedContent.replace(/\\/g, '\\\\')) as CoursContent;
    return coursContent;

  } catch (error) {
    console.error('Erreur lors de la génération du cours:', error);
    throw new Error('Impossible de générer le cours pour le moment');
  }
}

export async function generateExerciseFromCourse(coursContent: CoursContent): Promise<string> {
  const prompt = `En te basant sur ce cours :
  ${JSON.stringify(coursContent)}
  
  Génère un exercice d'application pertinent qui permet de vérifier la compréhension des points clés.`;

  try {
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });

    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      maxTokens: 1024
    });

    return response.choices?.[0]?.message?.content as string;

  } catch (error) {
    console.error('Erreur lors de la génération de l\'exercice:', error);
    throw new Error('Impossible de générer l\'exercice pour le moment');
  }
}

export async function getCourseFromFirebase(
  subject: string,
  chapter: string,
  contentId: string
): Promise<CoursContent | null> {
  try {
    const coursePath = `cours/${subject}/${chapter}/${contentId}`;
    const courseDoc = await getDoc(doc(db, coursePath));
    
    if (courseDoc.exists()) {
      return courseDoc.data() as CoursContent;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du cours:', error);
    return null;
  }
}

export async function saveCourseToFirebase(
  subject: string,
  chapter: string,
  contentId: string,
  courseContent: CoursContent
): Promise<void> {
  try {
    const coursePath = `cours/${subject}/${chapter}/${contentId}`;
    await setDoc(doc(db, coursePath), courseContent);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du cours:', error);
    throw error;
  }
}

export async function generateAndSaveCourse(
  subject: string,
  chapter: string,
  contentId: string,
  topic: string,
  level: string
): Promise<CoursContent> {
  try {
    // D'abord, vérifie si le cours existe déjà
    const existingCourse = await getCourseFromFirebase(subject, chapter, contentId);
    if (existingCourse) {
      return existingCourse;
    }

    // Si le cours n'existe pas, génère-le
    const newCourse = await generateCourse(subject, chapter, topic, level);
    
    // Sauvegarde le nouveau cours
    await saveCourseToFirebase(subject, chapter, contentId, newCourse);
    
    return newCourse;
  } catch (error) {
    console.error('Erreur lors de la génération et sauvegarde du cours:', error);
    throw error;
  }
} 