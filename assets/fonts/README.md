# Polices OpenDyslexic

Pour activer la fonctionnalité de police DYS, vous devez télécharger les fichiers de police OpenDyslexic et les placer dans ce dossier.

## Instructions

1. Téléchargez les polices OpenDyslexic depuis le site officiel :
   - [OpenDyslexic Official](https://opendyslexic.org/)
   - Ou depuis GitHub : [OpenDyslexic GitHub](https://github.com/antijingoist/opendyslexic)

2. Placez les fichiers suivants dans ce dossier :
   - `OpenDyslexic-Regular.otf`
   - `OpenDyslexic-Bold.otf`

3. Les polices seront automatiquement chargées par l'application.

## Alternative temporaire

En attendant d'avoir les vraies polices, vous pouvez commenter les lignes de chargement des polices dans `app/_layout.tsx` pour éviter les erreurs :

```typescript
const [fontsLoaded] = useFonts({
  // 'OpenDyslexic': require('../assets/fonts/OpenDyslexic-Regular.otf'),
  // 'OpenDyslexic-Bold': require('../assets/fonts/OpenDyslexic-Bold.otf'),
});
```

## Licence

OpenDyslexic est distribué sous licence SIL Open Font License (OFL).