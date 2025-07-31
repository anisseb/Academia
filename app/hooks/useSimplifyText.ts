import { useState, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

interface SimplifyResult {
  originalText: string;
  simplifiedText: string;
  isSimplified: boolean;
}

export const useSimplifyText = () => {
  const { isSimplificationEnabled } = useAccessibility();
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [cache, setCache] = useState<Map<string, string>>(new Map());

  const simplifyText = useCallback(async (text: string): Promise<SimplifyResult> => {
    if (!isSimplificationEnabled || !text || text.length < 20) {
      return {
        originalText: text,
        simplifiedText: text,
        isSimplified: false
      };
    }

    // Vérifier le cache
    if (cache.has(text)) {
      return {
        originalText: text,
        simplifiedText: cache.get(text)!,
        isSimplified: true
      };
    }

    setIsSimplifying(true);

    try {
      // Ici, vous devriez appeler votre API d'IA préférée
      // Pour l'exemple, je vais simuler une simplification basique
      // Dans un cas réel, utilisez OpenAI, Anthropic, ou un autre service
      
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Logique de simplification basique (à remplacer par un vrai appel API)
      let simplified = text;
      
      // Remplacer les mots complexes par des mots simples
      const replacements: Record<string, string> = {
        'effectuer': 'faire',
        'réaliser': 'faire',
        'identifier': 'trouver',
        'déterminer': 'trouver',
        'sélectionner': 'choisir',
        'utiliser': 'prendre',
        'compléter': 'finir',
        'résoudre': 'faire',
        'calculer': 'compter',
        'observer': 'regarder',
        'examiner': 'regarder',
        'analyser': 'regarder bien',
        'nécessaire': 'qu\'il faut',
        'approprié': 'qui va bien',
        'correct': 'bon',
        'incorrect': 'pas bon',
        'suivant': 'après',
        'précédent': 'avant',
      };

      Object.entries(replacements).forEach(([complex, simple]) => {
        const regex = new RegExp(complex, 'gi');
        simplified = simplified.replace(regex, simple);
      });

      // Diviser les phrases très longues
      if (simplified.length > 100 && simplified.includes(',')) {
        const parts = simplified.split(',');
        if (parts.length > 2) {
          simplified = parts.map(part => part.trim())
            .filter(part => part.length > 0)
            .join('.\n');
          if (!simplified.endsWith('.')) {
            simplified += '.';
          }
        }
      }

      // Ajouter des émojis pour rendre plus ludique
      const emojiMap: Record<string, string> = {
        'exercice': 'exercice 📝',
        'question': 'question ❓',
        'réponse': 'réponse ✅',
        'attention': 'attention ⚠️',
        'bravo': 'bravo 🎉',
        'aide': 'aide 🤝',
        'écoute': 'écoute 👂',
        'regarde': 'regarde 👀',
        'compte': 'compte 🔢',
        'lis': 'lis 📖',
      };

      Object.entries(emojiMap).forEach(([word, withEmoji]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        simplified = simplified.replace(regex, withEmoji);
      });

      // Mettre en cache
      setCache(prev => new Map(prev).set(text, simplified));

      setIsSimplifying(false);

      return {
        originalText: text,
        simplifiedText: simplified,
        isSimplified: true
      };

    } catch (error) {
      console.error('Erreur lors de la simplification:', error);
      setIsSimplifying(false);
      
      return {
        originalText: text,
        simplifiedText: text,
        isSimplified: false
      };
    }
  }, [isSimplificationEnabled, cache]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    simplifyText,
    isSimplifying,
    clearCache
  };
};