import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera as CameraIcon, Camera as FlipCamera, ArrowLeft } from 'lucide-react-native';
import { storage, db } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef(null);
  const { threadId } = useLocalSearchParams();
  

  useEffect(() => {
  }, [threadId]);

  const processImage = async () => {
    if (!photo) return;
    
    try {
      if (!threadId) {
        console.error('No threadId found in camera screen');
        alert('Erreur: Impossible d\'ajouter la photo. Veuillez réessayer.');
        return;
      }

      // Convertir l'image en base64
      const response = await fetch(photo);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Réinitialiser la photo avant la redirection
      setPhoto(null);

      router.push({
        pathname: '/(tabs)/history',
        params: { 
          threadId: threadId as string,
          imageBase64: base64 as string
        }
      });
    } catch (error) {
      console.error('Failed to process image:', error);
      alert('Erreur lors du traitement de l\'image. Veuillez réessayer.');
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) {
      return;
    }
    try {
      const photo = await (cameraRef.current as any).takePictureAsync();

      setPhoto(photo.uri);
    } catch (error) {
      console.error('Failed to take picture:', error);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          presentation: 'fullScreenModal'
        }} 
      />
      <SafeAreaView style={styles.container}>
        {!photo && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push({
              pathname: '/(tabs)/history',
              params: { threadId: threadId as string }
            })}
          >
            <ArrowLeft color="white" size={32} />
          </TouchableOpacity>
        )}
        {!photo ? (
          <View style={styles.container}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.captureButton} 
                  onPress={takePicture}
                  activeOpacity={0.7}
                >
                  <CameraIcon color="white" size={32} />
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photo }} style={styles.preview} />
            <View style={styles.previewButtons}>
              <TouchableOpacity
                style={[styles.button, styles.retakeButton]}
                onPress={() => setPhoto(null)}
              >
                <Text style={styles.buttonText}>Reprendre</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.useButton]}
                onPress={processImage}
              >
                <Text style={styles.buttonText}>Utiliser</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
  },
  flipButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    position: 'absolute',
    bottom: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#60a5fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
  },
  preview: {
    flex: 1,
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  retakeButton: {
    backgroundColor: '#ef4444',
    flex: 1,
    marginRight: 10,
  },
  useButton: {
    flex: 1,
    marginLeft: 10,
  },
  backButton: {
    position: 'absolute',
    top: 70,
    left: 20,
    zIndex: 1,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});