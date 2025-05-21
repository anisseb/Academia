import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const VIDEO_KEY = '@avatar_video';
const VIDEO_URI = 'file:///avatar_video.mp4';

export default function AvatarScreen() {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier la connexion internet
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    loadVideo();
    return () => unsubscribe();
  }, []);

  const loadVideo = async () => {
    try {
      setIsLoading(true);
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected;

      if (!isConnected) {
        // En mode hors ligne, charger depuis le stockage local
        const savedVideoUri = await AsyncStorage.getItem(VIDEO_KEY);
        if (savedVideoUri) {
          setVideoUri(savedVideoUri);
        }
      } else {
        // En mode en ligne, sauvegarder la vidéo localement
        const fileUri = FileSystem.documentDirectory + 'avatar_video.mp4';
        
        // Vérifier si la vidéo existe déjà localement
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        if (!fileInfo.exists) {
          // Si la vidéo n'existe pas, la télécharger depuis les assets
          const asset = Asset.fromModule(require('../../assets/videos/animated_avatar.mp4'));
          await asset.downloadAsync();
          
          if (asset.localUri) {
            await FileSystem.copyAsync({
              from: asset.localUri,
              to: fileUri
            });
          }
        }

        // Sauvegarder l'URI dans AsyncStorage
        await AsyncStorage.setItem(VIDEO_KEY, fileUri);
        setVideoUri(fileUri);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la vidéo:', error);
      // En cas d'erreur, utiliser directement la vidéo des assets
      setVideoUri(null);
    } finally {
      setIsLoading(false);
    }
  };

  const player = useVideoPlayer(videoUri || require('../../assets/videos/animated_avatar.mp4'), player => {
    player.loop = true;
    player.play();
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        allowsFullscreen
        allowsPictureInPicture
      />
      <View style={styles.overlay}>
        <View style={styles.textContainer}>
          <Text style={[styles.text, { color: isDarkMode ? '#fff' : '#000' }]}>
            Avatar à venir bientôt
          </Text>
          <Feather name="smile" size={24} color={isDarkMode ? '#fff' : '#000'} />
        </View>
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Feather name="wifi-off" size={20} color="#fff" />
            <Text style={styles.offlineText}>Mode hors ligne</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 100,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 10,
    gap: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  offlineBanner: {
    position: 'absolute',
    top: 20,
    backgroundColor: '#f59e0b',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
  },
  offlineText: {
    color: '#fff',
    fontWeight: '500',
  },
});