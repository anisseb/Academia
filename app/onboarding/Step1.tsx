import React from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingButton } from '../components/OnboardingButton';

type Step1Props = {
  onNext: (data: { name: string }) => void;
  data?: { name?: string };
};

export default function Step1({ onNext, data }: Step1Props) {
  const [name, setName] = React.useState(data?.name || '');
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenue !</Text>
        <Text style={styles.subtitle}>Comment souhaitez-vous être appelé ?</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Votre prénom"
          placeholderTextColor="#94a3b8"
          autoFocus
          autoCorrect={false}
          maxLength={30}
        />

        <OnboardingButton
          label="Continuer"
          onPress={() => name.trim() && onNext({ name: name.trim() })}
          disabled={!name.trim()}
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  button: {
    width: '100%',
  },
}); 