/**
 * Extrait les couleurs d'un gradient sous forme de chaîne de caractères
 * @param gradientString - Chaîne de caractères contenant le gradient (ex: "linear-gradient(to right, #4c1d95, #2563eb)")
 * @returns Un tableau de deux couleurs hexadécimales
 */
export const parseGradient = (gradientString: string): [string, string] => {
  const colors = gradientString.match(/#[0-9a-fA-F]{6}/g);
  if (colors && colors.length >= 2) {
    return [colors[0], colors[1]];
  }
  return ['#60a5fa', '#3b82f6']; // Valeur par défaut
}; 