import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { configureNotifications } from '../utils/notifications';
import { Ionicons } from '@expo/vector-icons';

interface Step6bProps {
  onNext: (data: { notificationsEnabled: boolean }) => void;
  onBack: () => void;
}

export default function Step6b({ onNext, onBack }: Step6bProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const startBellAnimation = () => {
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 0.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: -0.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: -0.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleToggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    if (newValue) {
      startBellAnimation();
    }
  };

  const handleNext = async () => {
    if (notificationsEnabled) {
      await configureNotifications();
    }
    onNext({ notificationsEnabled });
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ rotate }] }]}>
          <Ionicons name="notifications" size={100} color="#60a5fa" />
        </Animated.View>
        <Text style={styles.title}>Activer les notifications</Text>
        <Text style={styles.description}>
          Restez informé des nouvelles demandes d'amis, du nouveau contenu et mises à jour importantes.
        </Text>

        <TouchableOpacity
          style={[styles.button, notificationsEnabled && styles.buttonActive]}
          onPress={handleToggleNotifications}
        >
          <View style={styles.buttonContent}>
            <Text style={[styles.buttonText, notificationsEnabled && styles.buttonTextActive]}>
              {notificationsEnabled ? 'Notifications activées' : 'Activer les notifications'}
            </Text>
            {notificationsEnabled && (
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.checkIcon} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>Continuer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 200,
    height: 200,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
  },
  buttonActive: {
    backgroundColor: '#60a5fa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextActive: {
    color: '#fff',
  },
  nextButton: {
    backgroundColor: '#60a5fa',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    marginLeft: 8,
  },
}); 