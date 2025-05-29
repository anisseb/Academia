# 🎓 AcademIA - Application Mobile Éducative

[![Site Web](https://img.shields.io/badge/Site%20Web-AcademIA-blue)](https://academiaforkids.com/)
[![Contact](https://img.shields.io/badge/Contact-Email-red)](mailto:contact@academiaforkids.com)

AcademIA est une application éducative innovante dédiée aux élèves de l'école primaire jusqu'à la terminale. Notre mission est de rendre l'apprentissage plus efficace, personnalisé et accessible à tous, grâce à la puissance de l'intelligence artificielle.

## 🌟 Fonctionnalités Principales

### 📚 Apprentissage Personnalisé
- Cours générés par IA, 100% alignés avec le programme de l'Éducation nationale
- Exercices QCM illimités et adaptés au niveau de l'élève
- Suivi des performances et statistiques détaillées

### 🤖 Intelligence Artificielle
- Assistant IA conversationnel pour l'aide aux devoirs
- Profils d'IA personnalisables
- Chat intelligent et accompagnement sur-mesure

### 🎮 Gamification
- Système de succès et badges
- Classements et compétitions
- Avatars personnalisables

### 📱 Application Mobile
- Interface intuitive et moderne
- Notifications intelligentes
- Synchronisation multi-appareils

## 🛠️ Technologies Utilisées

- React Native avec Expo
- Firebase (Auth, Storage, Firestore)
- TypeScript
- Intelligence Artificielle
- @react-native-async-storage/async-storage

## 🚀 Installation

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

## ⚙️ Configuration Firebase

L'application nécessite une configuration Firebase. Assurez-vous d'avoir :
- Un projet Firebase
- Les services Authentication et Storage activés
- Le fichier de configuration dans `firebaseConfig.js`

## 📁 Structure du Projet

```
academia/
├── app/
│   ├── (tabs)/        # Navigation par onglets
│   ├── auth.tsx       # Écran d'authentification
│   └── ...
├── components/        # Composants réutilisables
├── context/          # Contextes React
├── utils/            # Utilitaires
└── firebaseConfig.js # Configuration Firebase
```

## 📞 Contact

- Site Web : [academiaforkids.com](https://academiaforkids.com/)
- Email : [contact@academiaforkids.com](mailto:contact@academiaforkids.com)

## 📄 Licence

© 2025 AcademIA. Tous droits réservés. 