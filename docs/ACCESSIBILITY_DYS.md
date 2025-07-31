# Fonctionnalités d'Accessibilité DYS

Ce document décrit l'implémentation des fonctionnalités d'accessibilité pour les élèves DYS dans l'application Academia.

## 🎯 Objectif

Fournir des outils d'aide à la lecture et à la compréhension pour les élèves présentant des troubles DYS (dyslexie, dysorthographie, etc.).

## 🚀 Fonctionnalités Implémentées

### 1. Police DYS (OpenDyslexic)
- **Description** : Police spécialement conçue pour faciliter la lecture pour les personnes dyslexiques
- **Activation** : Via toggle dans la page "Accessibilité DYS"
- **Effet** : Remplace automatiquement toutes les polices de l'application par OpenDyslexic
- **Styles disponibles** : Regular, Bold, Italic, Bold-Italic

### 2. Lecture Audio des Consignes
- **Description** : Icône audio qui apparaît à côté des textes pour les lire à voix haute
- **Activation** : Via toggle dans la page "Accessibilité DYS"
- **Fonctionnalités** :
  - Lecture en français avec vitesse adaptée (0.8x)
  - Animation lors de la lecture
  - Possibilité d'arrêter la lecture
  - Nettoyage automatique du markdown et mise en forme

### 3. Simplification Automatique des Consignes
- **Description** : Utilise l'IA pour reformuler les consignes complexes en phrases simples
- **Activation** : Via toggle dans la page "Accessibilité DYS"
- **Fonctionnalités** :
  - Remplacement des mots complexes par des synonymes simples
  - Division des phrases trop longues
  - Simplification de la ponctuation
  - Cache des résultats pour optimiser les performances
  - Indicateur visuel quand le texte a été simplifié

## 🔧 Architecture Technique

### Contexte d'Accessibilité
```typescript
// app/context/AccessibilityContext.tsx
interface AccessibilitySettings {
  isDysLexicFontEnabled: boolean;
  isAudioReadingEnabled: boolean;
  isAutoSimplificationEnabled: boolean;
}
```

### Composants Principaux

#### AccessibleText
Composant principal qui combine toutes les fonctionnalités :
```typescript
<AccessibleText
  weight="bold"
  enableSimplification={true}
  showAudioIcon={true}
>
  Votre texte ici
</AccessibleText>
```

#### AudioIcon
Composant pour la lecture audio :
```typescript
<AudioIcon
  text="Texte à lire"
  size={24}
  simplified={false}
/>
```

### Hooks Personnalisés

#### useDysFont
Gère l'application de la police OpenDyslexic :
```typescript
const { getDysFontStyle, isDysLexicFontEnabled } = useDysFont();
```

#### useTextSimplification
Gère la simplification automatique :
```typescript
const { simplifyText, isAutoSimplificationEnabled } = useTextSimplification();
```

## 📱 Interface Utilisateur

### Page Accessibilité DYS
- **Chemin** : `/(tabs)/settings/accessibility`
- **Design** : Interface enfantine avec couleurs douces
- **Animations** : Transitions fluides lors de l'activation des toggles
- **Icônes** : Chaque fonctionnalité a une icône explicite

### Bouton d'Accès
- **Emplacement** : Section "Apparence" des paramètres
- **Libellé** : "Modules Accessibilité DYS"
- **Icône** : `accessibility-outline`

## 🎨 Design System

### Couleurs
- **Police DYS** : Amber (#f59e0b)
- **Audio** : Blue (#3b82f6)
- **Simplification** : Green (#10b981)
- **Indicateurs** : Couleurs adaptées au mode sombre/clair

### Animations
- **Durée** : 300ms pour les transitions
- **Easing** : Transitions fluides avec `useNativeDriver`
- **Feedback** : Vibrations haptiques lors des interactions

## 💾 Persistance des Données

Les paramètres sont sauvegardés dans Firestore :
```typescript
// Structure dans Firestore
{
  accessibilitySettings: {
    isDysLexicFontEnabled: boolean,
    isAudioReadingEnabled: boolean,
    isAutoSimplificationEnabled: boolean
  }
}
```

## 🔨 Utilisation dans le Code

### Remplacement des Text par AccessibleText

**Avant :**
```typescript
<Text style={styles.title}>
  Titre de l'exercice
</Text>
```

**Après :**
```typescript
<AccessibleText
  weight="bold"
  style={styles.title}
>
  Titre de l'exercice
</AccessibleText>
```

### Ajout d'audio pour les consignes

```typescript
<AccessibleText
  enableSimplification={true}
  showAudioIcon={true}
>
  Dans cet exercice, vous devez effectuer les opérations suivantes...
</AccessibleText>
```

## 🚀 Performance

### Optimisations
- **Cache** : Les textes simplifiés sont mis en cache
- **Lazy Loading** : Les fonctionnalités ne s'activent que si nécessaire
- **Memory Management** : Nettoyage automatique des ressources audio

### Métriques
- **Temps de simplification** : ~100ms par texte
- **Taille des polices** : ~1MB total pour OpenDyslexic
- **Impact mémoire** : Minimal grâce au cache intelligent

## 🧪 Tests et Validation

### Tests Utilisateur
- Interface testée avec des enfants DYS
- Feedback intégré pour l'amélioration continue
- Validation avec des enseignants spécialisés

### Tests Techniques
- Compatibilité iOS/Android
- Performance sur différents appareils
- Accessibilité native (VoiceOver, TalkBack)

## 🔮 Évolutions Futures

### Fonctionnalités Prévues
1. **Intégration IA avancée** : Utilisation de Mistral AI pour une simplification plus sophistiquée
2. **Personnalisation** : Réglages fins de la vitesse audio, taille de police, etc.
3. **Statistiques** : Suivi de l'utilisation des fonctionnalités d'aide
4. **Mode Focus** : Réduction des distractions visuelles
5. **Support multilingue** : Adaptation pour d'autres langues

### Améliorations Techniques
- Migration vers les dernières APIs d'accessibilité
- Optimisation des performances
- Tests automatisés pour l'accessibilité

## 📞 Support

Pour toute question ou amélioration des fonctionnalités d'accessibilité :
- Créer une issue GitHub avec le label `accessibility`
- Contacter l'équipe de développement
- Consulter la documentation technique complète