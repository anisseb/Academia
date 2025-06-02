import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as InAppPurchases from 'expo-in-app-purchases';

const PRIX_MENSUEL = 16;
const PRIX_ANNUEL = 192;
const PRIX_FAMILLE = 24;

// Identifiants Apple
const PRODUCT_IDS = {
  premium: {
    mois: 'academia.reussite.monthly',
    an: 'academia.reussite.years',
  },
  famille: {
    mois: 'academia.famille.monthly',
    an: 'academia.famille.years',
  },
};

export default function Subscriptions() {
  const [mode, setMode] = useState<'mois' | 'an'>('mois');

  useEffect(() => {
    InAppPurchases.connectAsync();
    InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        if (results) {
          results.forEach(async (purchase) => {
            if (!purchase.acknowledged) {
              Alert.alert('Merci !', 'Achat réussi.');
              await InAppPurchases.finishTransactionAsync(purchase, false);
            }
          });
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        Alert.alert('Achat annulé');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de l’achat.');
      }
    });
    return () => {
      InAppPurchases.disconnectAsync();
    };
  }, []);

  const handlePurchase = async (type: 'premium' | 'famille') => {
    const productId = PRODUCT_IDS[type][mode];
    try {
      await InAppPurchases.purchaseItemAsync(productId);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de lancer l’achat.');
    }
  };

  return (
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
            {mode === 'mois' ? '14,99€ / mois' : '163,99€ / an'}
          </Text>
        </View>
        <View style={styles.features}>
          <Text style={styles.feature}>✅ Accès aux cours illimités en hors ligne</Text>
          <Text style={styles.feature}>✅ QCM illimités</Text>
          <Text style={styles.feature}>✅ Aide personnalisée avec une IA pour les devoirs</Text>
          <Text style={styles.feature}>✅ Pas de publicités</Text>
          <Text style={styles.feature}>✅ Statistiques détaillées par matière</Text>
        </View>
        <TouchableOpacity style={styles.ctaButton} onPress={() => handlePurchase('premium')}>
          <Text style={styles.ctaText}>Passer à Academia Réussite</Text>
        </TouchableOpacity>
      </View>

      {/* Offre Pack famille */}
      <View style={styles.card}>
        <View style={styles.headerFamily}>
          <MaterialCommunityIcons name="account-group" size={32} color="#FF6B6B" />
          <Text style={styles.cardTitle}>Pack Famille</Text>
          <Text style={styles.priceFamily}>
            {mode === 'mois' ? '29,99€ / mois' : '329,99€ / an'}
          </Text>
        </View>
        <View style={styles.features}>
          <Text style={styles.feature}>👤👤👤 3 profils (idéal pour les fratries)</Text>
          <Text style={styles.feature}>✅ Toutes les fonctionnalités Academia Réussite</Text>
        </View>
        <TouchableOpacity style={[styles.ctaButton, styles.familyButton]} onPress={() => handlePurchase('famille')}>
          <Text style={styles.ctaText}>Choisir le Pack Famille</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  feature: {
    color: '#cbd5e1',
    fontSize: 15,
    marginBottom: 6,
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
}); 