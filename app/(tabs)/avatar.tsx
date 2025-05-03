import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';

export default function AvatarScreen() {
  const { isDarkMode } = useTheme();

  const player = useVideoPlayer(require('../../assets/videos/animated_avatar.mp4'), player => {
    player.loop = true;
    player.play();
  });

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
});