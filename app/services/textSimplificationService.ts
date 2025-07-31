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
      'justifier': 'expliquer pourquoi',
      'analyser': 'regarder',
      'observer': 'regarder',
      'compléter': 'finir',
      'rédiger': 'écrire',
      'préciser': 'dire',
      'indiquer': 'dire',
      'mentionner': 'dire',
      'utiliser': 'prendre',
      'employer': 'prendre',
      'procéder': 'faire',
      'commencer': 'débuter',
      'terminer': 'finir',
      'néanmoins': 'mais',
      'cependant': 'mais',
      'toutefois': 'mais',
      'par conséquent': 'donc',
      'en outre': 'aussi',
      'de plus': 'aussi',
      'en effet': 'car',
      'ainsi': 'donc',
    };

    // Appliquer les remplacements
    Object.entries(replacements).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      simplified = simplified.replace(regex, simple);
    });

    // Simplifier les phrases trop longues
    simplified = this.simplifyLongSentences(simplified);

    // Simplifier la ponctuation excessive
    simplified = simplified.replace(/[;:]/g, '.');
    simplified = simplified.replace(/\.{2,}/g, '.');

    return simplified.trim();
  }

  private simplifyLongSentences(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return sentences.map(sentence => {
      const words = sentence.trim().split(/\s+/);
      
      // Si la phrase est très longue, essayer de la diviser
      if (words.length > 15) {
        // Chercher des connecteurs pour diviser
        const connectors = ['et', 'ou', 'mais', 'car', 'donc', 'puis', 'ensuite'];
        
        for (const connector of connectors) {
          const connectorIndex = words.findIndex(word => 
            word.toLowerCase() === connector
          );
          
          if (connectorIndex > 3 && connectorIndex < words.length - 3) {
            const firstPart = words.slice(0, connectorIndex).join(' ');
            const secondPart = words.slice(connectorIndex).join(' ');
            return `${firstPart}. ${secondPart.charAt(0).toUpperCase()}${secondPart.slice(1)}`;
          }
        }
      }
      
      return sentence.trim();
    }).join('. ') + '.';
  }

  private isAlreadySimple(text: string): boolean {
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Considérer comme simple si :
    // - Longueur moyenne des mots < 6
    // - Moins de 10 mots au total
    // - Pas de ponctuation complexe
    return avgWordLength < 6 || 
           words.length < 10 || 
           !/[;:,]/.test(text);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const textSimplificationService = new TextSimplificationService();

// Hook pour utiliser le service avec le contexte d'accessibilité
export const useTextSimplification = () => {
  const { settings } = useAccessibility();

  const simplifyText = async (text: string): Promise<SimplificationResult> => {
    return textSimplificationService.simplifyText(
      text, 
      settings.isAutoSimplificationEnabled
    );
  };

  return {
    simplifyText,
    isAutoSimplificationEnabled: settings.isAutoSimplificationEnabled,
  };
};