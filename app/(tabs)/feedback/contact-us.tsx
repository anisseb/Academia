import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { showAlert } from '../../utils/alerts';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactUsScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      showAlert('Erreur ❌', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        showAlert('Erreur ❌', 'Vous devez être connecté pour envoyer un message');
        return;
      }

      const contactUsRef = doc(db, 'contactUs', user.uid);
      const contactUsDoc = await getDoc(contactUsRef);

      const newMessage = {
        subject: subject.trim(),
        message: message.trim(),
        userEmail: user.email,
        createdAt: new Date().toISOString(),
      };

      if (!contactUsDoc.exists()) {
        await setDoc(contactUsRef, {
          messages: [newMessage]
        });
      } else {
        await updateDoc(contactUsRef, {
          messages: arrayUnion(newMessage)
        });
      }

      showAlert('Succès ✨', 'Votre message a été envoyé avec succès');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      showAlert('Erreur ❌', 'Une erreur est survenue lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' },
          gestureEnabled: false
        }}
      />
      <View 
        style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}
      >
        <View style={{ top: insets.top }}>
          <TouchableOpacity
              style={[styles.backButton, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}
              onPress={() => router.back()}
            >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkMode ? '#ffffff' : '#000000'}
            />
          </TouchableOpacity>
          <ScrollView style={[styles.content, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
              <View style={styles.header}>
              <Ionicons 
                  name="mail-outline" 
                  size={32} 
                  color={isDarkMode ? '#ffffff' : '#000000'} 
              />
              <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  Contactez-nous
              </Text>
              <Text style={[styles.subtitle, { color: isDarkMode ? '#a0a0a0' : '#666666' }]}>
                  Nous vous répondrons dans les plus brefs délais
              </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                    Sujet
                    </Text>
                    <TextInput
                    style={[
                        styles.input,
                        { 
                        backgroundColor: isDarkMode ? '#3d3d3d' : '#ffffff',
                        color: isDarkMode ? '#ffffff' : '#000000',
                        borderColor: isDarkMode ? '#4d4d4d' : '#e0e0e0'
                        }
                    ]}
                    placeholder="Entrez le sujet de votre message"
                    placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                    value={subject}
                    onChangeText={setSubject}
                    maxLength={100}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                    Message
                    </Text>
                    <TextInput
                    style={[
                        styles.textArea,
                        { 
                        backgroundColor: isDarkMode ? '#3d3d3d' : '#ffffff',
                        color: isDarkMode ? '#ffffff' : '#000000',
                        borderColor: isDarkMode ? '#4d4d4d' : '#e0e0e0'
                        }
                    ]}
                    placeholder="Entrez votre message"
                    placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    maxLength={1000}
                    />
                </View>

                <TouchableOpacity
                    style={[
                    styles.submitButton,
                    { backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' },
                    isLoading && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                    ) : (
                    <Text style={styles.submitButtonText}>Envoyer</Text>
                    )}
                </TouchableOpacity>
              </View>
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    margin: 20,
    marginTop: 100,
    borderRadius: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
  },
});
