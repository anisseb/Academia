import { Subject, subjectsList } from './subjects';

export type Country = {
  id: string;
  name: string;
  flag: string;
};

export type Class = {
  id: string;
  label: string;
};

export type TechnologicalSection = {
  id: string;
  label: string;
  description: string;
  classes: Class[];
};

export type SchoolType = {
  id: string;
  label: string;
  classes?: Class[] | string[];
  sections?: TechnologicalSection[];
};

export const countries: Country[] = [
  { id: 'fr', name: 'France', flag: '🇫🇷' },
  { id: 'be', name: 'Belgique', flag: '🇧🇪' },
  { id: 'ch', name: 'Suisse', flag: '🇨🇭' },
  { id: 'ca', name: 'Canada', flag: '🇨🇦' },
  { id: 'ma', name: 'Maroc', flag: '🇲🇦' },
  { id: 'dz', name: 'Algérie', flag: '🇩🇿' },
  { id: 'tn', name: 'Tunisie', flag: '🇹🇳' },
  { id: 'sn', name: 'Sénégal', flag: '🇸🇳' },
  { id: 'ci', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { id: 'cm', name: 'Cameroun', flag: '🇨🇲' },
];

export const technologicalSections: TechnologicalSection[] = [
  {
    id: 'stmg',
    label: 'STMG',
    description: 'Sciences et Technologies du Management et de la Gestion',
    classes: [
      {
        id: 'high_technological_seconde_stmg',
        label: 'Seconde STMG'
      },
      {
        id: 'high_technological_premiere_stmg',
        label: 'Première STMG'
      },
      {
        id: 'high_technological_terminale_stmg',
        label: 'Terminale STMG'
      }
    ]
  },
  {
    id: 'st2s',
    label: 'ST2S',
    description: 'Sciences et Technologies de la Santé et du Social',
    classes: [
      {
        id: 'high_technological_seconde_st2s',
        label: 'Seconde ST2S'
      },
      {
        id: 'high_technological_premiere_st2s',
        label: 'Première ST2S'
      },
      {
        id: 'high_technological_terminale_st2s',
        label: 'Terminale ST2S'
      }
    ]
  },
  {
    id: 'sti2d',
    label: 'STI2D',
    description: 'Sciences et Technologies de l\'Industrie et du Développement Durable',
    classes: [
      {
        id: 'high_technological_seconde_sti2d',
        label: 'Seconde STI2D'
      },
      {
        id: 'high_technological_premiere_sti2d',
        label: 'Première STI2D'
      },
      {
        id: 'high_technological_terminale_sti2d',
        label: 'Terminale STI2D'
      }
    ]
  }
];

export const schoolTypes: SchoolType[] = [
  {
    id: 'primary',
    label: 'École primaire',
    classes: [
      {
        id: 'cp',
        label: 'CP'
      },
      {
        id: 'ce1',
        label: 'CE1'
      },
      {
        id: 'ce2',
        label: 'CE2'
      },
      {
        id: 'cm1',
        label: 'CM1'
      },
      {
        id: 'cm2',
        label: 'CM2'
      }
    ]
  },
  {
    id: 'middle',
    label: 'Collège',
    classes: [
      {
        id: 'sixieme',
        label: '6ème'
      },
      {
        id: 'cinquieme',
        label: '5ème'
      },
      {
        id: 'quatrieme',
        label: '4ème'
      },
      {
        id: 'troisieme',
        label: '3ème'
      }
    ]
  },
  {
    id: 'high_general',
    label: 'Lycée général',
    classes: [
      {
        id: 'seconde',
        label: 'Seconde'
      },
      {
        id: 'premiere',
        label: 'Première'
      },
      {
        id: 'terminale',
        label: 'Terminale'
      }
    ]
  },
  {
    id: 'high_technological',
    label: 'Lycée technologique',
    sections: technologicalSections
  },
  {
    id: 'high_professional',
    label: 'Lycée professionnel',
    classes: [
      {
        id: 'high_professional_seconde',
        label: 'Seconde Pro'
      },
      {
        id: 'high_professional_premiere',
        label: 'Première Pro'
      },
      {
        id: 'high_professional_terminale',
        label: 'Terminale Pro'
      }
    ]
  }
];
  
export const getSubjectInfo = (subjectId: string): Subject => {
  const subject = subjectsList.find(s => s.id === subjectId);
  return subject || { 
    id: subjectId, 
    label: subjectId, 
    icon: 'book', 
    gradient: ['#374151', '#4b5563'],
    filieres: [''],
    description: 'Matière non définie'
  };
};

export const getAvailableSubjects = (schoolTypeId: string, classId: string, sectionId?: string): string[] => {
  const fullClassId = sectionId ? `${classId}_${sectionId}` : classId;
  return subjectsList
    .filter(subject => subject.classes?.includes(fullClassId) || subject.classes?.includes(classId))
    .map(subject => subject.id);
};

export const educationLevels = {
  public: 'Public',
  private: 'Privé',
  international: 'International',
  other: 'Autre'
} as const;

export type EducationLevel = keyof typeof educationLevels;

export function getEducationLevelLabel(level: EducationLevel): string {
  return educationLevels[level];
} 