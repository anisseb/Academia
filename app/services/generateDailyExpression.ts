import { Mistral } from '@mistralai/mistralai';

interface DailyExpression {
  title: string;
  message: string;
}

const MISTRAL_API_KEY = '5YC1BWCbnpIqsViDDsK9zBbc1NgqjwAj';

export async function generateDailyExpression(
    schoolType: string,
    level: string
  ): Promise<DailyExpression> {
    const prompt = `Génère un proverbe de la journée pour un élève de ${level} de ${schoolType}.
    IMPORTANT: Le proverbe doit suivre strictement ce format JSON, il ne doit pas contenir de texte supplémentaire :
    {
      "title": "Titre du proverbe",
      "message": "Message du proverbe",
    }`;
  
    try {
      const client = new Mistral({ apiKey: MISTRAL_API_KEY });
  
      const response = await client.chat.complete({
          model: 'codestral-latest',
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
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
  
      const dailyExpression = JSON.parse(cleanedContent) as DailyExpression;
      return dailyExpression;
  
    } catch (error) {
      console.error('Erreur lors de la génération du proverbe:', error);
      throw new Error('Impossible de générer le proverbe pour le moment');
    }
  }