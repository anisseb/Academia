import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const ENTITLEMENT_ID = 'AcademIA Réussite'; // À adapter selon ton entitlement RevenueCat

export default function Subscriptions() {
  const [mode, setMode] = useState<'mois' | 'an'>('mois');
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    let apiKey = '';
    if (Platform.OS === 'ios') {
      apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
    } else if (Platform.OS === 'android') {
      apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';
    }
    if (apiKey) {
      Purchases.configure({ apiKey });
    }

    const fetchOfferings = async () => {
      try {
        const res = await Purchases.getOfferings();
        setOfferings(res.current);
      } catch (e) {
        showErrorAlert('Erreur ❌', "Impossible de charger les offres d'abonnement. 😕");
      } finally {
        setLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  const handlePurchase = async (type: 'premium' | 'famille') => {
    let packageId = '';

    if (Platform.OS === 'ios') {
      if (type === 'premium') {
        packageId = mode === 'mois' ? 'academia.reussite.monthly' : 'academia.reussite.years';
      } else {
        packageId = mode === 'mois' ? 'academia.famille.monthly' : 'academia.famille.years';
      }
    } else if (Platform.OS === 'android') {
      if (type === 'premium') {
        packageId = mode === 'mois'
          ? 'academia_reussite:academia-reussite-monthly'
          : 'academia_reussite:academia-reussite-years';
      } else {
        packageId = mode === 'mois'
          ? 'academia_pack_famille:academia-pack-famille-monthly'
          : 'academia_pack_famille:academia-pack-famille-years';
      }
    }

    const selectedPackage = offerings.availablePackages.find((p: any) => p.product.identifier === packageId);
    if (!selectedPackage) {
      showErrorAlert('Erreur ❌', 'Offre non trouvée. 😕');
      return;
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);

        if (customerInfo.entitlements.active[ENTITLEMENT_ID].isActive == true) {
          await updateDoc(userRef, {
            abonnement: {
              packageId,
              originalPurchaseDate: customerInfo.entitlements.active[ENTITLEMENT_ID].originalPurchaseDate,
              active: true,
            }
          });
          showSuccessAlert('Merci ! 🎉', 'Abonnement activé avec succès ! 🚀');
        } else {
          await updateDoc(userRef, {
            abonnement: {
              packageId,
              active: false,
            }
          });
          showErrorAlert('Erreur ❌', "Achat effectué mais abonnement non activé. Veuillez contacter le support. 🛠️");
        }
      } else {
        showErrorAlert('Erreur ❌', 'Utilisateur non authentifié. 🙅‍♂️');
      }
    } catch (e: any) {
      // RevenueCat : PurchaseCancelledError ou userCancelled
      if (
        e.code === 'PurchaseCancelledError' ||
        e.code === 'USER_CANCELED' ||
        e.code === 'PurchaseCancelledError' ||
        e.userCancelled === true ||
        (typeof e.message === 'string' && e.message.toLowerCase().includes('cancel'))
      ) {
        // Achat annulé par l'utilisateur : on ne fait rien
        return;
      }
      showErrorAlert('Erreur ❌', 'Achat impossible : ' + e.message + ' 😢');
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
            style={[styles.backButton, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}
            onPress={() => router.back()}
          >
            <Ionicons 
              name="close" 
              size={24} 
              color={isDarkMode ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
        </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Choisissez votre formule</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'mois' && styles.toggleActive]}
            onPress={() => setMode('mois')}
          >
            <Text style={[styles.toggleText, mode === 'mois' && styles.toggleTextActive]}>Par mois</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'an' && styles.toggleActive]}
            onPress={() => setMode('an')}
          >
            <Text style={[styles.toggleText, mode === 'an' && styles.toggleTextActive]}>Par an</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator color="#FFD700" size="large" style={{ marginVertical: 40 }} />}

        {/* Offre gratuite */}
        <View style={styles.card}>
          <View style={styles.headerFree}>
            <MaterialCommunityIcons name="school" size={32} color="#60a5fa" />
            <Text style={styles.cardTitle}>Academia Découverte</Text>
            <Text style={styles.price}>Gratuit</Text>
          </View>
          <View style={styles.features}>
            <Text style={styles.feature}>✅ Accès aux cours de toutes les matières (connexion requise)</Text>
            <Text style={styles.feature}>✅ 3 QCM par chapitre</Text>
            <Text style={styles.feature}>✅ 1 interaction IA par jour pour de l'aide au devoir personnalisé</Text>
            <Text style={styles.feature}>✅ Pub dans l'application (publicité éducative)</Text>
            <Text style={styles.feature}>❌ Pas de statistiques détaillées</Text>
            <Text style={styles.feature}>❌ Pas d'accès hors ligne</Text>
          </View>
        </View>

        {/* Offre premium */}
        <View style={styles.card}>
          <View style={styles.headerPremium}>
            <MaterialCommunityIcons name="star-circle" size={32} color="#FFD700" />
            <Text style={styles.cardTitle}>Academia Réussite</Text>
            <Text style={styles.pricePremium}>
              {offerings ? (
                (() => {
                  let id = '';
                  if (Platform.OS === 'ios') {
                    id = mode === 'mois' ? 'academia.reussite.monthly' : 'academia.reussite.years';
                  } else {
                    id = mode === 'mois'
                      ? 'academia_reussite:academia-reussite-monthly'
                      : 'academia_reussite:academia-reussite-years';
                  }
                  if (mode === 'an') {
                    const annualPackage = offerings.availablePackages.find((p: any) => p.product.identifier === id);
                    const prixMois = annualPackage?.product.priceString || '';
                    const prixAnnee = annualPackage?.product.pricePerYearString || '';

                    return prixMois && prixAnnee
                      ? `${prixMois} / mois (${prixAnnee} / an)`
                      : (prixAnnee || '163,99€ / an');
                  } else {
                    return (
                      offerings.availablePackages.find((p: any) => p.product.identifier === id)?.product.priceString ||
                      '14,99€ / mois'
                    );
                  }
                })()
              ) : (mode === 'mois' ? '14,99€ / mois' : '13,67€ / mois (163,99€ / an)')}
            </Text>
            {mode === 'an' && (
              <Text style={styles.offerText}>🎁 2 mois offerts avec l'abonnement annuel</Text>
            )}
          </View>
          <View style={styles.features}>
            <Text style={styles.feature}>✅ Accès aux cours illimités en hors ligne</Text>
            <Text style={styles.feature}>✅ QCM illimités</Text>
            <Text style={styles.feature}>✅ Aide personnalisée avec une IA pour les devoirs</Text>
            <Text style={styles.feature}>✅ Pas de publicités</Text>
            <Text style={styles.feature}>✅ Statistiques détaillées par matière</Text>
          </View>
          <TouchableOpacity style={styles.ctaButton} onPress={() => handlePurchase('premium')} disabled={loading}>
            <Text style={styles.ctaText}>Passer à Academia Réussite</Text>
          </TouchableOpacity>
        </View>

        {/* Offre Pack famille */}
        <View style={styles.card}>
          <View style={styles.headerFamily}>
            <MaterialCommunityIcons name="account-group" size={32} color="#FF6B6B" />
            <Text style={styles.cardTitle}>Pack Famille</Text>
            <Text style={styles.priceFamily}>
              {offerings ? (
                (() => {
                  let id = '';
                  if (Platform.OS === 'ios') {
                    id = mode === 'mois' ? 'academia.famille.monthly' : 'academia.famille.years';
                  } else {
                    id = mode === 'mois'
                      ? 'academia_pack_famille:academia-pack-famille-monthly'
                      : 'academia_pack_famille:academia-pack-famille-years';
                  }
                  if (mode === 'an') {
                    const annualPackage = offerings.availablePackages.find((p: any) => p.product.identifier === id);
                    const prixMois = annualPackage?.product.priceString || '';
                    const prixAnnee = annualPackage?.product.pricePerYearString || '';
                    return prixMois && prixAnnee
                      ? `${prixMois} / mois (${prixAnnee} / an)`
                      : (prixAnnee || '329,99€ / an');
                  } else {
                    return (
                      offerings.availablePackages.find((p: any) => p.product.identifier === id)?.product.priceString ||
                      '29,99€ / mois'
                    );
                  }
                })()
              ) : (mode === 'mois' ? '29,99€ / mois' : '27,50€ / mois (329,99€ / an)')}
            </Text>
            {mode === 'an' && (
              <Text style={styles.offerText}>🎁 2 mois offerts avec l'abonnement annuel</Text>
            )}
          </View>
          <View style={styles.features}>
            <Text style={styles.feature}>👤👤👤 Pour toute la famille</Text>
            <Text style={styles.feature}>✅ Toutes les fonctionnalités Academia Réussite</Text>
            {Platform.OS === 'android' && (
              <Text style={[styles.feature, styles.familyNote]}>
                ℹ️ Sur Android, vous pouvez partager cet abonnement avec jusqu'à 5 membres de votre famille via Google Play Family Library
              </Text>
            )}
            {Platform.OS === 'ios' && (
              <Text style={[styles.feature, styles.familyNote]}>
                ℹ️ Sur iOS, vous pouvez partager cet abonnement avec jusqu'à 5 membres de votre famille via Apple Family Sharing
              </Text>
            )}
          </View>
          <TouchableOpacity style={[styles.ctaButton, styles.familyButton]} onPress={() => handlePurchase('famille')} disabled={loading}>
            <Text style={styles.ctaText}>Choisir le Pack Famille</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.restoreButton} onPress={() => router.push('/(tabs)/settings/restore-purchase')}>
          <Text style={styles.restoreText}>Restaurer un achat</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    padding: 24,
    backgroundColor: '#0f172a',
    flexGrow: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  toggleActive: {
    backgroundColor: '#60a5fa',
  },
  toggleText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 16,
  },
  toggleTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerFree: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerPremium: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerFamily: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    color: '#60a5fa',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pricePremium: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceFamily: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  features: {
    marginTop: 8,
    width: '100%',
  },
  feature: {
    color: '#cbd5e1',
    marginBottom: 10,
    flexWrap: 'wrap',
    flexShrink: 1,
    fontSize: 16,
    
  },
  ctaButton: {
    marginTop: 18,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  familyButton: {
    backgroundColor: '#FF6B6B',
  },
  offerText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    right: 10,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
  },
  familyNote: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 8,
  },
  restoreButton: {
    marginTop: 0,
    paddingBottom: 10,
    alignItems: 'center',
  },
  restoreText: {
    color: '#FFD700',
    fontWeight: '500',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
}); 