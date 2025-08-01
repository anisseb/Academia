export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  maxProgress: number;
  progress?: number;
  imagePath?: any;
}

export const COURSE_PROGRESSION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_course',
    title: 'Premier cours',
    description: 'Ouvrir son premier cours',
    icon: '🎓',
    category: 'Progression dans les cours',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/cours/first_course.webp')
  },
  {
    id: 'scholar',
    title: 'Savant en herbe',
    description: 'Ouvrir 10 cours différents',
    icon: '📚',
    category: 'Progression dans les cours',
    maxProgress: 10,
    imagePath: require('../../assets/images/success/cours/scholar.webp')
  },
  {
    id: 'daily_expert',
    title: 'Expert du jour',
    description: 'Ouvrir un cours pendant 7 jours consécutifs',
    icon: '🔥',
    category: 'Progression dans les cours',
    maxProgress: 7,
    imagePath: require('../../assets/images/success/cours/daily_expert.webp')
  }
];

export const EXERCISE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_quiz',
    title: 'Premier QCM',
    description: 'Terminer un premier QCM',
    icon: '✅',
    category: 'QCM',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/exercices/first_quiz.webp')
  },
  {
    id: 'perfectionist',
    title: 'Perfectionniste',
    description: 'Obtenir 100% à un QCM',
    icon: '💯',
    category: 'QCM',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/exercices/perfectionist.webp')
  },
  {
    id: 'perfect_series',
    title: 'Série parfaite',
    description: 'Réussir 5 QCM d\'affilée avec plus de 80%',
    icon: '🔥',
    category: 'QCM',
    maxProgress: 5,
    imagePath: require('../../assets/images/success/exercices/perfect_series.webp')
  },
  {
    id: 'level_explorer',
    title: 'Explorateur de niveaux',
    description: 'Faire un QCM facile, moyen et difficile',
    icon: '🎲',
    category: 'QCM',
    maxProgress: 3,
    imagePath: require('../../assets/images/success/exercices/level_explorer.webp')
  },
  {
    id: 'scientific_rigor',
    title: 'Scientifique rigoureux',
    description: 'Compléter tous les QCM d\'une matière',
    icon: '🧪',
    category: 'QCM',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/exercices/scientific_rigor.webp')
  }
];

export const IA_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'curious',
    title: 'Curieux',
    description: 'Poser 5 questions à l\'IA',
    icon: '🤖',
    category: 'Interaction avec l\'IA',
    maxProgress: 5,
    imagePath: require('../../assets/images/success/IA/curious.webp')
  },
  {
    id: 'scanner_genius',
    title: 'Scanner de génie',
    description: 'Utiliser la fonction "scanner un exercice papier"',
    icon: '📷',
    category: 'Interaction avec l\'IA',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/IA/scanner_genius.webp')
  },
  {
    id: 'scanner_documents',
    title: 'Scanner de documents',
    description: 'Utiliser la fonction scanner 10 fois',
    icon: '📄',
    category: 'Interaction avec l\'IA',
    maxProgress: 10,
    imagePath: require('../../assets/images/success/IA/scanner_documents.webp')
  },
  {
    id: 'homework_helper',
    title: 'Aide aux devoirs',
    description: 'Obtenir de l\'aide via l\'IA dans toutes les matières',
    icon: '💬',
    category: 'Interaction avec l\'IA',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/IA/homework_helper.webp')
  },
  {
    id: 'all_professors',
    title: 'Posez une question à tous les professeurs',
    description: 'Poser une question à au moins tous les professeurs',
    icon: '🧑‍🎤',
    category: 'Interaction avec l\'IA',
    maxProgress: 3,
    imagePath: require('../../assets/images/success/IA/all_professors.webp')
  }
];

export const AFFILIATION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_affiliation',
    title: 'Première affiliation',
    description: 'Obtenir sa première affiliation',
    icon: '🤝',
    category: 'Affiliation',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/affiliation/parrain.webp')
  },
  {
    id: 'affiliation_networker',
    title: 'Réseauteur',
    description: 'Obtenir 5 affiliations',
    icon: '🌐',
    category: 'Affiliation',
    maxProgress: 5,
    imagePath: require('../../assets/images/success/affiliation/super_parrain.webp')
  },
  {
    id: 'affiliation_expert',
    title: 'Expert en affiliation',
    description: 'Obtenir 10 affiliations',
    icon: '⭐',
    category: 'Affiliation',
    maxProgress: 10,
    imagePath: require('../../assets/images/success/affiliation/parrain_pro.webp')
  },
  {
    id: 'affiliation_master',
    title: 'Maître de l\'affiliation',
    description: 'Obtenir 20 affiliations',
    icon: '👑',
    category: 'Affiliation',
    maxProgress: 20,
    imagePath: require('../../assets/images/success/affiliation/parain_final.webp')
  }
];

export const SPECIAL_BADGES_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'daily_quest_master',
    title: 'Maître des quêtes',
    description: 'Compléter 20 quêtes quotidiennes',
    icon: '🎯',
    category: 'Badges spéciaux',
    maxProgress: 20,
    imagePath: require('../../assets/images/success/special_badges/daily_quest_master.webp')
  },
  {
    id: 'all_terrain',
    title: 'Tout-terrain',
    description: 'Faire un QCM dans 5 matières différentes',
    icon: '🧩',
    category: 'Badges spéciaux',
    maxProgress: 5,
    imagePath: require('../../assets/images/success/special_badges/all_terrain.webp')
  },
  {
    id: 'perseverant',
    title: 'Persévérant',
    description: 'Réessayer un QCM 3 fois pour le réussir',
    icon: '🐢',
    category: 'Badges spéciaux',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/special_badges/perseverant.webp')
  },
  {
    id: 'analyst',
    title: 'Analyste',
    description: 'Consulter son tableau de progression chaque semaine durant 5 semaines',
    icon: '📊',
    category: 'Badges spéciaux',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/special_badges/analyst.webp')
  },
  {
    id: 'sharer',
    title: 'Partageur',
    description: 'Partager son cours à un ami',
    icon: '💌',
    category: 'Badges spéciaux',
    maxProgress: 10,
    imagePath: require('../../assets/images/success/special_badges/sharer.webp')
  },
  {
    id: 'suggester',
    title: 'Suggestionnaire',
    description: 'Donner une idée d\'amélioration pour l\'app',
    icon: '📝',
    category: 'Badges spéciaux',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/special_badges/suggester.webp')
  },
  {
    id: 'satisfaction',
    title: 'Satisfaction',
    description: 'Remplir l\'enquête de satisfaction de l\'app',
    icon: '💡',
    category: 'Badges spéciaux',
    maxProgress: 1,
    imagePath: require('../../assets/images/success/special_badges/satisfaction.webp')
  }
];


