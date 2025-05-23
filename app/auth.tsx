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
  FacebookAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { showErrorAlert, showSuccessAlert } from './utils/alerts';
import { Image } from 'expo-image';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AccessToken,
  LoginButton,
  Settings,
  Profile,
  LoginManager,
} from "react-native-fbsdk-next";
import * as TrackingTransparency from 'expo-tracking-transparency';
import * as SecureStore from 'expo-secure-store';

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
  const [hasTrackingPermission, setHasTrackingPermission] = useState(Platform.OS !== 'ios');
  const router = useRouter();
  const auth = getAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const initializeAuth = async () => {
      await checkBiometricSupport();
      await checkSavedCredentials();
      if (Platform.OS === 'ios') {
        await checkTrackingPermission();
      }
    };
    initializeAuth();
  }, []);

  const checkTrackingPermission = async () => {
    try {
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
      if (status === 'granted') {
        setHasTrackingPermission(true);
        await Settings.setAdvertiserTrackingEnabled(true);
      } else {
        setHasTrackingPermission(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions de tracking:', error);
      setHasTrackingPermission(false);
    }
  };

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
          if (savedAuthMethod === 'facebook') {
            const userDoc = await getDoc(doc(db, 'users', savedEmail));
            if (userDoc.exists()) {
              setSavedUserName(userDoc.data().profile.name || 'Utilisateur');
            }
          } else {
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
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des informations utilisateur:', error);
          await SecureStore.deleteItemAsync('userEmail');
          await SecureStore.deleteItemAsync('userPassword');
          await SecureStore.deleteItemAsync('authMethod');
          setHasSavedCredentials(false);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des identifiants:', error);
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
        
        if (savedEmail && savedAuthMethod) {
          setIsLoading(true);
          try {
            if (savedAuthMethod === 'facebook') {
              const tokenData = await AccessToken.getCurrentAccessToken();
              if (tokenData?.accessToken) {
                await loginWithFacebook(tokenData.accessToken);
              } else {
                showErrorAlert('Erreur', 'Impossible de se connecter avec Facebook');
              }
            } else {
              const savedPassword = await SecureStore.getItemAsync('userPassword');
              if (savedPassword) {
                await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
                router.replace('/onboarding');
              }
            }
          } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            showErrorAlert('Erreur', 'Échec de la connexion automatique');
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
            is_admin: false,
            username: '',
            country: '',
            schoolType: '',
            class: '',
            section: '',
            onboardingCompleted: false,
            subjects: [],
            email: email,
            createdAt: new Date(),
          },
          threads: {}
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

  const handleForgotPassword = async () => {
    if (!email) {
      showErrorAlert('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showSuccessAlert(
        'Email envoyé',
        'Un email de réinitialisation a été envoyé à votre adresse email'
      );
    } catch (error: any) {      
      let errorMessage = 'Une erreur est survenue lors de l\'envoi de l\'email';
      let errorTitle = 'Erreur';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorTitle = 'Email invalide';
          errorMessage = 'Adresse email invalide';
          break;
        case 'auth/user-not-found':
          errorTitle = 'Compte non trouvé';
          errorMessage = 'Aucun compte associé à cette adresse email';
          break;
      }
      
      showErrorAlert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
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

  const loginWithFacebook = async (accessToken: string) => {
    try {
      setIsLoading(true);

      let facebookCredential;
      if (Platform.OS === "ios") {
        facebookCredential = FacebookAuthProvider.credential(accessToken);
      } else {
        facebookCredential = FacebookAuthProvider.credential(accessToken);
      }

      const userCredential = await signInWithCredential(auth, facebookCredential);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        const currentProfile = await Profile.getCurrentProfile();
        
        await setDoc(doc(db, 'users', user.uid), {
          profile: {
            name: '',
            username: '',
            country: '',
            schoolType: '',
            class: '',
            section: '',
            onboardingCompleted: false,
            subjects: [],
            createdAt: new Date(),
            facebookId: currentProfile?.userID
          },
          threads: {}
        });
      }

      // Sauvegarder les identifiants Facebook dans le Keychain
      await SecureStore.setItemAsync('userEmail', user.uid);
      await SecureStore.setItemAsync('authMethod', 'facebook');

      router.replace('/onboarding');
    } catch (error: any) {
      console.error('Erreur lors de la création du profil:', error);
      await LoginManager.logOut();
      
      switch (error.code) {
        case 'auth/account-exists-with-different-credential':
          showErrorAlert('Erreur', 'Un compte existe déjà avec cette adresse email mais avec une méthode de connexion différente');
          break;
        case 'auth/invalid-credential':
          showErrorAlert('Erreur', 'La connexion avec Facebook a échoué. Veuillez réessayer.');
          break;
        default:
          showErrorAlert('Erreur', 'Une erreur est survenue lors de la création du profil. Veuillez réessayer.');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderSimplifiedAuth = () => (
    <View style={styles.simplifiedContainer}>
      <View style={styles.header}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} contentFit="cover" cachePolicy="memory-disk" />
        <Text style={styles.appSubtitle}>Ton assistant personnel d'apprentissage</Text>
      </View>

      <View style={styles.simplifiedContent}>
        <Text style={styles.welcomeText}>Bonjour {savedUserName} !</Text>
        <Text style={styles.authPrompt}>Voulez-vous vous connecter avec ce compte ?</Text>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleBiometricAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons 
                name={Platform.OS === 'ios' ? 'face-recognition' : 'fingerprint'} 
                size={24} 
                color="#fff" 
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>
                Se connecter avec Face ID
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={() => setShowFullForm(true)}
        >
          <Text style={styles.switchText}>
            Utiliser un autre compte
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {hasSavedCredentials && !showFullForm ? (
        renderSimplifiedAuth()
      ) : (
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} contentFit="cover" cachePolicy="memory-disk" />
          <Text style={styles.appSubtitle}>Ton assistant personnel d'apprentissage</Text>
        </View>

        <View style={styles.formContainer}>
            {hasSavedCredentials && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowFullForm(false)}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#60a5fa" />
                <Text style={styles.backButtonText}>Retour</Text>
              </TouchableOpacity>
            )}

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

          {isLogin && (
            <View style={styles.socialButtonsContainer}>
              {Platform.OS === 'ios' && !hasTrackingPermission ? (
                <TouchableOpacity 
                  style={[styles.socialButton, styles.facebookButton]} 
                  onPress={checkTrackingPermission}
                >
                  <MaterialCommunityIcons name="facebook" size={24} color="#fff" style={styles.socialButtonIcon} />
                  <Text style={styles.socialButtonText}>Autoriser Facebook pour continuer</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.orContainer}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>ou</Text>
                    <View style={styles.orLine} />
                  </View>
                  <View style={styles.facebookButton}>
                    <LoginButton
                      onLoginFinished={async (error, result) => {
                        if (error) {
                          console.log("login has error: " + result);
                        } else if (result.isCancelled) {
                          console.log("login is cancelled.");
                        } else {
                          try {
                            const tokenData = await AccessToken.getCurrentAccessToken();
                            if (!tokenData?.accessToken) {
                              throw new Error("Token d'accès manquant");
                            }
                            await loginWithFacebook(tokenData.accessToken);
                          } catch (error) {
                            console.error("Erreur lors de la récupération du token:", error);
                            showErrorAlert('Erreur', 'Impossible de récupérer le token d\'authentification');
                          }
                        }
                      }}
                      onLogoutFinished={async () => {
                        try {
                          // Supprimer les identifiants de SecureStore
                          await SecureStore.deleteItemAsync('userEmail');
                          await SecureStore.deleteItemAsync('userPassword');
                          await SecureStore.deleteItemAsync('authMethod');
                          
                          // Déconnecter de Firebase
                          await auth.signOut();
                          
                          // Déconnecter de Facebook
                          await LoginManager.logOut();
                          
                          // Réinitialiser l'état
                          setHasSavedCredentials(false);
                          setSavedUserName('');
                          setShowFullForm(false);
                          
                        } catch (error) {
                          console.error("Erreur lors de la déconnexion:", error);
                          showErrorAlert('Erreur', 'Une erreur est survenue lors de la déconnexion');
                        }
                      }}
                    />
                </View>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      )}
    </KeyboardAvoidingView>
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
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
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
    flex: 0.7,
    backgroundColor: '#2d2d2d',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
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
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
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
    height: 56,
  },
  buttonDisabled: {
    backgroundColor: '#4a5568',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
  },
  switchText: {
    color: '#60a5fa',
    textAlign: 'center',
    fontSize: 14,
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
    width: 320,
    height: 120,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  socialButtonsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    marginBottom: 15,
  },
  facebookButton: {
    backgroundColor: '#1877f2',
    padding: 15,
    borderRadius: 12,
    width: 200,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#666',
    marginHorizontal: 10,
  },
  orText: {
    color: '#666',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
}); 