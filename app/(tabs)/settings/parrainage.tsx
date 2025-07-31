import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { showAlert, showSuccessAlert } from '../../utils/alerts';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ParrainageService } from '../../services/parrainageService';

interface ParrainageData {
  codeParrain: string;
  parrains: string[];
  parrainages: number;
  pointsParrainage: number;
  reductions: {
    active: boolean;
    pourcentage: number;
    type: 'mois' | 'an';
    reason?: string;
  }[];
}

export default function ParrainageScreen() {
  const { isDarkMode } = useTheme();
  const [parrainageData, setParrainageData] = useState<ParrainageData | null>(null);
  const [codeParrainInput, setCodeParrainInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadParrainageData();
  }, []);

  const loadParrainageData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/auth');
        return;
      }

      
      // Initialiser ou récupérer le code de parrainage
      const codeParrain = await ParrainageService.initializeOrGetCode(user.uid);
      
      const parrainageDoc = await getDoc(doc(db, 'parrainage', user.uid));
      if (parrainageDoc.exists()) {
        const parrainageData = parrainageDoc.data();
        const parrainage = {
          codeParrain: codeParrain,
          parrains: parrainageData.parrainId ? [parrainageData.parrainId] : [],
          parrainages: parrainageData.parrainages || 0,
          pointsParrainage: parrainageData.pointsParrainage || 0,
          recompenses: parrainageData.recompenses || [],
          reductions: parrainageData.reductions || []
        };
        setParrainageData(parrainage);
      } else {
        const newParrainageData = {
          codeParrain: codeParrain,
          parrains: [],
          parrainages: 0,
          pointsParrainage: 0,
          recompenses: [],
          reductions: []
        };
        setParrainageData(newParrainageData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de parrainage:', error);
      showAlert('Erreur', 'Impossible de charger les données de parrainage');
    } finally {
      setIsLoading(false);
    }
  };



  const handleUtiliserCode = async () => {
    if (!codeParrainInput.trim()) {
      showAlert('Erreur', 'Veuillez entrer un code d\'affiliation');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Vérifier que l'utilisateur n'utilise pas son propre code
      if (codeParrainInput.toUpperCase() === parrainageData?.codeParrain) {
        showAlert('Erreur', 'Vous ne pouvez pas utiliser votre propre code de parrainage');
        return;
      }

      // Suppression de la vérification - un utilisateur peut avoir plusieurs parrainages

      // Utiliser le service de parrainage pour trouver l'utilisateur par son code
      const parrainId = await ParrainageService.findUserByCode(codeParrainInput.toUpperCase());
      
      if (!parrainId) {
        showAlert('Erreur', 'Code de parrainage invalide');
        return;
      }

      // Vérifier que l'utilisateur ne parraine pas lui-même
      if (parrainId === user.uid) {
        showAlert('Erreur', 'Vous ne pouvez pas utiliser votre propre code de parrainage');
        return;
      }

      // Établir la relation de parrainage
      const success = await ParrainageService.establishParrainage(parrainId, user.uid);
      
      if (success) {
        showSuccessAlert('Succès', 'Code d\'affiliation utilisé avec succès ! Vous avez gagné 50 points et une réduction de 20% sur l\'abonnement mensuel !');
        setCodeParrainInput('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Recharger les données de parrainage
        await loadParrainageData();
      }
      // Suppression du else car les erreurs sont gérées dans le catch
    } catch (error: any) {
      if (error.message && error.message.includes('affiliation mutuelle')) {
        showAlert('Affiliation Mutuelle', 'Vous ne pouvez pas utiliser ce code car une affiliation mutuelle existe déjà entre vous et cet utilisateur. Vous avez déjà échangé vos codes d\'affiliation !');
      } else if (error.message && error.message.includes('code affiliation déjà utilisé')) {
        showAlert('Code Déjà Utilisé', 'Vous avez déjà utilisé le code d\'affiliation de cet utilisateur. Chaque code ne peut être utilisé qu\'une seule fois !');
      } else {
        showAlert('Erreur', 'Impossible d\'utiliser ce code d\'affiliation');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePartagerCode = async () => {
    try {
      const message = `🎓 Rejoins Academia avec mon code de parrainage : ${parrainageData?.codeParrain}\n\n📚 Améliore tes résultats scolaires avec l'IA !\n\n✨ Utilise mon code pour obtenir des bonus exclusifs !`;
      
      await Share.share({
        message,
        title: 'Rejoins Academia avec mon code de parrainage !'
      });
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const handleCopierCode = async () => {
    try {
      await Clipboard.setStringAsync(parrainageData?.codeParrain || '');
      showSuccessAlert('Code copié', 'Le code de parrainage a été copié dans le presse-papiers');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Système de Parrainage
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Chargement...
          </Text>
        </View>
      </View>
    );
  }

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
      <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Système de Parrainage
          </Text>
        </View>

        {/* Section Code Personnel */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Mon Code de Parrainage
          </Text>
          
          <View style={[styles.codeContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
            <Text style={[styles.codeText, { color: isDarkMode ? '#60a5fa' : '#3b82f6' }]}>
              {parrainageData?.codeParrain}
            </Text>
            <TouchableOpacity onPress={handleCopierCode} style={styles.copyButton}>
              <Ionicons name="copy-outline" size={20} color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handlePartagerCode} style={[styles.shareButton, { backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }]}>
              <Ionicons name="share-outline" size={20} color="#ffffff" />
              <Text style={styles.shareButtonText}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Utiliser un Code */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Utiliser un Code de Parrainage
          </Text>
          
          <Text style={[styles.description, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
            Entrez le code de parrainage d'un ami pour obtenir des bonus exclusifs !
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                color: isDarkMode ? '#ffffff' : '#000000',
                borderColor: isDarkMode ? '#333333' : '#e0e0e0'
              }]}
              placeholder="Code de parrainage"
              placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
              value={codeParrainInput}
              onChangeText={setCodeParrainInput}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity 
              onPress={handleUtiliserCode} 
              style={[styles.useButton, { backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }]}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.useButtonText}>Utiliser</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Statistiques */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Mes Statistiques
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={[styles.statItem, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
              <Ionicons name="people-outline" size={24} color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
              <Text style={[styles.statNumber, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {parrainageData?.parrainages || 0}
              </Text>
                              <Text style={[styles.statLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                  Affiliations
                </Text>
            </View>
            
            <View style={[styles.statItem, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
              <Ionicons name="star-outline" size={24} color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
              <Text style={[styles.statNumber, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {parrainageData?.pointsParrainage || 0}
              </Text>
              <Text style={[styles.statLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                Points
              </Text>
            </View>
          </View>
        </View>

        {/* Section Réductions d'Abonnement */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Réductions d'Abonnement
          </Text>
          
          <Text style={[styles.description, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
            Parrainez des amis pour obtenir des réductions exclusives sur vos abonnements !
          </Text>
          
          <View style={[styles.parrainageInfoContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
            <Ionicons name="people" size={24} color="#10b981" />
            <View style={styles.parrainageInfoContent}>
                              <Text style={[styles.parrainageInfoTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  Système d'Affiliation Équitable
                </Text>
                <View style={styles.parrainageInfoList}>
                  <View style={styles.parrainageInfoListItem}>
                    <Text style={[styles.parrainageInfoBullet, { color: isDarkMode ? '#10b981' : '#10b981' }]}>•</Text>
                    <Text style={[styles.parrainageInfoDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                      +50 points pour chaque affiliation
                    </Text>
                  </View>
                  <View style={styles.parrainageInfoListItem}>
                    <Text style={[styles.parrainageInfoBullet, { color: isDarkMode ? '#10b981' : '#10b981' }]}>•</Text>
                    <Text style={[styles.parrainageInfoDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                      +1 affiliation comptabilisée
                    </Text>
                  </View>
                  <View style={styles.parrainageInfoListItem}>
                    <Text style={[styles.parrainageInfoBullet, { color: isDarkMode ? '#10b981' : '#10b981' }]}>•</Text>
                    <Text style={[styles.parrainageInfoDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                      -15% pendant sur l'abonnement mensuel
                    </Text>
                  </View>
                </View>
            </View>
          </View>

          <View style={styles.reductionsContainer}>
            <View style={[styles.reductionItem, { 
              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
              borderColor: (parrainageData?.parrainages || 0) >= 1 ? '#10b981' : '#e0e0e0',
              borderWidth: 2
            }]}>
              <Ionicons name="pricetag-outline" size={24} color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
              <View style={styles.reductionContent}>
                <Text style={[styles.reductionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  Réduction Standard
                </Text>
                               <Text style={[styles.reductionDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                 -20% sur l'abonnement mensuel
               </Text>
              </View>
              <View style={[styles.reductionStatus, { 
                backgroundColor: (parrainageData?.parrainages || 0) >= 1 ? '#10b981' : '#6b7280'
              }]}>
                <Ionicons 
                  name={(parrainageData?.parrainages || 0) >= 1 ? "checkmark" : "time"} 
                  size={16} 
                  color="#ffffff" 
                />
              </View>
            </View>

            <View style={[styles.reductionItem, { 
              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
              borderColor: (parrainageData?.parrainages || 0) >= 5 ? '#10b981' : '#e0e0e0',
              borderWidth: 2
            }]}>
              <Ionicons name="trophy-outline" size={24} color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
              <View style={styles.reductionContent}>
                <Text style={[styles.reductionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  5 Affiliations
                </Text>
                               <Text style={[styles.reductionDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                 -30% sur l'abonnement mensuel
               </Text>
              </View>
              <View style={[styles.reductionStatus, { 
                backgroundColor: (parrainageData?.parrainages || 0) >= 5 ? '#10b981' : '#6b7280'
              }]}>
                <Ionicons 
                  name={(parrainageData?.parrainages || 0) >= 5 ? "checkmark" : "time"} 
                  size={16} 
                  color="#ffffff" 
                />
              </View>
            </View>

            <View style={[styles.reductionItem, { 
              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
              borderColor: (parrainageData?.parrainages || 0) >= 10 ? '#10b981' : '#e0e0e0',
              borderWidth: 2
            }]}>
              <Ionicons name="diamond-outline" size={24} color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
              <View style={styles.reductionContent}>
                <Text style={[styles.reductionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  10 Affiliations
                </Text>
                               <Text style={[styles.reductionDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                 -40% sur l'abonnement mensuel
               </Text>
              </View>
              <View style={[styles.reductionStatus, { 
                backgroundColor: (parrainageData?.parrainages || 0) >= 10 ? '#10b981' : '#6b7280'
              }]}>
                <Ionicons 
                  name={(parrainageData?.parrainages || 0) >= 10 ? "checkmark" : "time"} 
                  size={16} 
                  color="#ffffff" 
                />
              </View>
            </View>

            <View style={[styles.reductionItem, { 
              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
              borderColor: (parrainageData?.parrainages || 0) >= 20 ? '#10b981' : '#e0e0e0',
              borderWidth: 2
            }]}>
              <Ionicons name="star-outline" size={24} color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
              <View style={styles.reductionContent}>
                <Text style={[styles.reductionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  20 Affiliations
                </Text>
                               <Text style={[styles.reductionDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                 -50% sur l'abonnement mensuel
               </Text>
              </View>
              <View style={[styles.reductionStatus, { 
                backgroundColor: (parrainageData?.parrainages || 0) >= 20 ? '#10b981' : '#6b7280'
              }]}>
                <Ionicons 
                  name={(parrainageData?.parrainages || 0) >= 20 ? "checkmark" : "time"} 
                  size={16} 
                  color="#ffffff" 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Section Récompenses */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Récompenses Disponibles
          </Text>
          
          <View style={styles.rewardsContainer}>
            <View style={[styles.rewardItem, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
              <Ionicons name="gift-outline" size={24} color={isDarkMode ? '#60a5fa' : '#3b82f6'} />
              <View style={styles.rewardContent}>
                <Text style={[styles.rewardTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  Première Affiliation
                </Text>
                <Text style={[styles.rewardDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                  +50 points bonus
                </Text>
                <Text style={[styles.rewardDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                  Succès "Première affiliation" débloqué
                </Text>
              </View>
              <View style={[styles.rewardStatus, { 
                backgroundColor: (parrainageData?.parrainages || 0) >= 1 ? '#10b981' : '#6b7280' 
              }]}>
                <Ionicons 
                  name={(parrainageData?.parrainages || 0) >= 1 ? "checkmark" : "time"} 
                  size={16} 
                  color="#ffffff" 
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    fontSize: 16,
  },
  useButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  useButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    minWidth: 100,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  rewardsContainer: {
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  rewardContent: {
    flex: 1,
    marginLeft: 12,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  rewardStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  reductionsContainer: {
    gap: 12,
  },
  reductionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  reductionContent: {
    flex: 1,
    marginLeft: 12,
  },
  reductionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reductionDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  reductionStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeReductionsContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  activeReductionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  activeReductionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  activeReductionText: {
    fontSize: 14,
    marginLeft: 8,
  },
  parrainageInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  parrainageInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  parrainageInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  parrainageInfoDescription: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },
  parrainageInfoList: {
    marginTop: 8,
  },
  parrainageInfoListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  parrainageInfoBullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 0,
  },
}); 