
export const parseGradient = (gradientString: string): [string, string] => {
    const colors = gradientString.match(/#[0-9a-fA-F]{6}/g);
    if (colors && colors.length >= 2) {
      return [colors[0], colors[1]];
    }
    return ['#60a5fa', '#3b82f6']; // Valeur par défaut
  };
