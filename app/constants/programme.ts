export type ChapterContent = {
  id: string;
  content: string;
};

export type Chapter = {
  id: string;
  title: string;
  content: ChapterContent[];
};

export type Programme = {
    country: string;
    class: string;
    section?: string;
    subject: string;
  chapters: Chapter[];
};

export const programmes: Programme[] = [
  // Collège - 6ème - Maths
  {
    country: 'fr',
    class: 'sixieme',
    subject: 'maths',
    chapters: [
      {
        id: 'nombres-calculs-6',
        title: 'Nombres et Calculs',
        content: [
          {
            id: 'nombres-decimaux',
            content: 'Nombres décimaux et fractions : lecture, écriture, comparaison'
          },
          {
            id: 'operations-decimaux',
            content: 'Opérations sur les nombres décimaux et fractions simples'
          },
          {
            id: 'multiples-diviseurs',
            content: 'Multiples et diviseurs : critères de divisibilité'
          }
        ]
      },
      {
        id: 'geometrie-6',
        title: 'Géométrie',
        content: [
          {
            id: 'figures-planes',
            content: 'Figures planes : triangles, quadrilatères, cercles'
          },
          {
            id: 'perimetres-aires',
            content: 'Périmètres et aires des figures usuelles'
          },
          {
            id: 'angles',
            content: 'Angles : mesure, comparaison, construction'
          }
        ]
      },
      {
        id: 'grandeurs-mesures-6',
        title: 'Grandeurs et Mesures',
        content: [
          {
            id: 'longueurs',
            content: 'Longueurs : conversions et calculs'
          },
          {
            id: 'masses',
            content: 'Masses : unités et conversions'
          },
          {
            id: 'durees',
            content: 'Durées : calculs et conversions'
          }
        ]
      }
    ]
  },
  // Collège - 5ème - Maths
  {
    country: 'fr',
    class: 'cinquieme',
    subject: 'maths',
    chapters: [
      {
        id: 'nombres-calculs-5',
        title: 'Nombres et Calculs',
        content: [
          {
            id: 'nombres-relatifs',
            content: 'Nombres relatifs : repérage, comparaison et opérations'
          },
          {
            id: 'fractions',
            content: 'Fractions : comparaison, addition et soustraction'
          },
          {
            id: 'calcul-litteral',
            content: 'Introduction au calcul littéral'
          }
        ]
      },
      {
        id: 'geometrie-5',
        title: 'Géométrie',
        content: [
          {
            id: 'triangles',
            content: 'Triangles : construction et propriétés'
          },
          {
            id: 'parallelogrammes',
            content: 'Parallélogrammes : propriétés caractéristiques'
          },
          {
            id: 'symetrie-centrale',
            content: 'Symétrie centrale : construction et propriétés'
          }
        ]
      },
      {
        id: 'proportionnalite-5',
        title: 'Proportionnalité',
        content: [
          {
            id: 'proportionnalite-base',
            content: 'Reconnaissance et traitement de situations de proportionnalité'
          },
          {
            id: 'pourcentages',
            content: 'Pourcentages : calcul et utilisation'
          }
        ]
      }
    ]
  },
  // Collège - 4ème - Maths
  {
    country: 'fr',
    class: 'quatrieme',
    subject: 'maths',
    chapters: [
      {
        id: 'nombres-calculs-4',
        title: 'Nombres et Calculs',
        content: [
          {
            id: 'puissances',
            content: 'Puissances : définition et propriétés'
          },
          {
            id: 'calcul-litteral-4',
            content: 'Calcul littéral : développement et factorisation'
          },
          {
            id: 'equations',
            content: 'Équations du premier degré à une inconnue'
          }
        ]
      },
      {
        id: 'geometrie-4',
        title: 'Géométrie',
        content: [
          {
            id: 'theoreme-thales',
            content: 'Théorème de Thalès : triangles semblables'
          },
          {
            id: 'pythagore',
            content: 'Théorème de Pythagore et sa réciproque'
          },
          {
            id: 'translation',
            content: 'Translation : définition et propriétés'
          }
        ]
      },
      {
        id: 'statistiques-4',
        title: 'Statistiques',
        content: [
          {
            id: 'effectifs-frequences',
            content: 'Effectifs et fréquences'
          },
          {
            id: 'moyennes',
            content: 'Moyennes : calcul et interprétation'
          }
        ]
      }
    ]
  },
  // Collège - 3ème - Maths
  {
    country: 'fr',
    class: 'troisieme',
    subject: 'maths',
    chapters: [
      {
        id: 'nombres-calculs-3',
        title: 'Nombres et Calculs',
        content: [
          {
            id: 'racines-carrees',
            content: 'Racines carrées : calculs et approximations'
          },
          {
            id: 'calcul-litteral-3',
            content: 'Calcul littéral : identités remarquables'
          },
          {
            id: 'equations-systemes',
            content: 'Systèmes d\'équations à deux inconnues'
          }
        ]
      },
      {
        id: 'geometrie-3',
        title: 'Géométrie',
        content: [
          {
            id: 'trigonometrie-3',
            content: 'Trigonométrie dans le triangle rectangle'
          },
          {
            id: 'sphere',
            content: 'Sphère : sections planes et aires'
          },
          {
            id: 'rotations',
            content: 'Rotations : définition et propriétés'
          }
        ]
      },
      {
        id: 'fonctions-3',
        title: 'Fonctions',
        content: [
          {
            id: 'fonctions-lineaires',
            content: 'Fonctions linéaires et affines'
          },
          {
            id: 'proportionnalite-3',
            content: 'Proportionnalité et fonctions'
          }
        ]
      },
      {
        id: 'statistiques-probabilites-3',
        title: 'Statistiques et Probabilités',
        content: [
          {
            id: 'statistiques-3',
            content: 'Statistiques : caractéristiques de position et de dispersion'
          },
          {
            id: 'probabilites-3',
            content: 'Probabilités : approche fréquentiste et théorique'
          }
        ]
      }
    ]
  },
  // Seconde - Maths
  {
    country: 'fr',
    class: 'seconde',
    subject: 'maths',
    chapters: [
      {
        id: 'nombres-calculs',
        title: 'Nombres et Calculs',
        content: [
          {
            id: 'nombres-reels',
            content: 'Nombres réels : propriétés, comparaison, et opérations'
          },
          {
            id: 'intervalles',
            content: 'Intervalles et notation des intervalles'
          },
          {
            id: 'preuve-raisonnement',
            content: 'Notion de preuve et raisonnement mathématique'
          }
        ]
      },
      {
        id: 'equations-inequations',
        title: 'Équations et Inéquations',
        content: [
          {
            id: 'resolution-equations',
            content: 'Résolution d\'équations et d\'inéquations du premier et du second degré'
          },
          {
            id: 'systemes-lineaires',
            content: 'Systèmes d\'équations linéaires'
          }
        ]
      },
      {
        id: 'fonctions',
        title: 'Fonctions',
        content: [
          {
            id: 'notion-fonction',
            content: 'Notion de fonction : image, antécédent, ensemble de définition'
          },
          {
            id: 'fonctions-reference',
            content: 'Fonctions de référence : carré, cube, racine, homographiques'
          },
          {
            id: 'representation-graphique',
            content: 'Représentation graphique d\'une fonction'
          },
          {
            id: 'fonctions-affines',
            content: 'Fonctions affines et linéaires : étude et représentation'
          },
          {
            id: 'fonctions-carrees',
            content: 'Fonctions carrées et inverses'
          }
        ]
      },
      {
        id: 'geometrie',
        title: 'Géométrie',
        content: [
          {
            id: 'geometrie-plane',
            content: 'Géométrie dans le plan : points, droites, segments, et cercles'
          },
          {
            id: 'triangles-quadrilateres',
            content: 'Propriétés des triangles et des quadrilatères'
          },
          {
            id: 'symetries-transformations',
            content: 'Symétries et transformations géométriques'
          },
          {
            id: 'thales',
            content: 'Théorème de Thalès et sa réciproque'
          },
          {
            id: 'trigonometrie',
            content: 'Trigonométrie dans le triangle rectangle'
          }
        ]
      },
      {
        id: 'statistiques-probabilites',
        title: 'Statistiques et Probabilités',
        content: [
          {
            id: 'collecte-donnees',
            content: 'Collecte et représentation de données : diagrammes et graphiques'
          },
          {
            id: 'indicateurs-statistiques',
            content: 'Moyenne, médiane, étendue et écart-type'
          },
          {
            id: 'probabilites-base',
            content: 'Notions de base en probabilités : événements, probabilités et calculs simples'
          }
        ]
      },
      {
        id: 'vecteurs',
        title: 'Vecteurs',
        content: [
          {
            id: 'introduction-vecteurs',
            content: 'Introduction aux vecteurs : définition, opérations et applications'
          },
          {
            id: 'coordonnees-vecteurs',
            content: 'Coordonnées des vecteurs dans le plan'
          }
        ]
      },
      {
        id: 'algebre',
        title: 'Algèbre',
        content: [
          {
            id: 'developpement-factorisation',
            content: 'Développement et factorisation d\'expressions algébriques'
          },
          {
            id: 'identites-remarquables',
            content: 'Identités remarquables'
          }
        ]
      }
    ]
  },
  // Première générale - Maths
  {
    country: 'fr',
    class: 'premiere',
    subject: 'maths',
    chapters: [
      {
        id: 'algebre-1',
        title: 'Algèbre',
        content: [
          {
            id: 'suites',
            content: 'Suites numériques : définition, modes de génération, sens de variation'
          },
          {
            id: 'suites-arithmetiques',
            content: 'Suites arithmétiques et géométriques'
          }
        ]
      },
      {
        id: 'analyse-1',
        title: 'Analyse',
        content: [
          {
            id: 'derivation',
            content: 'Dérivation : taux de variation, nombre dérivé, fonction dérivée'
          },
          {
            id: 'fonctions-reference',
            content: 'Fonctions de référence : carré, cube, racine, homographiques'
          },
          {
            id: 'variations',
            content: 'Variations et extremums des fonctions'
          }
        ]
      },
      {
        id: 'geometrie-1',
        title: 'Géométrie',
        content: [
          {
            id: 'produit-scalaire',
            content: 'Produit scalaire dans le plan'
          },
          {
            id: 'geometrie-repere',
            content: 'Géométrie repérée : droites, cercles'
          }
        ]
      },
      {
        id: 'probabilites-1',
        title: 'Probabilités',
        content: [
          {
            id: 'probabilites-conditionnelles',
            content: 'Probabilités conditionnelles et indépendance'
          },
          {
            id: 'variables-aleatoires',
            content: 'Variables aléatoires discrètes'
          }
        ]
      }
    ]
  },
  // Terminale générale - Maths
  {
    country: 'fr',
    class: 'terminale',
    subject: 'maths',
    chapters: [
      {
        id: 'analyse-t',
        title: 'Analyse',
        content: [
          {
            id: 'continuite',
            content: 'Continuité des fonctions'
          },
          {
            id: 'limites',
            content: 'Limites de fonctions'
          },
          {
            id: 'exponentielle',
            content: 'Fonction exponentielle'
          },
          {
            id: 'logarithme',
            content: 'Fonction logarithme népérien'
          },
          {
            id: 'primitives',
            content: 'Primitives et intégration'
          }
        ]
      },
      {
        id: 'algebre-probabilites-t',
        title: 'Algèbre et Probabilités',
        content: [
          {
            id: 'denombrement',
            content: 'Dénombrement et combinatoire'
          },
          {
            id: 'lois-probabilites',
            content: 'Lois de probabilité : binomiale, uniforme'
          },
          {
            id: 'independance',
            content: 'Indépendance et probabilités conditionnelles'
          }
        ]
      },
      {
        id: 'geometrie-t',
        title: 'Géométrie',
        content: [
          {
            id: 'vecteurs-espace',
            content: 'Vecteurs de l\'espace'
          },
          {
            id: 'droites-plans',
            content: 'Droites et plans de l\'espace'
          }
        ]
      },
      {
        id: 'algorithmique-t',
        title: 'Algorithmique',
        content: [
          {
            id: 'recursivite',
            content: 'Récursivité : principes et applications'
          },
          {
            id: 'listes',
            content: 'Listes : manipulation et traitement'
          }
        ]
      }
    ]
  },
  // Collège - 6ème - Français
  {
    country: 'fr',
    class: 'sixieme',
    subject: 'francais',
    chapters: [
      {
        id: 'lecture-6',
        title: 'Lecture et compréhension',
        content: [
          {
            id: 'lecture-textes',
            content: 'Lecture de textes variés : récits, contes, fables, poèmes'
          },
          {
            id: 'comprehension-explicite',
            content: 'Compréhension des informations explicites et implicites'
          },
          {
            id: 'strategies-lecture',
            content: 'Stratégies de lecture : repérage, inférences, hypothèses'
          }
        ]
      },
      {
        id: 'ecriture-6',
        title: 'Expression écrite',
        content: [
          {
            id: 'redaction-textes',
            content: 'Rédaction de textes narratifs et descriptifs'
          },
          {
            id: 'organisation-texte',
            content: 'Organisation du texte : paragraphes, connecteurs'
          },
          {
            id: 'revision-textes',
            content: 'Révision et amélioration des productions écrites'
          }
        ]
      },
      {
        id: 'langue-6',
        title: 'Étude de la langue',
        content: [
          {
            id: 'grammaire-6',
            content: 'Grammaire : phrases, classes de mots, fonctions'
          },
          {
            id: 'conjugaison-6',
            content: 'Conjugaison : temps simples de l\'indicatif'
          },
          {
            id: 'orthographe-6',
            content: 'Orthographe : accords dans le groupe nominal et verbal'
          }
        ]
      }
    ]
  },
  // Collège - 5ème - Français
  {
    country: 'fr',
    class: 'cinquieme',
    subject: 'francais',
    chapters: [
      {
        id: 'lecture-5',
        title: 'Lecture et littérature',
        content: [
          {
            id: 'recits-aventure',
            content: 'Récits d\'aventure et de voyage'
          },
          {
            id: 'poesie-5',
            content: 'Poésie : jeux de langage et figures de style'
          },
          {
            id: 'theatre-5',
            content: 'Théâtre : découverte du genre dramatique'
          }
        ]
      },
      {
        id: 'expression-5',
        title: 'Expression écrite et orale',
        content: [
          {
            id: 'description',
            content: 'Description : personnages, lieux, objets'
          },
          {
            id: 'narration',
            content: 'Narration : récits à la première et troisième personne'
          },
          {
            id: 'argumentation-5',
            content: 'Introduction à l\'argumentation'
          }
        ]
      },
      {
        id: 'langue-5',
        title: 'Étude de la langue',
        content: [
          {
            id: 'grammaire-5',
            content: 'Grammaire : phrases complexes, compléments circonstanciels'
          },
          {
            id: 'conjugaison-5',
            content: 'Conjugaison : temps composés de l\'indicatif'
          },
          {
            id: 'vocabulaire-5',
            content: 'Vocabulaire : formation des mots, familles de mots'
          }
        ]
      }
    ]
  },
  // Collège - 4ème - Français
  {
    country: 'fr',
    class: 'quatrieme',
    subject: 'francais',
    chapters: [
      {
        id: 'lecture-4',
        title: 'Lecture et littérature',
        content: [
          {
            id: 'roman-4',
            content: 'Le roman au XIXe siècle'
          },
          {
            id: 'poesie-4',
            content: 'La poésie lyrique'
          },
          {
            id: 'theatre-4',
            content: 'Le théâtre : comédie et tragédie'
          }
        ]
      },
      {
        id: 'expression-4',
        title: 'Expression écrite et orale',
        content: [
          {
            id: 'argumentation-4',
            content: 'Argumentation : défendre un point de vue'
          },
          {
            id: 'recit-complexe',
            content: 'Récit complexe : points de vue et temporalité'
          },
          {
            id: 'resume',
            content: 'Résumé de texte'
          }
        ]
      },
      {
        id: 'langue-4',
        title: 'Étude de la langue',
        content: [
          {
            id: 'subordination',
            content: 'Subordination et juxtaposition'
          },
          {
            id: 'modes-verbaux',
            content: 'Les modes verbaux : subjonctif, conditionnel'
          },
          {
            id: 'figures-style',
            content: 'Les figures de style'
          }
        ]
      }
    ]
  },
  // Collège - 3ème - Français
  {
    country: 'fr',
    class: 'troisieme',
    subject: 'francais',
    chapters: [
      {
        id: 'lecture-3',
        title: 'Lecture et littérature',
        content: [
          {
            id: 'litterature-xxe',
            content: 'Littérature des XXe et XXIe siècles'
          },
          {
            id: 'poesie-engagee',
            content: 'Poésie engagée'
          },
          {
            id: 'theatre-contemporain',
            content: 'Théâtre contemporain'
          }
        ]
      },
      {
        id: 'expression-3',
        title: 'Expression écrite et orale',
        content: [
          {
            id: 'dissertation',
            content: 'Introduction à la dissertation'
          },
          {
            id: 'commentaire',
            content: 'Initiation au commentaire de texte'
          },
          {
            id: 'oral-3',
            content: 'Expression orale : exposé et débat'
          }
        ]
      },
      {
        id: 'langue-3',
        title: 'Étude de la langue',
        content: [
          {
            id: 'syntaxe-complexe',
            content: 'Syntaxe de la phrase complexe'
          },
          {
            id: 'concordance-temps',
            content: 'Concordance des temps'
          },
          {
            id: 'connecteurs-logiques',
            content: 'Connecteurs logiques et argumentation'
          }
        ]
      }
    ]
  },
  // Lycée - Seconde - Français
  {
    country: 'fr',
    class: 'seconde',
    subject: 'french',
    chapters: [
      {
        id: 'genres-litteraires',
        title: 'Genres littéraires',
        content: [
          {
            id: 'poesie-2',
            content: 'La poésie du Moyen Âge au XVIIIe siècle'
          },
          {
            id: 'theatre-2',
            content: 'Le théâtre du XVIIe siècle au XXIe siècle'
          },
          {
            id: 'roman-2',
            content: 'Le roman et le récit du XVIIIe siècle au XXIe siècle'
          }
        ]
      },
      {
        id: 'methodologie-2',
        title: 'Méthodologie',
        content: [
          {
            id: 'commentaire-2',
            content: 'Le commentaire littéraire'
          },
          {
            id: 'dissertation-2',
            content: 'La dissertation'
          },
          {
            id: 'oral-2',
            content: 'L\'oral : exposé et entretien'
          }
        ]
      },
      {
        id: 'langue-2',
        title: 'Étude de la langue',
        content: [
          {
            id: 'style-2',
            content: 'Analyse stylistique'
          },
          {
            id: 'argumentation-2',
            content: 'Techniques argumentatives'
          },
          {
            id: 'vocabulaire-2',
            content: 'Lexique littéraire et analytique'
          }
        ]
      }
    ]
  },
  // Lycée - Première - Français
  {
    country: 'fr',
    class: 'premiere',
    subject: 'francais',
    chapters: [
      {
        id: 'objets-etude',
        title: 'Objets d\'étude',
        content: [
          {
            id: 'poesie-1',
            content: 'La poésie du XIXe au XXIe siècle'
          },
          {
            id: 'roman-1',
            content: 'Le roman et le récit du Moyen Âge au XXIe siècle'
          },
          {
            id: 'theatre-1',
            content: 'Le théâtre du XVIIe au XXIe siècle'
          },
          {
            id: 'litterature-idees',
            content: 'La littérature d\'idées du XVIe au XVIIIe siècle'
          }
        ]
      },
      {
        id: 'exercices-1',
        title: 'Exercices écrits et oraux',
        content: [
          {
            id: 'commentaire-1',
            content: 'Commentaire : analyse détaillée et interprétation'
          },
          {
            id: 'dissertation-1',
            content: 'Dissertation : argumentation et références culturelles'
          },
          {
            id: 'oral-1',
            content: 'Épreuve orale : explication linéaire'
          }
        ]
      },
      {
        id: 'methodologie-1',
        title: 'Méthodologie',
        content: [
          {
            id: 'analyse-litteraire',
            content: 'Analyse littéraire approfondie'
          },
          {
            id: 'construction-argument',
            content: 'Construction d\'une argumentation'
          },
          {
            id: 'expression-personnelle',
            content: 'Expression d\'un point de vue personnel'
          }
        ]
      }
    ]
  },
  // Collège - 6ème - Histoire-Géographie
  {
    country: 'fr',
    class: 'sixieme',
    subject: 'histoire-geo',
    chapters: [
      {
        id: 'histoire-6',
        title: 'Histoire',
        content: [
          {
            id: 'prehistoire',
            content: 'La Préhistoire : les premières traces de vie humaine'
          },
          {
            id: 'antiquite',
            content: 'L\'Antiquité : Égypte et Mésopotamie'
          },
          {
            id: 'grece-rome',
            content: 'Le monde grec et romain'
          }
        ]
      },
      {
        id: 'geographie-6',
        title: 'Géographie',
        content: [
          {
            id: 'habiter',
            content: 'Habiter une métropole'
          },
          {
            id: 'littoral',
            content: 'Habiter un espace à forte contrainte'
          },
          {
            id: 'monde-rural',
            content: 'Habiter un espace de faible densité'
          }
        ]
      }
    ]
  },
  // Collège - 5ème - Histoire-Géographie
  {
    country: 'fr',
    class: 'cinquieme',
    subject: 'histoire-geo',
    chapters: [
      {
        id: 'histoire-5',
        title: 'Histoire',
        content: [
          {
            id: 'moyen-age',
            content: 'Le Moyen Âge : société féodale et religieuse'
          },
          {
            id: 'islam',
            content: 'L\'Islam : naissance et premiers empires'
          },
          {
            id: 'renaissance',
            content: 'La Renaissance : nouveaux horizons'
          }
        ]
      },
      {
        id: 'geographie-5',
        title: 'Géographie',
        content: [
          {
            id: 'developpement',
            content: 'La question du développement durable'
          },
          {
            id: 'ressources',
            content: 'Gestion des ressources'
          },
          {
            id: 'risques',
            content: 'Prévention des risques'
          }
        ]
      }
    ]
  },
  // Collège - 4ème - Histoire-Géographie
  {
    country: 'fr',
    class: 'quatrieme',
    subject: 'histoire-geo',
    chapters: [
      {
        id: 'histoire-4',
        title: 'Histoire',
        content: [
          {
            id: 'lumieres',
            content: 'Le XVIIIe siècle : Lumières et révolutions'
          },
          {
            id: 'revolution',
            content: 'La Révolution française'
          },
          {
            id: 'europe-xix',
            content: 'L\'Europe au XIXe siècle'
          }
        ]
      },
      {
        id: 'geographie-4',
        title: 'Géographie',
        content: [
          {
            id: 'urbanisation',
            content: 'L\'urbanisation dans le monde'
          },
          {
            id: 'mobilites',
            content: 'Les mobilités humaines'
          },
          {
            id: 'mondialisation',
            content: 'Les espaces de la mondialisation'
          }
        ]
      }
    ]
  },
  // Collège - 3ème - Histoire-Géographie
  {
    country: 'fr',
    class: 'troisieme',
    subject: 'histoire-geo',
    chapters: [
      {
        id: 'histoire-3',
        title: 'Histoire',
        content: [
          {
            id: 'guerres-mondiales',
            content: 'Les deux guerres mondiales'
          },
          {
            id: 'guerre-froide',
            content: 'Le monde depuis 1945'
          },
          {
            id: 'france-contemporaine',
            content: 'La France de 1945 à nos jours'
          }
        ]
      },
      {
        id: 'geographie-3',
        title: 'Géographie',
        content: [
          {
            id: 'territoires',
            content: 'Les territoires dans la mondialisation'
          },
          {
            id: 'amenagement',
            content: 'Aménagement et développement du territoire français'
          },
          {
            id: 'union-europeenne',
            content: 'La France et l\'Union européenne'
          }
        ]
      }
    ]
  },
  // Lycée - Seconde - Histoire-Géographie
  {
    country: 'fr',
    class: 'seconde',
    subject: 'history',
    chapters: [
      {
        id: 'histoire-2',
        title: 'Histoire',
        content: [
          {
            id: 'antiquite-citoyennete',
            content: 'Le monde méditerranéen : la citoyenneté dans l\'Antiquité'
          },
          {
            id: 'societes-medievales',
            content: 'Sociétés et cultures médiévales'
          },
          {
            id: 'modernite-xvie',
            content: 'L\'affirmation de l\'État au XVIe siècle'
          },
          {
            id: 'lumieres-revolutions',
            content: 'Les Lumières et les révolutions (1789-1804)'
          }
        ]
      },
      {
        id: 'geographie-2',
        title: 'Géographie',
        content: [
          {
            id: 'environnement',
            content: 'Sociétés et environnement : des équilibres fragiles'
          },
          {
            id: 'territoires-population',
            content: 'Territoires, populations et développement'
          },
          {
            id: 'mobilites-mondiales',
            content: 'Des mobilités généralisées'
          }
        ]
      }
    ]
  },
  // Lycée - Première - Histoire-Géographie
  {
    country: 'fr',
    class: 'premiere',
    subject: 'histoire-geo',
    chapters: [
      {
        id: 'histoire-1',
        title: 'Histoire',
        content: [
          {
            id: 'nation-europe',
            content: 'Nations, empires, nationalités (1789-1914)'
          },
          {
            id: 'guerre-totalitarismes',
            content: 'La guerre au XXe siècle et les totalitarismes'
          },
          {
            id: 'republique-france',
            content: 'La République française'
          }
        ]
      },
      {
        id: 'geographie-1',
        title: 'Géographie',
        content: [
          {
            id: 'metropolisation',
            content: 'La métropolisation : un processus mondial'
          },
          {
            id: 'divison-production',
            content: 'Une diversification des espaces et des acteurs de la production'
          },
          {
            id: 'recompositions-spatiales',
            content: 'Les espaces ruraux : multifonctionnalité et recompositions'
          }
        ]
      }
    ]
  },
  // Lycée - Terminale - Histoire-Géographie
  {
    country: 'fr',
    class: 'terminale',
    subject: 'histoire-geo',
    chapters: [
      {
        id: 'histoire-t',
        title: 'Histoire',
        content: [
          {
            id: 'relations-internationales',
            content: 'Relations internationales depuis 1945'
          },
          {
            id: 'decolonisation',
            content: 'La décolonisation et le Tiers-Monde'
          },
          {
            id: 'france-ve-republique',
            content: 'La France sous la Ve République'
          }
        ]
      },
      {
        id: 'geographie-t',
        title: 'Géographie',
        content: [
          {
            id: 'mondialisation-t',
            content: 'Mers et océans au cœur de la mondialisation'
          },
          {
            id: 'dynamiques-territoriales',
            content: 'Dynamiques territoriales de la France contemporaine'
          },
          {
            id: 'puissances-monde',
            content: 'L\'Union européenne dans la mondialisation'
          }
        ]
      }
    ]
  },
  // Collège - 6ème - SVT
  {
    country: 'fr',
    class: 'sixieme',
    subject: 'svt',
    chapters: [
      {
        id: 'caracteristiques-vivant-6',
        title: 'Caractéristiques du vivant',
        content: [
          {
            id: 'cellule-6',
            content: 'La cellule : unité du vivant'
          },
          {
            id: 'classification-6',
            content: 'Classification du vivant'
          },
          {
            id: 'developpement-6',
            content: 'Développement des êtres vivants'
          }
        ]
      },
      {
        id: 'environnement-6',
        title: 'Le vivant et son environnement',
        content: [
          {
            id: 'peuplement-6',
            content: 'Peuplement des milieux'
          },
          {
            id: 'origine-matiere-6',
            content: 'Origine de la matière des êtres vivants'
          },
          {
            id: 'ecosystemes-6',
            content: 'Les écosystèmes'
          }
        ]
      }
    ]
  },
  // Collège - 5ème - SVT
  {
    country: 'fr',
    class: 'cinquieme',
    subject: 'svt',
    chapters: [
      {
        id: 'respiration-5',
        title: 'Respiration et occupation des milieux',
        content: [
          {
            id: 'respiration-adaptations',
            content: 'Adaptations à la vie fixée pour les végétaux'
          },
          {
            id: 'respiration-animale',
            content: 'Respiration et occupation des milieux chez les animaux'
          }
        ]
      },
      {
        id: 'geologie-5',
        title: 'Géologie externe',
        content: [
          {
            id: 'erosion-5',
            content: 'L\'érosion et le modelé du paysage'
          },
          {
            id: 'roches-sedimentaires',
            content: 'Formation des roches sédimentaires'
          }
        ]
      }
    ]
  },
  // Collège - 4ème - SVT
  {
    country: 'fr',
    class: 'quatrieme',
    subject: 'svt',
    chapters: [
      {
        id: 'reproduction-4',
        title: 'Reproduction et transmission de la vie',
        content: [
          {
            id: 'reproduction-humaine',
            content: 'Reproduction humaine et éducation à la sexualité'
          },
          {
            id: 'transmission-vie',
            content: 'Transmission de la vie chez les animaux'
          }
        ]
      },
      {
        id: 'activite-interne-4',
        title: 'Activité interne du globe',
        content: [
          {
            id: 'seismes-volcans',
            content: 'Séismes et volcans'
          },
          {
            id: 'tectonique-plaques',
            content: 'Tectonique des plaques'
          }
        ]
      }
    ]
  },
  // Collège - 3ème - SVT
  {
    country: 'fr',
    class: 'troisieme',
    subject: 'svt',
    chapters: [
      {
        id: 'genetique-3',
        title: 'Génétique et évolution',
        content: [
          {
            id: 'diversite-genetique',
            content: 'Diversité génétique des individus'
          },
          {
            id: 'evolution-3',
            content: 'Évolution des espèces'
          }
        ]
      },
      {
        id: 'responsabilite-3',
        title: 'Responsabilité humaine',
        content: [
          {
            id: 'sante-3',
            content: 'Santé et comportements responsables'
          },
          {
            id: 'environnement-3',
            content: 'Impact humain sur l\'environnement'
          }
        ]
      }
    ]
  },
  // Lycée - Seconde - SVT
  {
    country: 'fr',
    class: 'seconde',
    subject: 'svt',
    chapters: [
      {
        id: 'terre-univers-2',
        title: 'La Terre dans l\'Univers',
        content: [
          {
            id: 'conditions-vie',
            content: 'Les conditions de la vie sur Terre'
          },
          {
            id: 'soleil-energie',
            content: 'Le Soleil, source d\'énergie'
          }
        ]
      },
      {
        id: 'corps-humain-2',
        title: 'Corps humain et santé',
        content: [
          {
            id: 'organisation-corps',
            content: 'Organisation fonctionnelle du corps'
          },
          {
            id: 'microorganismes',
            content: 'Microorganismes et santé'
          }
        ]
      },
      {
        id: 'biodiversite-2',
        title: 'Enjeux contemporains de la planète',
        content: [
          {
            id: 'biodiversite-evolution',
            content: 'Biodiversité, résultat et étape de l\'évolution'
          },
          {
            id: 'agrosystemes',
            content: 'Agrosystèmes et développement durable'
          }
        ]
      }
    ]
  },
  // Lycée - Première - SVT
  {
    country: 'fr',
    class: 'premiere',
    subject: 'svt',
    chapters: [
      {
        id: 'transmission-variation-1',
        title: 'Transmission, variation et expression du patrimoine génétique',
        content: [
          {
            id: 'divisions-cellulaires',
            content: 'Divisions cellulaires des organismes'
          },
          {
            id: 'expression-genetique',
            content: 'Expression du patrimoine génétique'
          },
          {
            id: 'mutations-1',
            content: 'Mutations de l\'ADN et variabilité génétique'
          }
        ]
      },
      {
        id: 'ecosystemes-1',
        title: 'Écosystèmes et services environnementaux',
        content: [
          {
            id: 'dynamique-ecosystemes',
            content: 'Dynamique des écosystèmes'
          },
          {
            id: 'ecosystemes-services',
            content: 'Écosystèmes et services environnementaux'
          }
        ]
      }
    ]
  },
  // Lycée - Terminale - SVT
  {
    country: 'fr',
    class: 'terminale',
    subject: 'svt',
    chapters: [
      {
        id: 'genetique-evolution-t',
        title: 'Génétique et évolution',
        content: [
          {
            id: 'mecanismes-evolution',
            content: 'Mécanismes de l\'évolution'
          },
          {
            id: 'speciation',
            content: 'Spéciation et diversification du vivant'
          }
        ]
      },
      {
        id: 'corps-humain-t',
        title: 'Corps humain et santé',
        content: [
          {
            id: 'immunite-t',
            content: 'Comportement immunitaire et santé'
          },
          {
            id: 'genetique-maladies',
            content: 'Génétique et maladies'
          }
        ]
      },
      {
        id: 'planete-terre-t',
        title: 'Enjeux planétaires contemporains',
        content: [
          {
            id: 'climat-t',
            content: 'Climat et impacts des activités humaines'
          },
          {
            id: 'ressources-geologiques',
            content: 'Géosciences et ressources géologiques'
          }
        ]
      }
    ]
  },
  // Collège - 6ème - Physique Chimie
  {
    country: 'fr',
    class: 'sixieme',
    subject: 'physics',
    chapters: [
      {
        id: 'matiere-6',
        title: 'Matière et mélanges',
        content: [
          {
            id: 'etats-matiere',
            content: 'Les états de la matière'
          },
          {
            id: 'melanges-6',
            content: 'Les mélanges et leur séparation'
          },
          {
            id: 'changements-etat',
            content: 'Les changements d\'état de l\'eau'
          }
        ]
      },
      {
        id: 'energie-6',
        title: 'Énergie',
        content: [
          {
            id: 'sources-energie',
            content: 'Les différentes sources d\'énergie'
          },
          {
            id: 'circuits-electriques',
            content: 'Circuits électriques simples'
          }
        ]
      }
    ]
  },
  // Collège - 5ème - Physique Chimie
  {
    country: 'fr',
    class: 'cinquieme',
    subject: 'physique-chimie',
    chapters: [
      {
        id: 'matiere-5',
        title: 'Matière et transformations',
        content: [
          {
            id: 'masse-volume',
            content: 'Masse, volume et masse volumique'
          },
          {
            id: 'transformations-physiques',
            content: 'Les transformations physiques'
          }
        ]
      },
      {
        id: 'energie-5',
        title: 'Énergie et mouvements',
        content: [
          {
            id: 'energie-electrique',
            content: 'L\'énergie électrique'
          },
          {
            id: 'mouvements-5',
            content: 'Description des mouvements'
          }
        ]
      }
    ]
  },
  // Collège - 4ème - Physique Chimie
  {
    country: 'fr',
    class: 'quatrieme',
    subject: 'physique-chimie',
    chapters: [
      {
        id: 'chimie-4',
        title: 'Chimie',
        content: [
          {
            id: 'atomes-molecules',
            content: 'Atomes et molécules'
          },
          {
            id: 'reactions-chimiques',
            content: 'Les réactions chimiques'
          }
        ]
      },
      {
        id: 'physique-4',
        title: 'Physique',
        content: [
          {
            id: 'lumiere-son',
            content: 'Lumière et son'
          },
          {
            id: 'electricite-4',
            content: 'Lois de l\'électricité'
          }
        ]
      }
    ]
  },
  // Lycée - 3ème - Physique Chimie
  {
    country: 'fr',
    class: 'troisieme',
    subject: 'physique-chimie',
    chapters: [
      {
        id: 'chimie-3',
        title: 'Chimie',
        content: [
          {
            id: 'ions-ph',
            content: 'Les ions et le pH'
          },
          {
            id: 'synthese-materiaux',
            content: 'Synthèse de nouveaux matériaux'
          }
        ]
      },
      {
        id: 'physique-3',
        title: 'Physique',
        content: [
          {
            id: 'forces-mouvements',
            content: 'Forces et mouvements'
          },
          {
            id: 'energie-3',
            content: 'Puissance et énergie électrique'
          }
        ]
      }
    ]
  },
  // Lycée - Seconde - Physique Chimie
  {
    country: 'fr',
    class: 'seconde',
    subject: 'physique-chimie',
    chapters: [
      {
        id: 'constitution-matiere',
        title: 'Constitution de la matière',
        content: [
          {
            id: 'modele-atome',
            content: 'Modèle de l\'atome'
          },
          {
            id: 'tableau-periodique',
            content: 'Le tableau périodique'
          },
          {
            id: 'molecules-2',
            content: 'Les molécules dans la matière'
          }
        ]
      },
      {
        id: 'mouvements-interactions',
        title: 'Mouvements et interactions',
        content: [
          {
            id: 'description-mouvements',
            content: 'Description des mouvements'
          },
          {
            id: 'forces-2',
            content: 'Les forces et leurs effets'
          }
        ]
      },
      {
        id: 'energie-2',
        title: 'Énergie',
        content: [
          {
            id: 'energie-conversions',
            content: 'L\'énergie et ses conversions'
          },
          {
            id: 'energie-electrique-2',
            content: 'L\'énergie électrique'
          }
        ]
      }
    ]
  },
  // Lycée - Première - Physique Chimie
  {
    country: 'fr',
    class: 'premiere',
    subject: 'physique-chimie',
    chapters: [
      {
        id: 'constitution-transformation',
        title: 'Constitution et transformations de la matière',
        content: [
          {
            id: 'structure-matiere',
            content: 'Structure de la matière'
          },
          {
            id: 'transformations-nucleaires',
            content: 'Transformations nucléaires'
          },
          {
            id: 'reactions-acide-base',
            content: 'Réactions acide-base'
          }
        ]
      },
      {
        id: 'mouvement-energie-1',
        title: 'Mouvement et énergie',
        content: [
          {
            id: 'energie-mecanique',
            content: 'Énergie mécanique'
          },
          {
            id: 'forces-interactions',
            content: 'Forces et interactions'
          }
        ]
      },
      {
        id: 'ondes-signaux',
        title: 'Ondes et signaux',
        content: [
          {
            id: 'ondes-mecaniques',
            content: 'Ondes mécaniques'
          },
          {
            id: 'ondes-lumineuses',
            content: 'Ondes lumineuses'
          }
        ]
      }
    ]
  },
  // Lycée - Terminale - Physique Chimie
  {
    country: 'fr',
    class: 'terminale',
    subject: 'physique-chimie',
    chapters: [
      {
        id: 'constitution-t',
        title: 'Constitution et transformations de la matière',
        content: [
          {
            id: 'evolution-systemes',
            content: 'Évolution des systèmes chimiques'
          },
          {
            id: 'cinetique-chimique',
            content: 'Cinétique chimique'
          },
          {
            id: 'reactions-equilibre',
            content: 'Réactions et équilibre'
          }
        ]
      },
      {
        id: 'mouvement-interactions-t',
        title: 'Mouvement et interactions',
        content: [
          {
            id: 'mecanique-newtonienne',
            content: 'Mécanique newtonienne'
          },
          {
            id: 'mouvement-champs',
            content: 'Mouvements dans les champs'
          }
        ]
      },
      {
        id: 'energie-t',
        title: 'L\'énergie : conversions et transferts',
        content: [
          {
            id: 'thermodynamique',
            content: 'Thermodynamique'
          },
          {
            id: 'transferts-quantiques',
            content: 'Transferts quantiques d\'énergie'
          }
        ]
      }
    ]
  },
  // Anglais - De la 6ème à la Terminale
  {
    country: 'fr',
    class: 'sixieme',
    subject: 'english',
    chapters: [
      {
        id: 'communication-6',
        title: 'Communication',
        content: [
          { id: 'presentation', content: 'Se présenter et parler de soi' },
          { id: 'famille', content: 'La famille et les amis' },
          { id: 'ecole', content: 'L\'école et les activités quotidiennes' }
        ]
      },
      {
        id: 'grammaire-6',
        title: 'Grammaire',
        content: [
          { id: 'present-simple', content: 'Le présent simple' },
          { id: 'be-have', content: 'Les verbes être et avoir' },
          { id: 'possessifs', content: 'Les adjectifs possessifs' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'cinquieme',
    subject: 'english',
    chapters: [
      {
        id: 'communication-5',
        title: 'Communication',
        content: [
          { id: 'description', content: 'Décrire des personnes et des lieux' },
          { id: 'routines', content: 'Les routines et les habitudes' },
          { id: 'capacites', content: 'Exprimer ses capacités avec "can"' }
        ]
      },
      {
        id: 'grammaire-5',
        title: 'Grammaire',
        content: [
          { id: 'present-continuous', content: 'Le présent continu' },
          { id: 'prepositions', content: 'Les prépositions de lieu et de temps' },
          { id: 'questions', content: 'Former des questions' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'quatrieme',
    subject: 'english',
    chapters: [
      {
        id: 'communication-4',
        title: 'Communication',
        content: [
          { id: 'passe', content: 'Parler du passé' },
          { id: 'projets', content: 'Parler de ses projets' },
          { id: 'opinions', content: 'Donner son opinion' }
        ]
      },
      {
        id: 'grammaire-4',
        title: 'Grammaire',
        content: [
          { id: 'preterit', content: 'Le prétérit simple' },
          { id: 'futur', content: 'Le futur avec "will" et "going to"' },
          { id: 'modaux', content: 'Les verbes modaux' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'troisieme',
    subject: 'english',
    chapters: [
      {
        id: 'communication-3',
        title: 'Communication',
        content: [
          { id: 'experiences', content: 'Parler de ses expériences' },
          { id: 'argumentation', content: 'Argumenter et débattre' },
          { id: 'culture', content: 'Culture et civilisation anglophones' }
        ]
      },
      {
        id: 'grammaire-3',
        title: 'Grammaire',
        content: [
          { id: 'present-perfect', content: 'Le present perfect' },
          { id: 'conditionnel', content: 'Le conditionnel' },
          { id: 'passif', content: 'La voix passive' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'seconde',
    subject: 'english',
    chapters: [
      {
        id: 'communication-2',
        title: 'Communication',
        content: [
          { id: 'art-culture', content: 'Art et culture' },
          { id: 'societe', content: 'Questions de société' },
          { id: 'medias', content: 'Les médias' }
        ]
      },
      {
        id: 'expression-2',
        title: 'Expression',
        content: [
          { id: 'essay', content: 'Rédaction d\'essais' },
          { id: 'debat', content: 'Débats et discussions' },
          { id: 'presentation', content: 'Présentations orales' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'premiere',
    subject: 'english',
    chapters: [
      {
        id: 'communication-1',
        title: 'Communication et culture',
        content: [
          { id: 'identites', content: 'Identités et échanges' },
          { id: 'innovations', content: 'Innovations scientifiques et responsabilité' },
          { id: 'diversite', content: 'Diversité et inclusion' }
        ]
      },
      {
        id: 'expression-1',
        title: 'Expression et compréhension',
        content: [
          { id: 'argumentation-1', content: 'Argumentation structurée' },
          { id: 'synthese', content: 'Synthèse de documents' },
          { id: 'oral-1', content: 'Expression orale en continu' }
        ]
      },
      {
        id: 'litterature-1',
        title: 'Littérature et médias',
        content: [
          { id: 'fictions', content: 'Fictions et réalités' },
          { id: 'presse', content: 'Analyse de la presse' },
          { id: 'art-1', content: 'Art et pouvoir' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'terminale',
    subject: 'english',
    chapters: [
      {
        id: 'communication-t',
        title: 'Communication avancée',
        content: [
          { id: 'mondialisation', content: 'Mondialisation et citoyenneté' },
          { id: 'environnement-t', content: 'Enjeux environnementaux' },
          { id: 'progres', content: 'Progrès et rêves d\'avenir' }
        ]
      },
      {
        id: 'expression-t',
        title: 'Expression et analyse',
        content: [
          { id: 'dissertation', content: 'Dissertation en anglais' },
          { id: 'commentaire', content: 'Commentaire de textes littéraires' },
          { id: 'debat-t', content: 'Débats et présentations' }
        ]
      },
      {
        id: 'civilisation-t',
        title: 'Civilisation et société',
        content: [
          { id: 'territoire', content: 'Territoire et mémoire' },
          { id: 'art-politique', content: 'Art et engagement politique' },
          { id: 'defis', content: 'Défis du monde contemporain' }
        ]
      }
    ]
  },
  // EMC - De la 6ème à la Terminale
  {
    country: 'fr',
    class: 'sixieme',
    subject: 'emc',
    chapters: [
      {
        id: 'respect-regles',
        title: 'Le respect des règles',
        content: [
          { id: 'regles-ecole', content: 'Les règles de vie à l\'école' },
          { id: 'droits-devoirs', content: 'Droits et devoirs de l\'élève' }
        ]
      },
      {
        id: 'vivre-ensemble',
        title: 'Vivre ensemble',
        content: [
          { id: 'respect', content: 'Le respect de soi et des autres' },
          { id: 'solidarite', content: 'La solidarité dans la classe' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'cinquieme',
    subject: 'emc',
    chapters: [
      {
        id: 'egalite',
        title: 'L\'égalité',
        content: [
          { id: 'discrimination', content: 'La lutte contre les discriminations' },
          { id: 'egalite-fh', content: 'L\'égalité femmes-hommes' }
        ]
      },
      {
        id: 'securite',
        title: 'La sécurité',
        content: [
          { id: 'risques', content: 'Les risques d\'Internet' },
          { id: 'prevention', content: 'La prévention des violences' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'quatrieme',
    subject: 'emc',
    chapters: [
      {
        id: 'liberte',
        title: 'La liberté',
        content: [
          { id: 'libertes-fond', content: 'Les libertés fondamentales' },
          { id: 'expression', content: 'La liberté d\'expression' }
        ]
      },
      {
        id: 'justice',
        title: 'La justice',
        content: [
          { id: 'droit', content: 'Le droit et la justice' },
          { id: 'responsabilite', content: 'La responsabilité' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'troisieme',
    subject: 'emc',
    chapters: [
      {
        id: 'citoyennete',
        title: 'La citoyenneté',
        content: [
          { id: 'democratie', content: 'La démocratie' },
          { id: 'engagement', content: 'L\'engagement citoyen' }
        ]
      },
      {
        id: 'republique',
        title: 'La République',
        content: [
          { id: 'valeurs', content: 'Les valeurs de la République' },
          { id: 'laicite', content: 'La laïcité' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'seconde',
    subject: 'emc',
    chapters: [
      {
        id: 'democratie-2',
        title: 'La démocratie',
        content: [
          { id: 'fondements', content: 'Les fondements de la démocratie' },
          { id: 'participation', content: 'La participation démocratique' }
        ]
      },
      {
        id: 'societe-2',
        title: 'La société',
        content: [
          { id: 'integration', content: 'L\'intégration sociale' },
          { id: 'protection', content: 'La protection sociale' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'premiere',
    subject: 'emc',
    chapters: [
      {
        id: 'societe-1',
        title: 'La société',
        content: [
          { id: 'cohesion', content: 'La cohésion sociale' },
          { id: 'inegalites', content: 'Les inégalités et discriminations' }
        ]
      },
      {
        id: 'politique-1',
        title: 'La politique',
        content: [
          { id: 'democratie-1', content: 'Les institutions démocratiques' },
          { id: 'citoyennete-1', content: 'L\'exercice de la citoyenneté' }
        ]
      }
    ]
  },
  {
    country: 'fr',
    class: 'terminale',
    subject: 'emc',
    chapters: [
      {
        id: 'monde-t',
        title: 'Le monde contemporain',
        content: [
          { id: 'mondialisation', content: 'Les enjeux de la mondialisation' },
          { id: 'environnement', content: 'Les défis environnementaux' }
        ]
      },
      {
        id: 'democratie-t',
        title: 'La démocratie contemporaine',
        content: [
          { id: 'debats', content: 'Les grands débats de société' },
          { id: 'engagement-t', content: 'Les formes d\'engagement' }
        ]
      }
    ]
  },
];


