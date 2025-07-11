import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { showErrorAlert, showSuccessAlert } from '../utils/alerts';

interface ResetPasswordProps {
  visible: boolean;
  onClose: () => void;
}

export default function ResetPassword({ visible, onClose }: ResetPasswordProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();

  const handleResetPassword = async () => {
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
      setEmail('');
      onClose();
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>🔑 Mot de passe oublié</Text>
          </View>

          <Text style={styles.description}>
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </Text>

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

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                Réinitialiser le mot de passe
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelText}>
              Annuler
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -5,
    zIndex: 10,
    padding: 8,
    backgroundColor: '#444',
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    paddingRight: 40,
  },
  description: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 25,
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
  button: {
    backgroundColor: '#60a5fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
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
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 10,
  },
  cancelText: {
    color: '#60a5fa',
    fontSize: 16,
  },
});
