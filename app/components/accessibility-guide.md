# Guide d'utilisation des fonctionnalités d'accessibilité DYS

## Vue d'ensemble

Les fonctionnalités d'accessibilité DYS sont conçues pour aider les élèves ayant des troubles DYS à mieux apprendre. Voici comment les intégrer dans votre application.

## 1. Utiliser le texte accessible

Remplacez tous les composants `Text` par `DysText` :

```tsx
import { DysText } from '../components/DysText';

// Au lieu de :
<Text>Mon texte</Text>

// Utilisez :
<DysText>Mon texte</DysText>
```

## 2. Ajouter des boutons audio

Pour permettre la lecture audio des consignes :

```tsx
import { AudioButton } from '../components/AudioButton';

<View style={styles.header}>
  <DysText>Titre de l'exercice</DysText>
  <AudioButton 
    text="Texte à lire à haute voix"
    size="small"
  />
</View>
```

## 3. Simplifier les consignes

Utilisez le hook `useSimplifyText` pour simplifier automatiquement les textes :

```tsx
import { useSimplifyText } from '../hooks/useSimplifyText';

const MyComponent = () => {
  const { simplifyText, isSimplifying } = useSimplifyText();
  const [simplifiedText, setSimplifiedText] = useState('');

  useEffect(() => {
    const loadText = async () => {
      const result = await simplifyText(originalText);
      setSimplifiedText(result.simplifiedText);
    };
    loadText();
  }, [originalText]);

  return (
    <DysText>{simplifiedText}</DysText>
  );
};
```

## 4. Utiliser le composant AccessibleExercise

Pour un exercice complet avec toutes les fonctionnalités :

```tsx
import { AccessibleExercise } from '../components/AccessibleExercise';

<AccessibleExercise
  title="Exercice de mathématiques"
  instruction="Calcule la somme de 5 + 3 et écris ta réponse."
>
  {/* Votre contenu d'exercice ici */}
  <TextInput />
  <Button title="Valider" />
</AccessibleExercise>
```

## 5. Vérifier l'état des fonctionnalités

Pour adapter votre interface selon les paramètres activés :

```tsx
import { useAccessibility } from '../context/AccessibilityContext';

const MyComponent = () => {
  const { 
    isDyslexicFontEnabled,
    isAudioReadingEnabled,
    isSimplificationEnabled 
  } = useAccessibility();

  return (
    <View>
      {isAudioReadingEnabled && <AudioButton text={content} />}
      {/* Autres adaptations... */}
    </View>
  );
};
```

## 6. Personnaliser les styles avec la police DYS

Utilisez le hook `useDysFont` pour des styles personnalisés :

```tsx
import { useDysFont } from '../components/DysText';

const MyComponent = () => {
  const { getDysTextStyle } = useDysFont();

  return (
    <Text style={[styles.myText, getDysTextStyle(false)]}>
      Texte normal
    </Text>
    <Text style={[styles.myBoldText, getDysTextStyle(true)]}>
      Texte en gras
    </Text>
  );
};
```

## Bonnes pratiques

1. **Cohérence** : Utilisez `DysText` partout dans l'application pour une expérience uniforme.

2. **Performance** : Le hook `useSimplifyText` met en cache les résultats pour éviter les appels API répétés.

3. **Feedback visuel** : Les animations sur les toggles aident les enfants à comprendre que quelque chose a changé.

4. **Couleurs douces** : L'interface utilise des couleurs pastel pour être plus agréable visuellement.

5. **Icônes explicites** : Chaque fonctionnalité a une icône claire pour aider à la compréhension.

## Configuration de l'API de simplification

Pour utiliser une vraie API d'IA (OpenAI, Claude, etc.), modifiez le hook `useSimplifyText` :

```typescript
// Dans useSimplifyText.ts
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'system',
      content: 'Tu es un assistant qui simplifie les textes pour les enfants DYS. Utilise des mots simples, des phrases courtes, et ajoute des émojis pertinents.'
    }, {
      role: 'user',
      content: text
    }]
  })
});
```

## Prochaines étapes

1. Télécharger et ajouter les polices OpenDyslexic dans `assets/fonts/`
2. Configurer votre API d'IA préférée pour la simplification
3. Tester avec de vrais utilisateurs DYS pour affiner l'expérience