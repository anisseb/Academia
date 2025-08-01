import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import * as SplashScreen from 'expo-splash-screen';
import { updateSubscriptionStatus } from './utils/subscriptionUtils';

// Empêche le splash de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        await SplashScreen.hideAsync();
        router.replace('/auth');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        if (!userData?.profile?.onboardingCompleted) {
          await SplashScreen.hideAsync();
          router.replace('/onboarding');
        } else {
          // Vérifier et mettre à jour le statut d'abonnement si nécessaire
          if (userData.abonnement) {
            await updateSubscriptionStatus(user.uid, userData.abonnement);
          }
          
          await SplashScreen.hideAsync();
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'onboarding:", error);
        await SplashScreen.hideAsync();
        router.replace('/auth');
      } finally {
        setIsLoading(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // On ne retourne rien tant que le splash est affiché
  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text>Chargement...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});