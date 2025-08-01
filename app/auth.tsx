import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithCredential,
  OAuthProvider,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { showErrorAlert, showSuccessAlert } from './utils/alerts';
import { Image } from 'expo-image';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import ResetPassword from './components/ResetPassword';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [savedUserName, setSavedUserName] = useState('');
  const [showFullForm, setShowFullForm] = useState(false);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);
  const [isGoogleAuthAvailable, setIsGoogleAuthAvailable] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const initializeAuth = async () => {
      await checkBiometricSupport();
      await checkSavedCredentials();
      await checkAppleAuthAvailability();
      await configureGoogleSignIn();
    };
    initializeAuth();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricSupported(compatible && enrolled);
  };

  const checkSavedCredentials = async () => {
    try {
      const savedEmail = await SecureStore.getItemAsync('userEmail');
      const savedAuthMethod = await SecureStore.getItemAsync('authMethod');
      const hasCredentials = !!(savedEmail && savedAuthMethod);
      setHasSavedCredentials(hasCredentials);
      
      if (hasCredentials) {
        const auth = getAuth();
        try {
          if (savedAuthMethod === 'email') {
            const savedPassword = await SecureStore.getItemAsync('userPassword');
            if (savedPassword) {
              const userCredential = await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
              const userId = userCredential.user.uid;
              const userDoc = await getDoc(doc(db, 'users', userId));
              if (userDoc.exists()) {
                setSavedUserName(userDoc.data().profile.name || 'Utilisateur');
              }
              await auth.signOut();
            }
          } else if (savedAuthMethod === 'apple') {
            // Pour Apple, on récupère le nom depuis le stockage local
            const savedDisplayName = await SecureStore.getItemAsync('userDisplayName');
            setSavedUserName(savedDisplayName || 'Utilisateur Apple');
          } else if (savedAuthMethod === 'google') {
            // Pour Google, on récupère le nom depuis le stockage local
            const savedDisplayName = await SecureStore.getItemAsync('userDisplayName');
            setSavedUserName(savedDisplayName || 'Utilisateur Google');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des informations utilisateur:', error);
          // Nettoyer tous les identifiants en cas d'erreur
          await SecureStore.deleteItemAsync('userEmail');
          await SecureStore.deleteItemAsync('userPassword');
          await SecureStore.deleteItemAsync('userId');
          await SecureStore.deleteItemAsync('userDisplayName');
          await SecureStore.deleteItemAsync('authMethod');
          setHasSavedCredentials(false);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des identifiants:', error);
    }
  };

  const checkAppleAuthAvailability = async () => {
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      
      // Vérifications supplémentaires
      if (isAvailable) {
        // Test rapide pour voir si l'authentification fonctionne
        try {
          // Cette vérification peut échouer si l'utilisateur n'est pas connecté à iCloud
          // mais ne devrait pas causer d'erreur fatal
        } catch (testError) {
          console.log('Test Apple Authentication échoué:', testError);
          // Ne pas désactiver complètement, juste logger l'erreur
        }
      }
      
      setIsAppleAuthAvailable(isAvailable);
    } catch (error) {
      console.error('Erreur lors de la vérification d\'Apple Authentication:', error);
      setIsAppleAuthAvailable(false);
    }
  };

  const configureGoogleSignIn = async () => {
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        offlineAccess: true
      });
      
      setIsGoogleAuthAvailable(true);
    } catch (error) {
      console.error('Erreur lors de la configuration Google Sign In:', error);
      setIsGoogleAuthAvailable(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentification avec Face ID',
        fallbackLabel: 'Utiliser le mot de passe',
        disableDeviceFallback: false,
        cancelLabel: 'Annuler'
      });

      if (result.success) {
        const savedEmail = await SecureStore.getItemAsync('userEmail');
        const savedAuthMethod = await SecureStore.getItemAsync('authMethod');
        
        if (savedEmail && savedAuthMethod === 'email') {
          setIsLoading(true);
          try {
            const savedPassword = await SecureStore.getItemAsync('userPassword');
            if (savedPassword) {
              await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
              router.replace('/onboarding');
            }
          } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            showErrorAlert('Erreur', 'Échec de la connexion automatique');
          } finally {
            setIsLoading(false);
          }
        } else if (savedEmail && savedAuthMethod === 'apple') {
          // Pour Apple, on lance directement l'authentification Apple
          setIsLoading(true);
          try {
            await handleAppleAuth();
          } catch (error) {
            console.error('Erreur lors de la reconnexion Apple:', error);
            showErrorAlert('Erreur', 'Échec de la reconnexion Apple');
          } finally {
            setIsLoading(false);
          }
        } else if (savedEmail && savedAuthMethod === 'google') {
          // Pour Google, on utilise une méthode de reconnexion plus stable
          setIsLoading(true);
          try {
            await handleGoogleQuickAuth();
          } catch (error) {
            console.error('Erreur lors de la reconnexion Google:', error);
            showErrorAlert('Erreur', 'Échec de la reconnexion Google');
          } finally {
            setIsLoading(false);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'authentification biométrique:', error);
    }
  };

  // Fonction pour vérifier la complexité du mot de passe
  const isPasswordValid = (pass: string) => {
    // Au moins 8 caractères, une majuscule et un caractère spécial
    const hasMinLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    return hasMinLength && hasUpperCase && hasSpecialChar;
  };

  // Fonction pour obtenir les messages d'erreur de validation du mot de passe
  const getPasswordValidationErrors = (pass: string) => {
    const errors = [];
    if (pass.length < 8) errors.push('8 caractères minimum');
    if (!/[A-Z]/.test(pass)) errors.push('une majuscule');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) errors.push('un caractère spécial');
    return errors;
  };

  const handleAuth = async () => {
    if (!email || !password) {
      showErrorAlert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        showErrorAlert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
      }

      if (!isPasswordValid(password)) {
        const errors = getPasswordValidationErrors(password);
        showErrorAlert(
          'Mot de passe invalide', 
          `Le mot de passe doit contenir au moins ${errors.join(', ')}`
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        
        // Si c'est la première connexion réussie, proposer de sauvegarder les identifiants
        if (!hasSavedCredentials && isBiometricSupported) {
          const shouldSave = await new Promise((resolve) => {
            Alert.alert(
              'Sauvegarder les identifiants',
              'Voulez-vous utiliser Face ID pour vous connecter plus rapidement ?',
              [
                {
                  text: 'Non',
                  onPress: () => resolve(false),
                  style: 'cancel'
                },
                {
                  text: 'Oui',
                  onPress: () => resolve(true)
                }
              ]
            );
          });

          if (shouldSave) {
            await saveCredentials(email, password);
            setHasSavedCredentials(true);
          }
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        
        await setDoc(doc(db, 'users', userId), {
          profile: {
            name: '',
            username: '',
            country: '',
            schoolType: '',
            completedAchievements: [],
            displayedAchievements: [],
            completedExercises: {},
            class: '',
            section: '',
            onboardingCompleted: false,
            subjects: [],
            email: email,
            createdAt: new Date(),
          },
        });
      }
      router.replace('/onboarding');
    } catch (error: any) {      
      // Messages d'erreur personnalisés
      let errorMessage = 'Une erreur est survenue lors de l\'authentification';
      let errorTitle = 'Erreur';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorTitle = 'Email déjà utilisé';
          errorMessage = 'Cette adresse email est déjà utilisée';
          break;
        case 'auth/invalid-email':
          errorTitle = 'Email invalide';
          errorMessage = 'Adresse email invalide';
          break;
        case 'auth/operation-not-allowed':
          errorTitle = 'Opération non autorisée';
          errorMessage = 'Opération non autorisée';
          break;
        case 'auth/weak-password':
          errorTitle = 'Mot de passe faible';
          errorMessage = 'Le mot de passe est trop faible';
          break;
        case 'auth/user-disabled':
          errorTitle = 'Compte désactivé';
          errorMessage = 'Ce compte a été désactivé';
          break;
        case 'auth/user-not-found':
          errorTitle = 'Compte non trouvé';
          errorMessage = 'Aucun compte associé à cette adresse email';
          break;
        case 'auth/invalid-credential':
          errorTitle = 'Mot de passe incorrect';
          errorMessage = 'Mot de passe incorrect';
          break;
        case 'auth/too-many-requests':
          errorTitle = 'Trop de tentatives';
          errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
          break;
      }
      
      showErrorAlert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowResetPassword(true);
  };

  const saveCredentials = async (email: string, password: string) => {
    try {
      await SecureStore.setItemAsync('userEmail', email);
      await SecureStore.setItemAsync('userPassword', password);
      await SecureStore.setItemAsync('authMethod', 'email');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des identifiants:', error);
    }
  };

  const saveAppleCredentials = async (userId: string, email: string, displayName: string) => {
    try {
      await SecureStore.setItemAsync('userEmail', email);
      await SecureStore.setItemAsync('userId', userId);
      await SecureStore.setItemAsync('userDisplayName', displayName);
      await SecureStore.setItemAsync('authMethod', 'apple');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des identifiants Apple:', error);
    }
  };

  const saveGoogleCredentials = async (userId: string, email: string, displayName: string) => {
    try {
      await SecureStore.setItemAsync('userEmail', email);
      await SecureStore.setItemAsync('userId', userId);
      await SecureStore.setItemAsync('userDisplayName', displayName);
      await SecureStore.setItemAsync('authMethod', 'google');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des identifiants Google:', error);
    }
  };

  const handleAppleAuth = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier d'abord si Apple Authentication est disponible
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      
      if (!isAvailable) {
        showErrorAlert('Erreur', 'Apple Authentication n\'est pas disponible sur cet appareil');
        return;
      }

              const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        const { identityToken, email, fullName } = credential;
        
        if (!identityToken) {
          showErrorAlert('Erreur', 'Token d\'identité Apple manquant');
          return;
        }

        
        const provider = new OAuthProvider('apple.com');
        const firebaseCredential = provider.credential({
          idToken: identityToken,
        });

        const userCredential = await signInWithCredential(auth, firebaseCredential);
        const userId = userCredential.user.uid;
        
        // Vérifier si l'utilisateur existe déjà
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
          // Créer un nouveau profil utilisateur
          const displayName = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : '';
          
          // Gérer l'email masqué d'Apple
          const userEmail = email || '';
          const isPrivateEmail = userEmail.includes('privaterelay.appleid.com');
            
          await setDoc(doc(db, 'users', userId), {
            profile: {
              name: displayName,
              username: '',
              country: '',
              schoolType: '',
              completedAchievements: [],
              displayedAchievements: [],
              completedExercises: {},
              class: '',
              section: '',
              onboardingCompleted: false,
              subjects: [],
              email: userEmail,
              isPrivateEmail: isPrivateEmail, // Marquer si c'est un email privé
              createdAt: new Date(),
            },
          });
          
          // Sauvegarder les identifiants pour la reconnexion rapide
          await saveAppleCredentials(userId, userEmail, displayName);
        } else {
          
          // Mettre à jour l'email si nécessaire (pour les utilisateurs existants)
          const userData = userDoc.data();
          const displayName = userData.profile.name || '';
          const userEmail = email || userData.profile.email || '';
          
          if (!userData.profile.email && email) {
            await setDoc(doc(db, 'users', userId), {
              profile: {
                ...userData.profile,
                email: email,
                isPrivateEmail: email.includes('privaterelay.appleid.com')
              }
            }, { merge: true });
          }
          
          // Sauvegarder les identifiants pour la reconnexion rapide
          await saveAppleCredentials(userId, userEmail, displayName);
        }
        
        router.replace('/onboarding');
    } catch (error: any) {
      console.error('Erreur détaillée lors de l\'authentification Apple:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'ERR_CANCELED') {
        // L'utilisateur a annulé l'authentification
      } else if (error.code === 'auth/operation-not-allowed') {
        showErrorAlert('Erreur', 'Apple Authentication n\'est pas activé dans Firebase. Veuillez contacter l\'administrateur.');
      } else if (error.code === 'auth/invalid-credential') {
        showErrorAlert('Erreur', 'Identifiants Apple invalides. Veuillez réessayer.');
      } else {
        showErrorAlert('Erreur', `Échec de la connexion avec Apple: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleQuickAuth = async () => {
    try {
      // Vérifier que Google Play Services est disponible (Android)
      if (Platform.OS === 'android') {
        const hasPlayServices = await GoogleSignin.hasPlayServices();
        if (!hasPlayServices) {
          showErrorAlert('Erreur', 'Google Play Services n\'est pas disponible');
          return;
        }
      }

      // Pour la reconnexion rapide, on ne fait pas de signOut préalable
      // pour éviter les conflits de timing
      let userInfo;
      try {
        userInfo = await GoogleSignin.signIn();
      } catch (signInError) {
        return;
      }

      // Vérifier si l'utilisateur a annulé l'authentification
      if (!userInfo || userInfo.type === 'cancelled' || !userInfo.data) {
        return;
      }

      // Utiliser l'API Firebase pour l'authentification Google
      let idToken;
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      } catch (tokenError) {
        return;
      }
      
      if (!idToken) {
        return;
      }

      // Vérification supplémentaire : s'assurer que le token est valide
      if (idToken.length < 10) {
        return;
      }

      
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const userId = userCredential.user.uid;
      
      // Vérifier si l'utilisateur existe déjà
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        // Récupérer les informations utilisateur depuis Firebase
        const firebaseUser = userCredential.user;
        
        await setDoc(doc(db, 'users', userId), {
          profile: {
            name: firebaseUser.displayName || '',
            username: '',
            country: '',
            schoolType: '',
            completedAchievements: [],
            displayedAchievements: [],
            completedExercises: {},
            class: '',
            section: '',
            onboardingCompleted: false,
            subjects: [],
            email: firebaseUser.email || '',
            createdAt: new Date(),
          },
        });
        
        // Sauvegarder les identifiants pour la reconnexion rapide
        await saveGoogleCredentials(userId, firebaseUser.email || '', firebaseUser.displayName || '');
      } else {
        
        // Sauvegarder les identifiants pour la reconnexion rapide
        const userData = userDoc.data();
        const firebaseUser = userCredential.user;
        const displayName = userData.profile.name || firebaseUser.displayName || '';
        const userEmail = firebaseUser.email || userData.profile.email || '';
        
        await saveGoogleCredentials(userId, userEmail, displayName);
      }
      
      router.replace('/onboarding');
    } catch (error: any) {
      console.error('Erreur détaillée lors de la reconnexion rapide Google:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Vérifier les différents codes d'erreur d'annulation
      if (error.code === 'SIGN_IN_CANCELLED' || 
          error.code === 'SIGN_IN_REQUIRED' ||
          error.code === 'SIGN_IN_FAILED' ||
          error.message?.includes('cancelled') ||
          error.message?.includes('canceled') ||
          error.message?.includes('user cancelled') ||
          error.message?.includes('user canceled')) {
        // Ne pas afficher d'erreur pour une annulation
        return;
      } else if (error.code === 'auth/operation-not-allowed') {
        showErrorAlert('Erreur', 'Google Authentication n\'est pas activé dans Firebase. Veuillez contacter l\'administrateur.');
      } else if (error.code === 'auth/invalid-credential') {
        showErrorAlert('Erreur', 'Identifiants Google invalides. Veuillez réessayer.');
      } else if (error.code === 'auth/user-disabled') {
        showErrorAlert('Erreur', 'Ce compte Google a été désactivé.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        showErrorAlert('Erreur', 'Un compte existe déjà avec cette adresse email mais avec une méthode de connexion différente.');
      } else {
        showErrorAlert('Erreur', `Échec de la reconnexion avec Google: ${error.message}`);
      }
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier que Google Play Services est disponible (Android)
      if (Platform.OS === 'android') {
        const hasPlayServices = await GoogleSignin.hasPlayServices();
        if (!hasPlayServices) {
          showErrorAlert('Erreur', 'Google Play Services n\'est pas disponible');
          return;
        }
      }

      // Lancer l'authentification Google
      await GoogleSignin.hasPlayServices();
      
      // Se déconnecter d'abord pour forcer une nouvelle authentification
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        // Ignorer les erreurs de déconnexion
      }
      
      let userInfo;
      try {
        userInfo = await GoogleSignin.signIn();
      } catch (signInError) {
        return;
      }

      // Vérifier si l'utilisateur a annulé l'authentification
      if (!userInfo) {
        return;
      }

      // Utiliser l'API Firebase pour l'authentification Google
      let idToken;
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      } catch (tokenError) {
        return;
      }
      
      if (!idToken) {
        return;
      }

      // Vérification supplémentaire : s'assurer que le token est valide
      if (idToken.length < 10) {
        return;
      }

      
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const userId = userCredential.user.uid;
      
      
      // Vérifier si l'utilisateur existe déjà
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        
        // Récupérer les informations utilisateur depuis Firebase
        const firebaseUser = userCredential.user;
        
        await setDoc(doc(db, 'users', userId), {
          profile: {
            name: firebaseUser.displayName || '',
            username: '',
            country: '',
            schoolType: '',
            completedAchievements: [],
            displayedAchievements: [],
            completedExercises: {},
            class: '',
            section: '',
            onboardingCompleted: false,
            subjects: [],
            email: firebaseUser.email || '',
            createdAt: new Date(),
          },
        });
        
        // Sauvegarder les identifiants pour la reconnexion rapide
        await saveGoogleCredentials(userId, firebaseUser.email || '', firebaseUser.displayName || '');
      } else {
        
        // Sauvegarder les identifiants pour la reconnexion rapide
        const userData = userDoc.data();
        const firebaseUser = userCredential.user;
        const displayName = userData.profile.name || firebaseUser.displayName || '';
        const userEmail = firebaseUser.email || userData.profile.email || '';
        
        await saveGoogleCredentials(userId, userEmail, displayName);
      }
      
      router.replace('/onboarding');
    } catch (error: any) {
      console.error('Erreur détaillée lors de l\'authentification Google:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Vérifier les différents codes d'erreur d'annulation
      if (error.code === 'SIGN_IN_CANCELLED' || 
          error.code === 'SIGN_IN_REQUIRED' ||
          error.code === 'SIGN_IN_FAILED' ||
          error.message?.includes('cancelled') ||
          error.message?.includes('canceled') ||
          error.message?.includes('user cancelled') ||
          error.message?.includes('user canceled')) {
        // Ne pas afficher d'erreur pour une annulation
        return;
      } else if (error.code === 'auth/operation-not-allowed') {
        showErrorAlert('Erreur', 'Google Authentication n\'est pas activé dans Firebase. Veuillez contacter l\'administrateur.');
      } else if (error.code === 'auth/invalid-credential') {
        showErrorAlert('Erreur', 'Identifiants Google invalides. Veuillez réessayer.');
      } else if (error.code === 'auth/user-disabled') {
        showErrorAlert('Erreur', 'Ce compte Google a été désactivé.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        showErrorAlert('Erreur', 'Un compte existe déjà avec cette adresse email mais avec une méthode de connexion différente.');
      } else {
        showErrorAlert('Erreur', `Échec de la connexion avec Google: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { marginTop: insets.top }]}>
            <Image source={require('../assets/images/splash_screen_android.png')} style={styles.logo} contentFit="cover" cachePolicy="memory-disk"/>
        </View>

        <View style={styles.formContainer}>
            <Text style={styles.title}>{isLogin ? '👤 Connexion' : '✍️ Inscription'}</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>📧 Email</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@email.com"
              textContentType="username"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
              pointerEvents={isLoading ? "none" : "auto"}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>🔒 Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                textContentType="password"
                placeholder="••••••••"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                pointerEvents={isLoading ? "none" : "auto"}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <MaterialCommunityIcons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            {!isLogin && (
              <Text style={styles.passwordHint}>
                Le mot de passe doit contenir au moins 8 caractères, une majuscule et un caractère spécial
              </Text>
            )}
          </View>
          
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🔒 Confirmer le mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  textContentType="newPassword"
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                  pointerEvents={isLoading ? "none" : "auto"}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  <MaterialCommunityIcons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={24} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {isLogin && (
            <TouchableOpacity 
              style={styles.forgotPasswordButton} 
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>
                🔑 Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={isLogin ? (isBiometricSupported && !email && !password ? handleBiometricAuth : handleAuth) : handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
                <View style={styles.buttonContent}>
                  {isLogin && isBiometricSupported && !email && !password && (
                    <MaterialCommunityIcons 
                      name={Platform.OS === 'ios' ? 'face-recognition' : 'fingerprint'} 
                      size={24} 
                      color="#fff" 
                      style={styles.buttonIcon}
                    />
                  )}
              <Text style={styles.buttonText}>
                {isLogin ? 'Se connecter' : 'S\'inscrire'}
              </Text>
                </View>
            )}
          </TouchableOpacity>
          {isLogin && (
            <Text style={styles.orText}>
              Ou
            </Text>
          )}

          {isLogin && isAppleAuthAvailable && (
            <TouchableOpacity 
              style={[styles.appleButton, isLoading && styles.buttonDisabled]} 
              onPress={handleAppleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <MaterialCommunityIcons 
                    name="apple" 
                    size={24} 
                    color="#fff" 
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>
                    Se connecter avec Apple
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {isLogin && isGoogleAuthAvailable && (
            <TouchableOpacity 
              style={[styles.googleButton, isLoading && styles.buttonDisabled]} 
              onPress={handleGoogleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <MaterialCommunityIcons 
                    name="google" 
                    size={24} 
                    color="#fff" 
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>
                    Se connecter avec Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => {
                if (isLogin) {
                  setIsLogin(false);
                  setConfirmPassword('');
                } else {
                  setIsLogin(true);
                  setConfirmPassword('');
                }
            }}
            disabled={isLoading}
          >
            <Text style={styles.switchText}>
              {isLogin ? '✨ Créer un compte' : '👋 Déjà un compte ? Se connecter'}
            </Text>
          </TouchableOpacity>
                  </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <ResetPassword 
        visible={showResetPassword}
        onClose={() => setShowResetPassword(false)}
      />
    </>
  );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flex: 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  appTitle: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  highlightText: {
    color: '#60a5fa',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  formContainer: {
    flex: 0.75,
    backgroundColor: '#1a1a1a',
    padding: 25,
    paddingTop: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  passwordHint: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#60a5fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 15,
    shadowColor: '#60a5fa',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  buttonDisabled: {
    backgroundColor: '#4a5568',
    shadowOpacity: 0,
  },
  appleButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#4285F4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 15,
  },
  switchText: {
    color: '#60a5fa',
    textAlign: 'center',
    fontSize: 14,
  },
  orText: {
    color: '#60a5fa',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 10,
    padding: 5,
  },
  forgotPasswordText: {
    color: '#60a5fa',
    fontSize: 14,
  },
  logo: {
    width: 220,
    height: 160,
    marginBottom: 5,
    borderRadius: 20,
    backgroundColor: 'white',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  buttonIcon: {
    marginRight: 8,
  },
  simplifiedContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  simplifiedContent: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  authPrompt: {
    fontSize: 16,
    color: '#999',
    marginBottom: 30,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 8,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    color: '#60a5fa',
    marginLeft: 5,
    fontSize: 16,
  },
}); 