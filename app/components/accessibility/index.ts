// Contexte et types
export { AccessibilityProvider, useAccessibility } from '../../context/AccessibilityContext';
export type { AccessibilitySettings } from '../../context/AccessibilityContext';

// Composants principaux
export { AccessibleText } from '../AccessibleText';
export { AudioIcon } from '../AudioIcon';

// Hooks
export { useDysFont } from '../../hooks/useDysFont';
export { useTextSimplification, textSimplificationService } from '../../services/textSimplificationService';
export type { SimplificationResult } from '../../services/textSimplificationService';

// Exemple d'utilisation
export { ExampleExercisePage } from '../ExampleUsage';