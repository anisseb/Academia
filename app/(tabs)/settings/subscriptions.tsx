import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ParrainageService } from '../../services/parrainageService';

const ENTITLEMENT_ID = 'AcademIA Réussite'; // À adapter selon ton entitlement RevenueCat

export default function Subscriptions() {
  const [mode, setMode] = useState<'mois' | 'an'>('mois');
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reduction, setReduction] = useState<number>(0);
  const [availablePromotions, setAvailablePromotions] = useState<{[key: string]: any}>({});
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
        
        // Les réductions et promotions seront calculées dans le useEffect qui dépend de mode et offerings
      } catch (e) {
        showErrorAlert('Erreur ❌', "Impossible de charger les offres d'abonnement. 😕");
      } finally {
        setLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  // Mettre à jour la réduction et les promotions quand le mode change
  useEffect(() => {
    const updateReductionAndPromotions = async () => {
      const user = auth.currentUser;
      if (user && offerings) {
        const userReduction = await ParrainageService.applyBestReduction(user.uid, mode);
        setReduction(userReduction);
        
        // Recalculer les promotions disponibles selon la réduction de l'utilisateur
        const promotionsMap: {[key: string]: any} = {};
        
        if (offerings.availablePackages) {
          for (const pkg of offerings.availablePackages) {
            if (pkg.product.discounts && pkg.product.discounts.length > 0) {
              // Trouver la promotion correspondant à la réduction de l'utilisateur
              let bestPromotion = null;
              let bestMatch = 0;
              for (const discount of pkg.product.discounts) {
                // Extraire le pourcentage de réduction du nom de la promotion
                const promoMatch = discount.identifier.match(/promo(\d+)/);
                if (promoMatch) {
                  const promoPercentage = parseInt(promoMatch[1]);
                  if (promoPercentage <= userReduction && promoPercentage > bestMatch) {
                    bestMatch = promoPercentage;
                    bestPromotion = discount;
                  }
                }
              }
              
              if (bestPromotion) {
                promotionsMap[pkg.product.identifier] = {
                  originalPrice: pkg.product.priceString,
                  originalPriceValue: pkg.product.price,
                  promotionPrice: bestPromotion.priceString,
                  promotionPriceValue: bestPromotion.price,
                  promotionPercentage: bestMatch,
                  promotion: bestPromotion,
                  product: pkg.product
                };
              }
            }
          }
        }
        
        setAvailablePromotions(promotionsMap);
      }
    };
    updateReductionAndPromotions();
  }, [mode, offerings]);

  // Fonction pour calculer le prix avec réduction
  const calculatePriceWithReduction = (originalPrice: string): string => {
    if (reduction === 0) return originalPrice;
    
    // Extraire le prix numérique
    const priceMatch = originalPrice.match(/(\d+[.,]\d+)/);
    if (!priceMatch) return originalPrice;
    
    const price = parseFloat(priceMatch[1].replace(',', '.'));
    const discountedPrice = price * (1 - reduction / 100);
    
    // Formater le prix avec réduction
    const formattedPrice = discountedPrice.toFixed(2).replace('.', ',');
    return originalPrice.replace(priceMatch[1], formattedPrice);
  };

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

    // Vérifier s'il y a une promotion disponible pour ce produit
    const promotionInfo = availablePromotions[packageId];
    
    // Sélectionner le package (toujours le produit original)
    const selectedPackage = offerings.availablePackages.find((p: any) => p.product.identifier === packageId);
    
    if (!selectedPackage) {
      showErrorAlert('Erreur ❌', 'Offre non trouvée. 😕');
      return;
    }
    
    try {
      let customerInfo;
      
      // Procéder à l'achat (une seule fois)
      if (promotionInfo && promotionInfo.promotion) {
        
        // Récupérer la promotional offer
        const promotionalOffer = await Purchases.getPromotionalOffer(selectedPackage.product, promotionInfo.promotion);
        
        if (promotionalOffer) {
          // Achat avec promotion
          const { customerInfo: customerInfoResult } = await Purchases.purchaseDiscountedPackage(selectedPackage, promotionalOffer);
          customerInfo = customerInfoResult;
          
          // Consommer la réduction après achat réussi
          const user = auth.currentUser;
          if (user) {
            await ParrainageService.consumeReduction(user.uid, reduction);
            showSuccessAlert('Réduction appliquée ! 🎉', `Vous bénéficiez d'une réduction de ${promotionInfo.promotionPercentage}% sur votre abonnement !`);
          }
        } else {
          // Pas de promotional offer disponible, achat normal
          const { customerInfo: customerInfoResult } = await Purchases.purchasePackage(selectedPackage);
          customerInfo = customerInfoResult;
        }
      } else {
        // Achat normal sans promotion
        const { customerInfo: customerInfoResult } = await Purchases.purchasePackage(selectedPackage);
        customerInfo = customerInfoResult;
      }
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
      // Gestion des erreurs d'achat
      if (
        e.code === 'PurchaseCancelledError' ||
        e.code === 'USER_CANCELED' ||
        e.userCancelled === true ||
        (typeof e.message === 'string' && e.message.toLowerCase().includes('cancel'))
      ) {
        // Achat annulé par l'utilisateur : on ne fait rien
        return;
      }
      
      // Autres erreurs
      console.error('Erreur lors de l\'achat:', e);
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
        
        {/* Bouton pour accéder au parrainage */}
        {reduction === 0 && (
          <TouchableOpacity 
            style={styles.parrainageButton} 
            onPress={() => router.push('/(tabs)/settings/parrainage')}
          >
            <Text style={styles.parrainageButtonText}>
              🎁 Parrainez des amis pour obtenir des réductions !
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Message informatif pour les promotions */}
        {reduction > 0 && (
          <View style={styles.promotionInfoContainer}>
            <Text style={styles.promotionInfoText}>
              🎉 Vous avez une réduction de {reduction}%
            </Text>
          </View>
        )}
        
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
            <Text style={styles.feature}>✅ Accès aux cours de toutes les matières</Text>
            <Text style={styles.feature}>✅ 5 QCM par jours disponibles</Text>
            <Text style={styles.feature}>✅ 1 interaction IA par jour pour de l'aide au devoir personnalisée</Text>
            <Text style={styles.feature}>✅ Publicités</Text>
            <Text style={styles.feature}>❌ Pas de statistiques détaillées</Text>
          </View>
        </View>

        {/* Offre premium */}
        <View style={styles.card}>
          <View style={styles.headerPremium}>
            <MaterialCommunityIcons name="star-circle" size={32} color="#FFD700" />
            <Text style={styles.cardTitle}>Academia Réussite</Text>
            <View style={styles.pricePremium}>
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
                  
                  // Vérifier s'il y a une promotion disponible
                  const promotionInfo = availablePromotions[id];
                  if (promotionInfo && mode === 'mois') {
                    return (
                      <View style={styles.promotionPriceContainer}>
                        <Text style={styles.originalPriceStriked}>{promotionInfo.originalPrice}</Text>
                        <Text style={styles.promotionPrice}>{promotionInfo.promotionPrice} / mois</Text>
                      </View>
                    );
                  }
                  
                  if (mode === 'an') {
                    const annualPackage = offerings.availablePackages.find((p: any) => p.product.identifier === id);
                    const prixMois = annualPackage?.product.pricePerMonthString || '';
                    const prixAnnee = annualPackage?.product.pricePerYearString || '';

                    // Vérifier s'il y a une promotion disponible pour l'abonnement annuel
                    if (promotionInfo) {
                      return (
                        <View style={styles.promotionPriceContainer}>
                          <Text style={styles.originalPriceStriked}>
                            {prixMois && prixAnnee ? `${prixMois} / mois (${prixAnnee} / an)` : (prixAnnee || '163,99€ / an')}
                          </Text>
                          <Text style={styles.promotionPrice}>
                            {(promotionInfo.promotionPriceValue / 12).toFixed(2).replace('.', ',')}€ / mois ({promotionInfo.promotionPriceValue}€ / an)
                          </Text>
                        </View>
                      );
                    } else {
                      const originalPrice = prixMois && prixAnnee
                        ? `${prixMois} / mois (${prixAnnee} / an)`
                        : (prixAnnee || '163,99€ / an');
                      
                      return <Text style={styles.priceText}>{calculatePriceWithReduction(originalPrice)}</Text>;
                    }
                  } else {
                    const originalPrice = offerings.availablePackages.find((p: any) => p.product.identifier === id)?.product.priceString || '9,99€ / mois';
                    return <Text style={styles.priceText}>{calculatePriceWithReduction(originalPrice)}</Text>;
                  }
                })()
              ) : <Text style={styles.priceText}>(mode === 'mois' ? '14,99€ / mois' : '13,67€ / mois (163,99€ / an)')</Text>}
            </View>
            {reduction > 0 && (
              <Text style={styles.reductionText}>🎉 Réduction de {reduction}% appliquée !</Text>
            )}
            {mode === 'an' && (
              <Text style={styles.offerText}>🎁 2 mois offerts avec l'abonnement annuel</Text>
            )}
          </View>
          <View style={styles.features}>
            <Text style={styles.feature}>✅ Accès aux cours illimités en hors ligne</Text>
            <Text style={styles.feature}>✅ QCM illimités</Text>
            <Text style={styles.feature}>✅ Aide personnalisée avec une IA pour les devoirs</Text>
            <Text style={styles.feature}>✅ Statistiques détaillées par matière</Text>
            <Text style={styles.feature}>❌ Publicités</Text>
          </View>
          <TouchableOpacity style={styles.ctaButton} onPress={() => handlePurchase('premium')} disabled={loading}>
            <Text style={styles.ctaText}>
              Passer à Academia Réussite
            </Text>
          </TouchableOpacity>
        </View>

        {/* Offre Pack famille */}
        <View style={styles.card}>
          <View style={styles.headerFamily}>
            <MaterialCommunityIcons name="account-group" size={32} color="#FF6B6B" />
            <Text style={styles.cardTitle}>Pack Famille</Text>
            <View style={styles.priceFamily}>
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
                  
                  // Vérifier s'il y a une promotion disponible
                  const promotionInfo = availablePromotions[id];
                  if (promotionInfo && mode === 'mois') {
                    return (
                      <View style={styles.promotionPriceContainer}>
                        <Text style={styles.originalPriceStriked}>{promotionInfo.originalPrice}</Text>
                        <Text style={styles.promotionPrice}>{promotionInfo.promotionPrice} / mois</Text>
                      </View>
                    );
                  }
                  
                  if (mode === 'an') {
                    const annualPackage = offerings.availablePackages.find((p: any) => p.product.identifier === id);
                    const prixMois = annualPackage?.product.pricePerMonthString || '';
                    const prixAnnee = annualPackage?.product.pricePerYearString || '';

                    // Vérifier s'il y a une promotion disponible pour l'abonnement annuel
                    if (promotionInfo) {
                      return (
                        <View style={styles.promotionPriceContainer}>
                          <Text style={styles.originalPriceStriked}>
                            {prixMois && prixAnnee ? `${prixMois} / mois (${prixAnnee} / an)` : (prixAnnee || '329,99€ / an')}
                          </Text>
                          <Text style={styles.promotionPrice}>
                            {(promotionInfo.promotionPriceValue / 12).toFixed(2).replace('.', ',')}€ / mois ({promotionInfo.promotionPriceValue}€ / an)
                          </Text>
                        </View>
                      );
                    } else {
                      const originalPrice = prixMois && prixAnnee
                        ? `${prixMois} / mois (${prixAnnee} / an)`
                        : (prixAnnee || '329,99€ / an');
                      return <Text style={styles.priceText}>{calculatePriceWithReduction(originalPrice)}</Text>;
                    }
                  } else {
                    const originalPrice = offerings.availablePackages.find((p: any) => p.product.identifier === id)?.product.priceString || '29,99€ / mois';
                    return <Text style={styles.priceText}>{calculatePriceWithReduction(originalPrice)}</Text>;
                  }
                })()
              ) : <Text style={styles.priceText}>(mode === 'mois' ? '29,99€ / mois' : '27,50€ / mois (329,99€ / an)')</Text>}
            </View>
            {reduction > 0 && (
              <Text style={styles.reductionText}>🎉 Réduction de {reduction}% appliquée !</Text>
            )}
            {mode === 'an' && (
              <Text style={styles.offerText}>🎁 2 mois offerts avec l'abonnement annuel</Text>
            )}
          </View>
          <View style={styles.features}>
            <Text style={styles.feature}>👤👤👤 Pour toute la famille</Text>
            <Text style={styles.feature}>✅ Toutes les fonctionnalités Academia Réussite</Text>
            <Text style={styles.feature}>❌ Publicités</Text>
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
            <Text style={styles.ctaText}>
              Choisir le Pack Famille
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.restoreButton} onPress={() => router.push('/(tabs)/settings/restore-purchase')}>
            <Text style={styles.restoreText} numberOfLines={1} ellipsizeMode="tail">Restaurer un achat</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://academiaforkids.com/fr/cgu/')} style={styles.footerLink}>
            <Text style={styles.footerLinkText} numberOfLines={1} ellipsizeMode="tail">CGU</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://academiaforkids.com/fr/politique-de-confidentialite-academia/')} style={styles.footerLink}>
            <Text style={styles.footerLinkText} numberOfLines={1} ellipsizeMode="tail">Politique de confidentialité</Text>
          </TouchableOpacity>
        </View>
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
  reductionText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  parrainageButton: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  parrainageButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
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
    alignItems: 'center',
  },
  restoreText: {
    color: '#FFD700',
    fontWeight: '500',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  footerLink: {
    flexShrink: 1,
    maxWidth: 130,
  },
  footerLinkText: {
    textDecorationLine: 'underline',
    color: '#60a5fa',
    fontSize: 14,
    textAlign: 'center',
  },
  promotionInfoContainer: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
  },
  promotionInfoText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  promotionPriceContainer: {
    alignItems: 'center',
  },
  originalPriceStriked: {
    fontSize: 16,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  promotionPrice: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  promotionPercentage: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
  },
}); 