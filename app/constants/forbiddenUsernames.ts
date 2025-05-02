export const FORBIDDEN_USERNAMES = [
  // Insultes et termes offensants
  'connard', 'salope', 'pute', 'enculé', 'fdp', 'pd', 'nique',
  'merde', 'chier', 'putain', 'bitch', 'fuck', 'shit',
  
  // Termes racistes et discriminatoires
  'nazi', 'raciste', 'facho', 'nègre', 'bicot', 'bougnoule',
   'nigga', 'nig', 'nigger', 'nigga', 'nig', 'nigger',
  
  // Termes controversés
  'hitler', 'staline', 'isis', 'terroriste', 'netanyahu', 'putin', 'trump', 'sheytan',
  
  // Termes inappropriés pour une application éducative
  'drogue', 'cannabis', 'coke', 'hero', 'sexe', 'porn', 'marijuana', 'mdma',
  
  // Termes réservés
  'admin', 'administrateur', 'modo', 'moderateur', 'system', 'root',
  
  // Termes vides ou trop courts
  'aa', 'aaa', 'aaaa', 'aaaaa',
];

export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

export const USERNAME_ERRORS = {
  TOO_SHORT: 'Le pseudo doit contenir au moins 3 caractères',
  TOO_LONG: 'Le pseudo ne doit pas dépasser 20 caractères',
  INVALID_CHARS: 'Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores',
  FORBIDDEN: 'Ce pseudo n\'est pas autorisé',
  ALREADY_EXISTS: 'Ce pseudo est déjà utilisé',
}; 