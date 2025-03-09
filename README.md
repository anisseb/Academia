# Academia - Application Mobile

Une application mobile React Native/Expo pour capturer et analyser des images avec authentification Firebase.

## Fonctionnalités

- 📱 Authentification utilisateur (connexion/inscription)
- 📸 Capture de photos avec la caméra
- 🔄 Flip caméra avant/arrière
- 🖼️ Prévisualisation des photos
- ☁️ Stockage des images dans Firebase Storage
- 🔐 Gestion des sessions avec AsyncStorage

## Technologies

- React Native avec Expo
- Firebase (Auth, Storage, Firestore)
- TypeScript
- @react-native-async-storage/async-storage

## Installation

1. Cloner le repository
```bash
git clone [votre-repo]
cd academia
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer l'application
```bash
npx expo start
```

## Configuration Firebase

L'application nécessite une configuration Firebase. Assurez-vous d'avoir :
- Un projet Firebase
- Les services Authentication et Storage activés
- Le fichier de configuration dans `firebaseConfig.js`

## Structure du Projet

- `/app` - Routes et composants principaux
- `/app/(tabs)` - Navigation par onglets
- `/app/auth.tsx` - Écran d'authentification
- `firebaseConfig.js` - Configuration Firebase 