import { useAccessibility } from '../context/AccessibilityContext';

export interface SimplificationResult {
  originalText: string;
  simplifiedText: string;
  isSimplified: boolean;
}

class TextSimplificationService {
  private cache: Map<string, string> = new Map();

  async simplifyText(
    text: string, 
    isAutoSimplificationEnabled: boolean
  ): Promise<SimplificationResult> {
    // Si la simplification automatique n'est pas activée, retourner le texte original
    if (!isAutoSimplificationEnabled) {
      return {
        originalText: text,
        simplifiedText: text,
        isSimplified: false,
      };
    }

    // Vérifier le cache
    const cacheKey = text.trim();
    if (this.cache.has(cacheKey)) {
      return {
        originalText: text,
        simplifiedText: this.cache.get(cacheKey)!,
        isSimplified: true,
      };
    }

    try {
      // Nettoyer le texte d'entrée
      const cleanText = text.trim();
      
      // Si le texte est déjà court et simple, ne pas le simplifier
      if (cleanText.length < 50 || this.isAlreadySimple(cleanText)) {
        return {
          originalText: text,
          simplifiedText: text,
          isSimplified: false,
        };
      }

      // Créer une version simplifiée localement pour l'instant
      // Dans une vraie implémentation, on utiliserait l'API Mistral existante
      const simplifiedText = await this.performSimplification(cleanText);

      // Mettre en cache
      this.cache.set(cacheKey, simplifiedText);

      return {
        originalText: text,
        simplifiedText,
        isSimplified: true,
      };
    } catch (error) {
      console.error('Erreur lors de la simplification du texte:', error);
      return {
        originalText: text,
        simplifiedText: text,
        isSimplified: false,
      };
    }
  }

  private async performSimplification(text: string): Promise<string> {
    // Pour l'instant, on fait une simplification basique
    // Dans une vraie implémentation, on utiliserait l'API Mistral du projet
    return this.basicSimplification(text);
  }

  private basicSimplification(text: string): string {
    let simplified = text;

    // Remplacer les mots complexes par des mots plus simples
    const replacements: { [key: string]: string } = {
      'effectuer': 'faire',
      'réaliser': 'faire',
      'déterminer': 'trouver',
      'identifier': 'trouver',
      'calculer': 'compter',
      'résoudre': 'résoudre',
      'démontrer': 'montrer',
      'observer': 'regarder',
      'examiner': 'regarder',
      'analyser': 'regarder bien',
      'utiliser': 'prendre',
      'compléter': 'finir',
      'sélectionner': 'choisir',
      'nécessaire': 'qu\'il faut',
      'approprié': 'qui va bien',
      'correct': 'bon',
      'incorrect': 'pas bon',
      'suivant': 'après',
      'précédent': 'avant',
      'maintenant': 'now',
      'cependant': 'mais',
      'néanmoins': 'mais',
      'par conséquent': 'donc',
      'en effet': 'oui',
      'notamment': 'surtout',
      'particulièrement': 'surtout',
      'spécialement': 'surtout',
    };

    // Appliquer les remplacements
    Object.entries(replacements).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      simplified = simplified.replace(regex, simple);
    });

    // Diviser les phrases très longues
    if (simplified.length > 120) {
      simplified = this.splitLongSentences(simplified);
    }

    // Simplifier la ponctuation excessive
    simplified = simplified.replace(/[;:]/g, '.');
    simplified = simplified.replace(/\.\.\./g, '...');
    simplified = simplified.replace(/\.{4,}/g, '...');

    // Ajouter des émojis pour rendre plus ludique (optionnel)
    simplified = this.addHelpfulEmojis(simplified);

    return simplified.trim();
  }

  private splitLongSentences(text: string): string {
    const sentences = text.split(/[.!?]+/);
    const processedSentences = sentences.map(sentence => {
      if (sentence.trim().length > 80 && sentence.includes(',')) {
        // Diviser les phrases longues avec des virgules
        const parts = sentence.split(',').map(part => part.trim()).filter(part => part.length > 0);
        if (parts.length > 2) {
          return parts.join('.\n') + '.';
        }
      }
      return sentence.trim();
    }).filter(s => s.length > 0);

    return processedSentences.join('. ');
  }

  private addHelpfulEmojis(text: string): string {
    const emojiMap: { [key: string]: string } = {
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
      'écris': 'écris ✏️',
      'calcule': 'calcule 🧮',
    };

    Object.entries(emojiMap).forEach(([word, withEmoji]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      text = text.replace(regex, withEmoji);
    });

    return text;
  }

  private isAlreadySimple(text: string): boolean {
    // Vérifier si le texte contient des mots complexes
    const complexWords = [
      'effectuer', 'réaliser', 'déterminer', 'identifier', 'analyser',
      'examiner', 'particulièrement', 'spécialement', 'notamment',
      'cependant', 'néanmoins', 'par conséquent', 'nécessaire',
      'approprié'
    ];

    const hasComplexWords = complexWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );

    // Vérifier la longueur moyenne des mots
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    // Considérer comme simple si pas de mots complexes et mots courts
    return !hasComplexWords && avgWordLength < 6;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Instance singleton du service
export const textSimplificationService = new TextSimplificationService();

// Hook pour utiliser le service de simplification
export const useTextSimplification = () => {
  const { settings } = useAccessibility();
  
  const simplifyText = async (text: string): Promise<SimplificationResult> => {
    return textSimplificationService.simplifyText(text, settings.isAutoSimplificationEnabled);
  };

  return {
    simplifyText,
    isAutoSimplificationEnabled: settings.isAutoSimplificationEnabled,
    clearCache: textSimplificationService.clearCache,
  };
};