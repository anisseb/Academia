import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const ENTITLEMENT_ID = 'AcademIA Réussite';

export default function RestorePurchase() {
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();

  const handleRestore = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showErrorAlert('Erreur ❌', 'Vous devez être connecté pour restaurer vos achats.');
        return;
      }

      // Restaurer les achats avec RevenueCat
      const customerInfo = await Purchases.restorePurchases();
      
      // Vérifier si l'utilisateur a un abonnement actif
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive) {
        const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
        const userRef = doc(db, 'users', user.uid);

        // Mettre à jour les informations d'abonnement dans Firestore
        await updateDoc(userRef, {
          abonnement: {
            packageId: entitlement.productIdentifier,
            originalPurchaseDate: entitlement.originalPurchaseDate,
            active: true,
          }
        });

        showSuccessAlert('Succès ! 🎉', 'Votre abonnement a été restauré avec succès !');
        router.back();
      } else {
        showErrorAlert('Information ℹ️', 'Aucun abonnement actif trouvé à restaurer.');
      }
    } catch (error: any) {
      showErrorAlert('Erreur ❌', 'Impossible de restaurer les achats : ' + error.message);
    } finally {
      setLoading(false);
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
      <View style={{ top: insets.top }}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}
          onPress={() => router.back()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDarkMode ? '#ffffff' : '#000000'} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Restaurer mes achats</Text>
        <Text style={styles.description}>
          Restaurez vos achats précédents pour retrouver l'accès à vos fonctionnalités premium.
          {Platform.OS === 'ios' ? ' Cette fonctionnalité est particulièrement utile si vous avez changé d\'appareil ou réinstallé l\'application.' : ''}
        </Text>

        <TouchableOpacity 
          style={styles.restoreButton} 
          onPress={handleRestore}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1e293b" />
          ) : (
            <Text style={styles.restoreButtonText}>Restaurer mes achats</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          ℹ️ Si vous avez acheté un abonnement sur un autre appareil ou compte, 
          assurez-vous d'être connecté avec le même compte {Platform.OS === 'ios' ? 'Apple' : 'Google'}.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  restoreButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  note: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
