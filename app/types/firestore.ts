export interface Country {
  id: string;
  flag: string;
  name: string;
}

export interface SchoolType {
  id: string;
  label: string;
  countryId: string;
}

export interface Class {
  id: string;
  label: string;
  countryId: string;
  schoolTypeId: string;
  createdAt: Date;
}

export interface Subject {
  id: string;
  label: string;
  icon: string;
  gradient: string;
  countryId: string;
  classeId: string;
  createdAt: Date;
}

export interface Theme {
  id: string;
  title: string;
  countryId: string;
  classeId: string;
  subjectId: string;
  createdAt: Date;
}

export interface Chapter {
  id: string;
  title: string;
  themeId: string;
  courspdf: {
    url: string;
    title: string;
  };
  cours: {
    content: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
  };
  createdAt: Date;
}

export interface Exercise {
  id: string;
  title: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
  chapterId: string;
  themeId: string;
  subjectId: string;
  classId: string;
  countryId: string;
  schoolTypeId: string;
  createdAt: Date;
}