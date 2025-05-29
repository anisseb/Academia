import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { auth, db, storage } from '../../../firebaseConfig';
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as Device from 'expo-device';

export default function BugsScreen() {
  const { isDarkMode } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prevImages => [...prevImages, ...newImages]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection des images:', error);
      showErrorAlert('Erreur ❌', 'Impossible de sélectionner les images');
    }
  };

  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (!title || !description) {
        showErrorAlert('Erreur ❌', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Récupération des informations sur l'appareil
      const deviceInfo = {
        deviceType: Device.deviceType,
        osName: Device.osName,
        osVersion: Device.osVersion,
        brand: Device.brand,
        modelName: Device.modelName,
      };

      // Upload des images dans le storage
      let imageUrls = [];
      if (images.length > 0) {
        try {
          for (const imageUri of images) {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const filename = `bugs/${user.uid}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);
            imageUrls.push(downloadUrl);
          }
        } catch (error) {
          console.error('Erreur lors de l\'upload des images:', error);
          showErrorAlert('Erreur ❌', 'Impossible d\'uploader les images. Veuillez réessayer.');
          return;
        }
      }

      const feedbackRef = doc(db, 'feedback', 'bugs');
      const userSuccessRef = doc(db, 'users', user.uid);
      const feedbackDoc = await getDoc(feedbackRef);
      const userSuccessDoc = await getDoc(userSuccessRef);

      if (feedbackDoc.exists()) {
        await updateDoc(feedbackRef, {
          reports: arrayUnion({
            userId: user.uid,
            title,
            description,
            images: imageUrls.length > 0 ? imageUrls : null,
            timestamp: new Date(),
            status: 'new',
            deviceInfo,
          })
        });
      } else {
        await setDoc(feedbackRef, {
          reports: [{
            userId: user.uid,
            title,
            description,
            images: imageUrls.length > 0 ? imageUrls : null,
            timestamp: new Date(),
            status: 'new',
            deviceInfo,
          }]
        });
      }

      // Incrémenter le compteur de succès pour les bugs
      if (userSuccessDoc.exists()) {
        const currentSuccess = userSuccessDoc.data().success || { feedback: { bugs: 0 } };
        const currentBugsCount = currentSuccess.feedback?.bugs || 0;
        await updateDoc(userSuccessRef, {
          'success.feedback.bugs': currentBugsCount + 1
        });
      } else {
        await setDoc(userSuccessRef, {
          success: {
            feedback: {
              bugs: 1
            }
          }
        });
      }

      showSuccessAlert('Merci ! ✨', 'Votre signalement a été enregistré avec succès.');
      setTitle('');
      setDescription('');
      setImages([]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du signalement:', error);
      showErrorAlert('Erreur ❌', 'Impossible d\'envoyer votre signalement');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#000' },
          gestureEnabled: false
        }}
      />
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
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

          <ScrollView style={styles.content}>
            <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Signalement de bug
            </Text>

            <Text style={[styles.label, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Titre du bug *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: isDarkMode ? '#ffffff' : '#000000',
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
                }
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Décrivez brièvement le problème"
              placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
            />

            <Text style={[styles.label, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Description détaillée *
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
                {
                  color: isDarkMode ? '#ffffff' : '#000000',
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez le problème en détail"
              placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}
              onPress={pickImages}
            >
              <Ionicons 
                name="images-outline" 
                size={24} 
                color={isDarkMode ? '#ffffff' : '#000000'} 
              />
              <Text style={[styles.imageButtonText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {images.length > 0 ? 'Ajouter d\'autres images' : 'Ajouter des images'}
            </Text>
            </TouchableOpacity>

            {images.length > 0 && (
              <View style={styles.imagesGrid}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <Image
                      source={{ uri }}
                      style={styles.previewImage}
                      contentFit="cover"
                      transition={1000}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Envoyer le signalement</Text>
            </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
  },
  content: {
    padding: 16,
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  descriptionInput: {
    minHeight: 150,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  imagePreview: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 