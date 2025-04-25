import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { showErrorAlert, showSuccessAlert } from './utils/alerts';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const auth = getAuth();

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
      // Validation pour l'inscription
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
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        
        // Créer le document profil
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.appTitle}>Academ<Text style={styles.highlightText}>IA</Text></Text>
          <Text style={styles.appSubtitle}>Ton assistant personnel d'apprentissage</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>{isLogin ? '👋 Connexion' : '✨ Inscription'}</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>📧 Email</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@email.com"
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
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Se connecter' : 'S\'inscrire'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => {
              setIsLogin(!isLogin);
              setConfirmPassword('');
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
    padding: 10,
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
}); 