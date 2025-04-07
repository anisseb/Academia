export type Subject = {
  id: string;
  label: string;
  icon: string;
  gradient: [string, string];
  description: string;
  classes?: string[];
  filieres?: string[];
};

export const subjectsList: Subject[] = [
  // Matières générales
  {
    id: 'maths',
    label: 'Maths',
    icon: 'math-compass',
    gradient: ['#4c1d95', '#2563eb'],
    description: 'Algèbre, géométrie et plus',
    classes: [
      'cp', 'ce1', 'ce2', 'cm1', 'cm2', 'sixieme', 'cinquieme', 'quatrieme', 'troisieme',
      'seconde', 'premiere', 'terminale', 'high_technological_seconde_stmg',
      'high_technological_premiere_stmg', 'high_technological_terminale_stmg',
      'high_technological_seconde_st2s', 'high_technological_premiere_st2s',
      'high_technological_terminale_st2s', 'high_technological_seconde_sti2d',
      'high_technological_premiere_sti2d', 'high_technological_terminale_sti2d',
      'high_professional_seconde', 'high_professional_premiere', 'high_professional_terminale'
    ]
  },
  {
    id: 'physique-chimie',
    label: 'Physique Chimie',
    icon: 'atom',
    gradient: ['#0072ff', '#ff7300'],
    description: 'Physique chimie, électricité et ondes',
    classes: [
      'quatrieme', 'troisieme', 'seconde', 'premiere', 'terminale',
      'high_technological_seconde_sti2d', 'high_technological_premiere_sti2d',
      'high_technological_terminale_sti2d'
    ]
  },
  {
    id: 'svt',
    label: 'SVT',
    icon: 'dna',
    gradient: ['#065f46', '#059669'],
    description: 'Biologie et géologie',
    classes: [
      'sixieme', 'cinquieme', 'quatrieme', 'troisieme', 'seconde', 'premiere', 'terminale'
    ]
  },
  {
    id: 'french',
    label: 'Français',
    icon: 'book-open-page-variant',
    gradient: ['#1e40af', '#3b82f6'],
    description: 'Littérature et expression',
    classes: [
      'cp', 'ce1', 'ce2', 'cm1', 'cm2', 'sixieme', 'cinquieme', 'quatrieme', 'troisieme',
      'seconde', 'premiere', 'high_technological_seconde_stmg',
      'high_technological_premiere_stmg', 'high_technological_terminale_stmg',
      'high_technological_seconde_st2s', 'high_technological_premiere_st2s',
      'high_technological_terminale_st2s', 'high_technological_seconde_sti2d',
      'high_technological_premiere_sti2d', 'high_technological_terminale_sti2d',
      'high_professional_seconde', 'high_professional_premiere', 'high_professional_terminale'
    ]
  },
  {
    id: 'history',
    label: 'Histoire',
    icon: 'castle',
    gradient: ['#78350f', '#b45309'],
    description: 'De l\'antiquité à nos jours',
    classes: [
      'ce2', 'cm1', 'cm2', 'sixieme', 'cinquieme', 'quatrieme', 'troisieme',
      'seconde', 'premiere', 'high_technological_seconde_stmg',
      'high_technological_premiere_stmg', 'high_technological_terminale_stmg',
      'high_technological_seconde_st2s', 'high_technological_premiere_st2s',
      'high_technological_terminale_st2s', 'high_technological_seconde_sti2d',
      'high_technological_premiere_sti2d', 'high_technological_terminale_sti2d',
      'high_professional_seconde', 'high_professional_premiere', 'high_professional_terminale'
    ]
  },
  {
    id: 'english',
    label: 'Anglais',
    icon: 'translate',
    gradient: ['#831843', '#db2777'],
    description: 'Langue et culture anglophone',
    classes: [
      'ce1', 'ce2', 'cm1', 'cm2', 'sixieme', 'cinquieme', 'quatrieme', 'troisieme',
      'seconde', 'premiere', 'terminale', 'high_technological_seconde_stmg',
      'high_technological_premiere_stmg', 'high_technological_terminale_stmg',
      'high_technological_seconde_st2s', 'high_technological_premiere_st2s',
      'high_technological_terminale_st2s', 'high_technological_seconde_sti2d',
      'high_technological_premiere_sti2d', 'high_technological_terminale_sti2d',
      'high_professional_seconde', 'high_professional_premiere', 'high_professional_terminale'
    ]
  },
  {
    id: 'spanish',
    label: 'Espagnol',
    icon: 'translate',
    gradient: ['#c33d22', '#fdbb2d'],
    description: 'Langue et culture hispanique',
    classes: [
      'quatrieme', 'troisieme', 'seconde', 'premiere', 'terminale',
      'high_technological_seconde_stmg', 'high_technological_premiere_stmg',
      'high_technological_terminale_stmg', 'high_technological_seconde_st2s',
      'high_technological_premiere_st2s', 'high_technological_terminale_st2s',
      'high_technological_seconde_sti2d', 'high_technological_premiere_sti2d',
      'high_technological_terminale_sti2d', 'high_professional_seconde',
      'high_professional_premiere', 'high_professional_terminale'
    ]
  },
  {
    id: 'german',
    label: 'Allemand',
    icon: 'translate',
    gradient: ['#374151', '#4b5563'],
    description: 'Langue et culture allemande',
    classes: [
      'quatrieme', 'troisieme', 'seconde', 'premiere', 'terminale',
      'high_technological_seconde_stmg', 'high_technological_premiere_stmg',
      'high_technological_terminale_stmg', 'high_technological_seconde_st2s',
      'high_technological_premiere_st2s', 'high_technological_terminale_st2s',
      'high_technological_seconde_sti2d', 'high_technological_premiere_sti2d',
      'high_technological_terminale_sti2d', 'high_professional_seconde',
      'high_professional_premiere', 'high_professional_terminale'
    ]
  },
  {
    id: 'arabic',
    label: 'Arabe',
    icon: 'translate',
    gradient: ['#78350f', '#92400e'],
    description: 'Langue et culture arabe',
    classes: [
      'quatrieme', 'troisieme', 'seconde', 'premiere', 'terminale',
      'high_technological_seconde_stmg', 'high_technological_premiere_stmg',
      'high_technological_terminale_stmg', 'high_technological_seconde_st2s',
      'high_technological_premiere_st2s', 'high_technological_terminale_st2s',
      'high_technological_seconde_sti2d', 'high_technological_premiere_sti2d',
      'high_technological_terminale_sti2d', 'high_professional_seconde',
      'high_professional_premiere', 'high_professional_terminale'
    ]
  },
  {
    id: 'latin',
    label: 'Latin',
    icon: 'translate',
    gradient: ['#3f3f46', '#71717a'],
    description: 'Langue et civilisation romaine',
    classes: [
      'cinquieme', 'quatrieme', 'troisieme', 'seconde', 'premiere', 'terminale',
      'high_technological_seconde_stmg', 'high_technological_premiere_stmg',
      'high_technological_terminale_stmg', 'high_technological_seconde_st2s',
      'high_technological_premiere_st2s', 'high_technological_terminale_st2s',
      'high_technological_seconde_sti2d', 'high_technological_premiere_sti2d',
      'high_technological_terminale_sti2d', 'high_professional_seconde',
      'high_professional_premiere', 'high_professional_terminale'
    ]
  },
  {
    id: 'chinese',
    label: 'Chinois',
    icon: 'translate',
    gradient: ['#881337', '#e11d48'],
    description: 'Langue et culture chinoise',
    classes: [
      'quatrieme', 'troisieme', 'seconde', 'premiere', 'terminale',
      'high_technological_seconde_stmg', 'high_technological_premiere_stmg',
      'high_technological_terminale_stmg', 'high_technological_seconde_st2s',
      'high_technological_premiere_st2s', 'high_technological_terminale_st2s',
      'high_technological_seconde_sti2d', 'high_technological_premiere_sti2d',
      'high_technological_terminale_sti2d', 'high_professional_seconde',
      'high_professional_premiere', 'high_professional_terminale'
    ]
  },
  {
    id: 'philosophy',
    label: 'Philosophie',
    icon: 'brain',
    gradient: ['#1e3a8a', '#0ea5e9'],
    description: 'Philosophie et éthique',
    classes: [
      'terminale', 'high_technological_seconde_stmg', 'high_technological_premiere_stmg',
      'high_technological_terminale_stmg', 'high_technological_seconde_st2s',
      'high_technological_premiere_st2s', 'high_technological_terminale_st2s',
      'high_technological_seconde_sti2d', 'high_technological_premiere_sti2d',
      'high_technological_terminale_sti2d', 'high_professional_seconde',
      'high_professional_premiere', 'high_professional_terminale'
    ]
  },
  {
    id: 'emc',
    label: 'EMC',
    icon: 'scale-balance',
    gradient: ['#1e3a8a', '#3b82f6'],
    description: 'Enseignement moral et civique',
    classes: [
      'sixieme', 'cinquieme', 'quatrieme', 'troisieme', 'seconde', 'premiere', 'terminale',
      'high_professional_seconde', 'high_professional_premiere', 'high_professional_terminale'
    ]
  },

  // STMG
  {
    id: 'management',
    label: 'Management',
    icon: 'chart-timeline-variant',
    gradient: ['#0f766e', '#0d9488'],
    description: 'Sciences de gestion et numérique',
    classes: [
      'high_technological_seconde_stmg', 'high_technological_premiere_stmg',
      'high_technological_terminale_stmg'
    ]
  },
  {
    id: 'droit',
    label: 'Droit',
    icon: 'gavel',
    gradient: ['#7e22ce', '#a855f7'],
    description: 'Droit et économie',
    classes: [
      'high_technological_seconde_stmg', 'high_technological_premiere_stmg',
      'high_technological_terminale_stmg'
    ]
  },
  {
    id: 'gestion',
    label: 'Gestion',
    icon: 'finance',
    gradient: ['#0369a1', '#0ea5e9'],
    description: 'Gestion, finance et marketing',
    classes: [
      'high_technological_seconde_stmg', 'high_technological_premiere_stmg',
      'high_technological_terminale_stmg'
    ]
  },

  // ST2S
  {
    id: 'biologie_patho',
    label: 'Bio. Patho.',
    icon: 'microscope',
    gradient: ['#be185d', '#ec4899'],
    description: 'Biologie et physiopathologie humaines',
    classes: [
      'high_technological_seconde_st2s', 'high_technological_premiere_st2s',
      'high_technological_terminale_st2s'
    ]
  },
  {
    id: 'sciences_sociales',
    label: 'Sc. Sociales',
    icon: 'account-group',
    gradient: ['#0f766e', '#14b8a6'],
    description: 'Sciences et techniques sanitaires et sociales',
    classes: [
      'high_technological_seconde_st2s', 'high_technological_premiere_st2s',
      'high_technological_terminale_st2s'
    ]
  },

  // STI2D
  {
    id: 'innovation_tech',
    label: 'Innovation',
    icon: 'lightbulb-on',
    gradient: ['#c2410c', '#f97316'],
    description: 'Innovation technologique et éco-conception',
    classes: [
      'high_technological_seconde_sti2d', 'high_technological_premiere_sti2d',
      'high_technological_terminale_sti2d'
    ]
  },
  {
    id: 'dev_durable',
    label: 'Dév. Durable',
    icon: 'leaf',
    gradient: ['#15803d', '#22c55e'],
    description: 'Ingénierie et développement durable',
    classes: [
      'high_technological_seconde_sti2d', 'high_technological_premiere_sti2d',
      'high_technological_terminale_sti2d'
    ]
  },
  {
    id: 'systemes_info',
    label: 'Sys. Info',
    icon: 'desktop-classic',
    gradient: ['#0c4a6e', '#0ea5e9'],
    description: 'Systèmes d\'information et numérique',
    classes: [
      'high_technological_seconde_sti2d', 'high_technological_premiere_sti2d',
      'high_technological_terminale_sti2d'
    ]
  },

  // STD2A
  {
    id: 'design',
    label: 'Design',
    icon: 'palette',
    gradient: ['#831843', '#ec4899'],
    description: 'Design et arts appliqués',
    classes: [
      'high_technological_seconde_std2a', 'high_technological_premiere_std2a',
      'high_technological_terminale_std2a'
    ]
  },
  {
    id: 'tech_conception',
    label: 'Tech. Design',
    icon: 'pencil-ruler',
    gradient: ['#9f1239', '#f43f5e'],
    description: 'Technologies de conception',
    classes: [
      'high_technological_seconde_std2a', 'high_technological_premiere_std2a',
      'high_technological_terminale_std2a'
    ]
  },

  // STAV
  {
    id: 'agronomie',
    label: 'Agronomie',
    icon: 'sprout',
    gradient: ['#3f6212', '#84cc16'],
    description: 'Agronomie, alimentation, environnement',
    classes: [
      'high_technological_seconde_stav', 'high_technological_premiere_stav',
      'high_technological_terminale_stav'
    ]
  },
  {
    id: 'prod_agricole',
    label: 'Prod. Agricole',
    icon: 'tractor',
    gradient: ['#4d7c0f', '#a3e635'],
    description: 'Sciences et techniques de la production agricole',
    classes: [
      'high_technological_seconde_stav', 'high_technological_premiere_stav',
      'high_technological_terminale_stav'
    ]
  },

  // STL
  {
    id: 'physique_chimie',
    label: 'Phys-Chimie',
    icon: 'flask',
    gradient: ['#9333ea', '#d946ef'],
    description: 'Physique-chimie et mathématiques appliquées',
    classes: [
      'high_technological_seconde_stl', 'high_technological_premiere_stl',
      'high_technological_terminale_stl'
    ]
  },
  {
    id: 'biotech',
    label: 'Biotech',
    icon: 'dna',
    gradient: ['#0f766e', '#2dd4bf'],
    description: 'Biotechnologies et sciences de laboratoire',
    classes: [
      'high_technological_seconde_stl', 'high_technological_premiere_stl',
      'high_technological_terminale_stl'
    ]
  },

  // S2TMD
  {
    id: 'theatre',
    label: 'Théâtre',
    icon: 'drama-masks',
    gradient: ['#7e22ce', '#c084fc'],
    description: 'Pratique et culture du théâtre',
    classes: [
      'high_technological_seconde_s2tmd', 'high_technological_premiere_s2tmd',
      'high_technological_terminale_s2tmd'
    ]
  },
  {
    id: 'musique',
    label: 'Musique',
    icon: 'music',
    gradient: ['#6b21a8', '#a855f7'],
    description: 'Théorie et pratique musicale',
    classes: [
      'high_technological_seconde_s2tmd', 'high_technological_premiere_s2tmd',
      'high_technological_terminale_s2tmd'
    ]
  },
  {
    id: 'danse',
    label: 'Danse',
    icon: 'human-handsup',
    gradient: ['#581c87', '#9333ea'],
    description: 'Théorie et pratique de la danse',
    classes: [
      'high_technological_seconde_s2tmd', 'high_technological_premiere_s2tmd',
      'high_technological_terminale_s2tmd'
    ]
  },
];


export const getSubjectInfo = (subjectId: string): Subject => {
  const subject = subjectsList.find(s => s.id === subjectId);
  return subject || { 
    id: subjectId, 
    label: subjectId, 
    icon: 'book', 
    gradient: ['#374151', '#4b5563'],
    description: 'Matière non définie',
    classes: []
  };
}; 