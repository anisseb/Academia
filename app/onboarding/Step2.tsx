import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { OnboardingButton } from '../components/OnboardingButton';
import { validateUsername } from '../utils/usernameValidation';

type Step2Props = {
  onNext: (data: { username: string }) => void;
  onBack: () => void;
  data?: { name?: string; username?: string };
};

export default function Step2({ onNext, onBack, data }: Step2Props) {
  const [username, setUsername] = useState(data?.username || '');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    if (username) {
      validateUsername(username, currentUsername);
    }
  }, [username]);

  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    setError(null);
    setIsValid(false);

    if (!value.trim()) {
      return;
    }

    const validationResult = await validateUsername(value, currentUsername);
    setIsValid(validationResult.isValid);
    if (!validationResult.isValid && validationResult.error) {
      setError(validationResult.error);
    }
  };

  const handleNext = () => {
    if (isValid) {
      onNext({ username: username.trim() });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Choisissez votre pseudo</Text>
        <Text style={styles.subtitle}>
          Ce sera votre identifiant visible par les autres utilisateurs
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="Votre pseudo"
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isChecking && (
            <ActivityIndicator style={styles.loader} size="small" color="#007AFF" />
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.footer}>
          <OnboardingButton
            icon="arrow-left"
            onPress={onBack}
            style={styles.backButton}
          />
          <OnboardingButton
            label="Continuer"
            onPress={handleNext}
            disabled={!isValid || isChecking}
            style={styles.continueButton}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#1e293b',
    color: '#fff',
    marginBottom: 10,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 20,
  },
  loader: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1e293b',
  },
  continueButton: {
    flex: 1,
    marginLeft: 12,
  },
}); 