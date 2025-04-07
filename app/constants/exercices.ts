export type Exercices = {
    id: string;
    title: string;
    difficulty: string;
    questions: {
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
    }[];
};

export const exercices: Exercices[] = [
  {
    "id": "ex1",
    "title": "Introduction aux Nombres Réels",
    "difficulty": "facile",
    "questions": [
      {
        "id": "q1",
        "question": "Quel est le plus petit nombre réel positif ?",
        "options": ["0", "1", "-1", "Il n'existe pas"],
        "correctAnswer": 3,
        "explanation": "Il n'existe pas de plus petit nombre réel positif, car on peut toujours trouver un nombre plus petit entre 0 et un nombre positif."
      },
      {
        "id": "q2",
        "question": "Quelle est la valeur absolue de -5 ?",
        "options": ["-5", "5", "0", "25"],
        "correctAnswer": 1,
        "explanation": "La valeur absolue de -5 est 5, car la valeur absolue d'un nombre est sa distance par rapport à zéro."
      },
      {
        "id": "q3",
        "question": "Quel est le résultat de \( \frac{1}{2} + \frac{1}{3} \) ?",
        "options": ["\\(\\frac{1}{6}\\)", "\\(\\frac{5}{6}\\)", "\\(\\frac{2}{5}\\)", "\\(\\frac{3}{5}\\)"],
        "correctAnswer": 1,
        "explanation": "Pour additionner les fractions, on trouve un dénominateur commun : \( \\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6} \)."
      },
      {
        "id": "q4",
        "question": "Quel est le plus grand nombre entre \( \sqrt{2} \) et \( \frac{3}{2} \) ?",
        "options": ["\\(\\sqrt{2}\\)", "\\(\\frac{3}{2}\\)", "Ils sont égaux", "Aucun des deux"],
        "correctAnswer": 1,
        "explanation": "On sait que \( \\sqrt{2} \approx 1.414 \) et \( \\frac{3}{2} = 1.5 \), donc \( \\frac{3}{2} \) est plus grand."
      },
      {
        "id": "q5",
        "question": "Quel est le produit de \( -2 \times 3 \) ?",
        "options": ["-6", "6", "-1", "1"],
        "correctAnswer": 0,
        "explanation": "Le produit de -2 et 3 est -6, car le produit d'un nombre négatif et d'un nombre positif est négatif."
      },
      {
        "id": "q6",
        "question": "Quel est le résultat de \( 4^2 \) ?",
        "options": ["8", "16", "4", "2"],
        "correctAnswer": 1,
        "explanation": "Le carré de 4 est 16, car \( 4^2 = 4 \times 4 = 16 \)."
      },
      {
        "id": "q7",
        "question": "Quel est le quotient de \( 10 \div 0.5 \) ?",
        "options": ["20", "5", "0.5", "2"],
        "correctAnswer": 0,
        "explanation": "Le quotient de 10 par 0.5 est 20, car \( 10 \div 0.5 = 10 \times 2 = 20 \)."
      },
      {
        "id": "q8",
        "question": "Quel est le nombre réel entre 3 et 4 ?",
        "options": ["3.5", "4", "3", "Il y en a plusieurs"],
        "correctAnswer": 3,
        "explanation": "Il existe une infinité de nombres réels entre 3 et 4, par exemple 3.1, 3.14, 3.999, etc."
      },
      {
        "id": "q9",
        "question": "Quel est le résultat de \( 0.1 + 0.2 \) ?",
        "options": ["0.3", "0.30000000000000004", "0.21", "0.4"],
        "correctAnswer": 0,
        "explanation": "L'addition de 0.1 et 0.2 donne 0.3."
      },
      {
        "id": "q10",
        "question": "Quel est le plus petit nombre parmi \( -2, -1, 0, 1 \) ?",
        "options": ["-2", "-1", "0", "1"],
        "correctAnswer": 0,
        "explanation": "-2 est le plus petit nombre parmi les options données."
      }
    ]
  },
  {
    "id": "ex2",
    "title": "Comparaison de Nombres Réels",
    "difficulty": "moyen",
    "questions": [
      {
        "id": "q1",
        "question": "Quel est le résultat de \( 3 - 5 \times 2 \) ?",
        "options": ["-7", "1", "-1", "7"],
        "correctAnswer": 0,
        "explanation": "En respectant l'ordre des opérations, on calcule d'abord la multiplication : \( 3 - 5 \times 2 = 3 - 10 = -7 \)."
      },
      {
        "id": "q2",
        "question": "Quel est le résultat de \( (2^3)^2 \) ?",
        "options": ["64", "8", "16", "9"],
        "correctAnswer": 0,
        "explanation": "On calcule d'abord \( 2^3 = 8 \), puis \( 8^2 = 64 \)."
      },
      {
        "id": "q3",
        "question": "Quel est le résultat de \( 10 \mod 3 \) ?",
        "options": ["1", "3", "0", "2"],
        "correctAnswer": 1,
        "explanation": "Le reste de la division de 10 par 3 est 1, car \( 10 = 3 \times 3 + 1 \)."
      },
      {
        "id": "q4",
        "question": "Quel est le résultat de \( \sqrt{81} \) ?",
        "options": ["9", "3", "8", "81"],
        "correctAnswer": 0,
        "explanation": "La racine carrée de 81 est 9, car \( 9^2 = 81 \)."
      },
      {
        "id": "q5",
        "question": "Quel est le résultat de \( 0.5 \times 0.4 \) ?",
        "options": ["0.2", "0.02", "2", "0.9"],
        "correctAnswer": 0,
        "explanation": "Le produit de 0.5 et 0.4 est 0.2."
      },
      {
        "id": "q6",
        "question": "Quel est le résultat de \( 2 + 3 \times (4 - 1) \) ?",
        "options": ["11", "13", "9", "14"],
        "correctAnswer": 0,
        "explanation": "On calcule d'abord l'expression entre parenthèses, puis la multiplication : \( 2 + 3 \times 3 = 2 + 9 = 11 \)."
      },
      {
        "id": "q7",
        "question": "Quel est le résultat de \( \frac{5}{6} - \frac{1}{3} \) ?",
        "options": ["\\(\\frac{1}{2}\\)", "\\(\\frac{1}{6}\\)", "\\(\\frac{7}{6}\\)", "\\(\\frac{2}{3}\\)"],
        "correctAnswer": 0,
        "explanation": "Pour soustraire les fractions, on trouve un dénominateur commun : \( \\frac{5}{6} - \\frac{1}{3} = \\frac{5}{6} - \\frac{2}{6} = \\frac{3}{6} = \\frac{1}{2} \)."
      },
      {
        "id": "q8",
        "question": "Quel est le résultat de \( 2^{3^2} \) ?",
        "options": ["512", "64", "9", "8"],
        "correctAnswer": 0,
        "explanation": "On calcule d'abord l'exposant : \( 3^2 = 9 \), puis \( 2^9 = 512 \)."
      },
      {
        "id": "q9",
        "question": "Quel est le résultat de \( 10 \div 0.2 \) ?",
        "options": ["50", "0.5", "2", "0.02"],
        "correctAnswer": 0,
        "explanation": "Le quotient de 10 par 0.2 est 50, car \( 10 \div 0.2 = 10 \times 5 = 50 \)."
      },
      {
        "id": "q10",
        "question": "Quel est le résultat de \( 3.5 \times 2 \) ?",
        "options": ["7", "6", "7.5", "8"],
        "correctAnswer": 0,
        "explanation": "Le produit de 3.5 et 2 est 7."
      }
    ]
  },
  {
    "id": "ex3",
    "title": "Opérations Avancées sur les Nombres Réels",
    "difficulty": "difficile",
    "questions": [
      {
        "id": "q1",
        "question": "Quel est le résultat de \( \sqrt{2} \times \sqrt{3} \) ?",
        "options": ["\\(\\sqrt{6}\\)", "\\(\\sqrt{5}\\)", "\\(\\sqrt{2}\\)", "\\(\\sqrt{3}\\)"],
        "correctAnswer": 0,
        "explanation": "Le produit de \( \\sqrt{2} \) et \( \\sqrt{3} \) est \( \\sqrt{6} \), car \( \\sqrt{2} \times \\sqrt{3} = \\sqrt{2 \times 3} = \\sqrt{6} \)."
      },
      {
        "id": "q2",
        "question": "Quel est le résultat de \( \frac{1}{2} + \frac{2}{3} + \frac{3}{4} \) ?",
        "options": ["\\(\\frac{23}{12}\\)", "\\(\\frac{13}{12}\\)", "\\(\\frac{11}{12}\\)", "\\(\\frac{17}{12}\\)"],
        "correctAnswer": 0,
        "explanation": "Pour additionner les fractions, on trouve un dénominateur commun : \( \\frac{1}{2} + \\frac{2}{3} + \\frac{3}{4} = \\frac{6}{12} + \\frac{8}{12} + \\frac{9}{12} = \\frac{23}{12} \)."
      },
      {
        "id": "q3",
        "question": "Quel est le résultat de \( 2.5 \times 1.2 \) ?",
        "options": ["3", "3.5", "2.4", "4"],
        "correctAnswer": 0,
        "explanation": "Le produit de 2.5 et 1.2 est 3."
      },
      {
        "id": "q4",
        "question": "Quel est le résultat de \( 0.33 \div 0.11 \) ?",
        "options": ["3", "0.3", "3.3", "0.03"],
        "correctAnswer": 0,
        "explanation": "Le quotient de 0.33 par 0.11 est 3."
      },
      {
        "id": "q5",
        "question": "Quel est le résultat de \( 5 \times (2^3 - 3) \) ?",
        "options": ["35", "40", "25", "50"],
        "correctAnswer": 0,
        "explanation": "On calcule d'abord l'exposant, puis la soustraction : \( 5 \times (8 - 3) = 5 \times 5 = 25 \)."
      },
      {
        "id": "q6",
        "question": "Quel est le résultat de \( \frac{4}{5} \times \frac{5}{8} \) ?",
        "options": ["\\(\\frac{1}{2}\\)", "\\(\\frac{1}{4}\\)", "\\(\\frac{1}{8}\\)", "\\(\\frac{1}{10}\\)"],
        "correctAnswer": 0,
        "explanation": "Le produit de \( \\frac{4}{5} \) et \( \\frac{5}{8} \) est \( \\frac{1}{2} \), car \( \\frac{4}{5} \times \\frac{5}{8} = \\frac{4 \times 5}{5 \times 8} = \\frac{1}{2} \)."
      },
      {
        "id": "q7",
        "question": "Quel est le résultat de \( 3.14 \times 10^2 \) ?",
        "options": ["314", "31.4", "3140", "3.14"],
        "correctAnswer": 0,
        "explanation": "Le produit de 3.14 et \( 10^2 \) est 314."
      },
      {
        "id": "q8",
        "question": "Quel est le résultat de \( 0.5 \times 0.5 \times 0.5 \) ?",
        "options": ["0.125", "0.25", "0.5", "1"],
        "correctAnswer": 0,
        "explanation": "Le produit de 0.5 par lui-même trois fois est 0.125."
      },
      {
        "id": "q9",
        "question": "Quel est le résultat de \( 7 \mod 5 \) ?",
        "options": ["2", "1", "0", "3"],
        "correctAnswer": 0,
        "explanation": "Le reste de la division de 7 par 5 est 2, car \( 7 = 5 \times 1 + 2 \)."
      },
      {
        "id": "q10",
        "question": "Quel est le résultat de \( \sqrt{2} + \sqrt{3} \) ?",
        "options": ["\\(\\sqrt{5}\\)", "\\(\\sqrt{6}\\)", "Il n'est pas simplifiable", "\\(\\sqrt{1}\\)"],
        "correctAnswer": 2,
        "explanation": "La somme de \( \\sqrt{2} \) et \( \\sqrt{3} \) ne peut pas être simplifiée en un seul radical."
      }
    ]
  }
];