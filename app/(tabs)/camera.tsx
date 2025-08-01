import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, StatusBar, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Camera as CameraIcon, ArrowLeft, Crop, Check, X, Zap } from 'lucide-react-native';
import { showErrorAlert } from '../utils/alerts';
import * as ImagePicker from 'expo-image-picker';
import { useImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ResizableFrame } from '../components/ResizableFrame';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const FRAME_PADDING = 40;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FRAME_WIDTH = SCREEN_WIDTH - (FRAME_PADDING * 2);
const FRAME_HEIGHT = FRAME_WIDTH * (4/3); // Ratio 4:3

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isReady, setIsReady] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const cameraRef = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cropFrame, setCropFrame] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const { threadId } = useLocalSearchParams();
  const statusBarHeight = StatusBar.currentHeight || 0;
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isManipulatorReady, setIsManipulatorReady] = useState(false);
  const manipulator = useImageManipulator(imageToCrop || '');

  useEffect(() => {
    (async () => {
      const { status } = await requestPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Effet pour gérer l'initialisation du manipulator
  useEffect(() => {
    if (imageToCrop) {
      setIsManipulatorReady(false);
      const timer = setTimeout(() => {
        setIsManipulatorReady(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [imageToCrop]);

  const onCameraReady = () => {
    setIsReady(true);
  };
  
  const processImage = async () => {
    if (!photo) return;
    
    try {
      if (!threadId) {
        console.error('No threadId found in camera screen');
        showErrorAlert('Erreur', 'Impossible d\'ajouter la photo. Veuillez réessayer.');
        return;
      }

      let finalImageUri = photo;
      if (cropFrame) {
        finalImageUri = previewUri || photo;
      }

      // D'abord nettoyer l'état
      setPhoto(null);
      setCropFrame(null);
      setIsCropping(false);
      setPreviewUri(null);
      setImageToCrop(null);

      // Puis fermer la modal
      router.back();

      // Enfin naviguer vers history
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)/history',
          params: { 
            threadId: threadId as string,
            imageUri: finalImageUri
          }
        });
      }, 100);
    } catch (error) {
      console.error('Failed to process image:', error);
      showErrorAlert('Erreur', 'Erreur lors du traitement de l\'image. Veuillez réessayer.');
    }
  };

  const handleCrop = async () => {
    if (!photo || !cropFrame || !isManipulatorReady) return;

    try {
      // Obtenir les dimensions de l'image originale
      const imageInfo = await Image.getSize(photo);
      const originalWidth = imageInfo.width;
      const originalHeight = imageInfo.height;

      // Calculer les dimensions de l'image affichée
      const imageAspectRatio = originalWidth / originalHeight;
      let displayWidth = SCREEN_WIDTH;
      let displayHeight = SCREEN_WIDTH / imageAspectRatio;

      // Si l'image est plus haute que l'écran, ajuster la hauteur
      if (displayHeight > SCREEN_HEIGHT) {
        displayHeight = SCREEN_HEIGHT;
        displayWidth = SCREEN_HEIGHT * imageAspectRatio;
      }

      // Calculer les marges pour centrer l'image
      const marginX = (SCREEN_WIDTH - displayWidth) / 2;
      const marginY = (SCREEN_HEIGHT - displayHeight) / 2;

      // Calculer les ratios pour convertir les coordonnées de l'écran en coordonnées de l'image
      const widthRatio = originalWidth / displayWidth;
      const heightRatio = originalHeight / displayHeight;

      // Convertir les coordonnées de l'écran en coordonnées de l'image
      const cropX = Math.round((cropFrame.x - marginX) * widthRatio);
      const cropY = Math.round((cropFrame.y - marginY) * heightRatio);
      const cropWidth = Math.round(cropFrame.width * widthRatio);
      const cropHeight = Math.round(cropFrame.height * heightRatio);

      // Vérifier que les coordonnées sont valides
      if (cropX < 0 || cropY < 0 || 
          cropX + cropWidth > originalWidth || 
          cropY + cropHeight > originalHeight) {
        console.error('Coordonnées de recadrage invalides:', {
          cropX, cropY, cropWidth, cropHeight,
          originalWidth, originalHeight,
          displayWidth, displayHeight,
          marginX, marginY
        });
        return;
      }

      // Appliquer le recadrage
      manipulator.crop({
        originX: cropX,
        originY: cropY,
        width: cropWidth,
        height: cropHeight
      });

      // Rendre et sauvegarder l'image
      const result = await manipulator.renderAsync();
      const savedImage = await result.saveAsync({ format: SaveFormat.JPEG, compress: 1 });
      
      // Mettre à jour l'état
      setPreviewUri(savedImage.uri);
      setIsCropping(false);
      setImageToCrop(null);
      setIsManipulatorReady(false);
    } catch (error) {
      console.error('Erreur lors du recadrage:', error);
      showErrorAlert('Erreur', 'Erreur lors du recadrage de l\'image. Veuillez réessayer.');
    }
  };

  const startCropping = () => {
    if (!photo) return;
    setImageToCrop(photo);
    setIsCropping(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
        exif: false
      });

      if (photo) {
        setPhoto(photo.uri);
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      showErrorAlert('Erreur', 'Erreur lors de la prise de photo. Veuillez réessayer.');
    }
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off':
          return 'on';
        case 'on':
          return 'auto';
        case 'auto':
          return 'off';
        default:
          return 'off';
  }
    });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.text}>Demande de permission en cours...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.text}>Pas d'accès à la caméra</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
          contentStyle: { backgroundColor: '#000' },
          gestureEnabled: false
        }} 
      />
      <View style={[styles.fullScreenContainer]}>
        <StatusBar barStyle="light-content" />
        {!photo ? (
        <>
          <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
              onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={32} />
          </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.flashButton,
                flashMode === 'off' && styles.flashOffButton,
                flashMode === 'on' && styles.flashOnButton,
                flashMode === 'auto' && styles.flashAutoButton
              ]}
              onPress={toggleFlash}
            >
              {flashMode === 'off' && <Zap color="white" size={24} />}
              {flashMode === 'on' && <Zap color="#ffd700" size={24} fill="#ffd700" />}
              {flashMode === 'auto' && <Zap color="#60a5fa" size={24} />}
            </TouchableOpacity>
          </View>
          <View style={styles.cameraContainer}>
            <CameraView 
              style={styles.camera}
              facing={facing}
              ref={cameraRef}
              onCameraReady={onCameraReady}
              flash={flashMode}
            >
              {isReady && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.captureButton} 
                  onPress={takePicture}
                  activeOpacity={0.7}
                >
                  <CameraIcon color="white" size={32} />
                </TouchableOpacity>
              </View>
              )}
            </CameraView>
          </View>
          </>
        ) : (
          <View style={styles.previewContainer}>
            <View style={styles.previewImageContainer}>
              <Image 
                source={{ uri: previewUri || photo }} 
                style={[styles.preview, { marginTop: insets.top, marginBottom: insets.bottom }]}
                resizeMode="cover"
              />
              {isCropping && (
                <ResizableFrame 
                  onFrameChange={setCropFrame}
                  initialFrame={{
                    x: (SCREEN_WIDTH - 300) / 2,
                    y: (SCREEN_HEIGHT - 300) / 2,
                    width: 300,
                    height: 300,
                  }}
                />
              )}
            </View>

            <View style={[styles.previewHeader, { top: insets.top }]}>
              <View style={styles.headerContent}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <ArrowLeft color="white" size={32} />
                </TouchableOpacity>
                {!isCropping ? (
                  <TouchableOpacity
                    style={[styles.button, styles.cropButton]}
                    onPress={startCropping}
                  >
                    <Crop color="white" size={24} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.cropActions}>
                    <TouchableOpacity
                      style={[styles.button, styles.cropButton]}
                      onPress={() => setIsCropping(false)}
                    >
                      <X color="white" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.cropButton]}
                      onPress={handleCrop}
                    >
                      <Check color="white" size={24} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {!isCropping && (
              <View style={[styles.previewFooter, { bottom: insets.bottom }]}>
              <TouchableOpacity
                style={[styles.button, styles.retakeButton]}
                  onPress={() => {
                    setPhoto(null);
                    setCropFrame(null);
                    setIsCropping(false);
                    setPreviewUri(null);
                  }}
              >
                <MaterialCommunityIcons name="camera-retake" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.useButton]}
                onPress={processImage}
              >
                <MaterialCommunityIcons name="check" size={24} color="white" />
              </TouchableOpacity>
            </View>
            )}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  messageContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 30,
    zIndex: 1,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
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
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewImageContainer: {
    flex: 1,
    position: 'relative',
    marginTop: 80,
    marginBottom: 100,
  },
  preview: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewHeader: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 80,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: '100%',
  },
  previewFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  retakeButton: {
    backgroundColor: '#ef4444',
    flex: 1,
    marginRight: 10,
  },
  useButton: {
    backgroundColor: 'rgba(24, 198, 35, 0.8)',
    flex: 1,
    marginLeft: 10,
  },
  cropButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 0,
    marginHorizontal: 10,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cancelCropButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    right: 0,
    zIndex: 1,
  },
  cropActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    zIndex: 1,
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashOffButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  flashOnButton: {
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  flashAutoButton: {
    backgroundColor: 'rgba(96,165,250,0.2)',
  },
});