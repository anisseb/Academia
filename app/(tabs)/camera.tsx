import React from 'react';
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon, Camera as FlipCamera } from 'lucide-react-native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef(null);
  const router = useRouter();

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

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    console.log('Button pressed - attempting to take picture');
    if (!cameraRef.current) {
      console.log('Camera ref is null');
      return;
    }
    try {
      const photo = await (cameraRef.current as any).takePictureAsync();
      console.log('photo', photo);

      setPhoto(photo.uri);
    } catch (error) {
      console.error('Failed to take picture:', error);
    }
  };

  const processImage = async () => {
    if (!photo) return;
    
    try {
      console.log('photo', photo);
      // Here we would normally send the image to Google Cloud Vision API
      // and then send the extracted text to Mistral API
      // For now, we'll just navigate to the results screen
      router.push({
        pathname: '/results',
        params: { photo }
      });
    } catch (error) {
      console.error('Failed to process image:', error);
    }
  };

  return (
    <View style={styles.container}>
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
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.useButton]}
              onPress={processImage}
            >
              <Text style={styles.buttonText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
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
});