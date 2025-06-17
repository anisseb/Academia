import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { renderMathText as MathText } from '../../utils/mathRenderer';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import katex from 'katex';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { parseGradient } from '../../utils/subjectGradients';
import { LinearGradient } from 'expo-linear-gradient';

interface CoursSection {
  title: string;
  content: string;
  examples?: string[];
  keyPoints?: string[];
}

interface CoursContent {
  title: string;
  introduction: string;
  sections: CoursSection[];
  conclusion: string;
}

export default function CoursScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  
  // Obtenir la hauteur de la barre de statut
  const statusBarHeight = StatusBar.currentHeight || 0;
  
  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
  };

  const [coursContent, setCoursContent] = useState<CoursContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState<string>('');
  const [userSchoolType, setUserSchoolType] = useState<string>('');
  const [interstitialAd, setInterstitialAd] = useState<InterstitialAd | null>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const setDetails = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Création de l'identifiant unique
    const uniqueId = `${params.chapterId}`;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Créer le document utilisateur s'il n'existe pas
      await setDoc(userDocRef, {
        success: {
          cours: {
            [uniqueId]: {
              timestamp: new Date(),
              count: 1,
              pdfExported: 0
            }
          }
        }
      });
    } else {
      // Mettre à jour le document existant
      const userData = userDoc.data();
      const currentSuccess = userData.success.cours || {};
      const currentContent = currentSuccess[uniqueId] || { count: 0, pdfExported: 0 };

      await updateDoc(userDocRef, {
        [`success.cours.${uniqueId}`]: {
          timestamp: new Date(),
          count: currentContent.count + 1,
          pdfExported: currentContent.pdfExported || 0
        }
      });
    }
  };

  useEffect(() => {
    loadUserData();
    checkIfFavorite();
    setDetails();
    // Initialiser l'annonce
    const ad = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['education', 'school']
    });

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setAdLoaded(true);
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
      setAdLoaded(false);
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false);
      // Recharger une nouvelle annonce
      ad.load();
      // Revenir en arrière après la fermeture de l'annonce
      router.back();
    });

    // Charger l'annonce
    try {
      ad.load();
    } catch (error) {
      console.error('Erreur lors du chargement de l\'annonce:', error);
    }

    setInterstitialAd(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeError();
      unsubscribeClosed();
    };
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.profile) {
          setUserLevel(userData.profile.class || '');
          setUserSchoolType(userData.profile.schoolType || '');
          await loadCourse();
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      setLoading(false);
    }
  };

  const loadCourse = async () => {
    try {
      setLoading(true);
      // Vérifier la connexion
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        // Mode hors-ligne : charger depuis AsyncStorage
        const cached = await AsyncStorage.getItem(`@offline_course_${params.chapterId}`);
        if (cached) {
          setCoursContent(JSON.parse(cached));
        } else {
          setCoursContent(null);
        }
        setLoading(false);
        return;
      }
      // Récupérer le cours depuis la collection chapters
      const chapterDoc = await getDoc(doc(db, 'chapters', params.chapterId as string));
      if (!chapterDoc.exists()) {
        console.error('Chapitre non trouvé');
        setLoading(false);
        return;
      }
      const chapterData = chapterDoc.data();
      if (!chapterData.cours) {
        console.error('Cours non trouvé');
        setLoading(false);
        return;
      }
      setCoursContent(chapterData.cours);
    } catch (error) {
      console.error('Erreur lors du chargement du cours:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const favorites = userData.favorites || [];
      
      const isInFavorites = favorites.some(
        (fav: any) => fav.chapterId === params.chapterId
      );
      
      setIsFavorite(isInFavorites);
    } catch (error) {
      console.error('Erreur lors de la vérification des favoris:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const user = auth.currentUser;
      if (!user || !coursContent) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const favorites = userData.favorites || [];
      
      if (isFavorite) {
        // Retirer des favoris
        const newFavorites = favorites.filter(
          (fav: any) => fav.chapterId !== params.chapterId
        );
        
        await updateDoc(userRef, {
          favorites: newFavorites
        });
        // Supprimer du cache local
        await AsyncStorage.removeItem(`@offline_course_${params.chapterId}`);
      } else {
        // Vérifier si le chapitre est déjà dans les favoris
        const isAlreadyFavorite = favorites.some(
          (fav: any) => fav.chapterId === params.chapterId
        );

        if (!isAlreadyFavorite) {
          // Ajouter aux favoris seulement s'il n'est pas déjà présent
          const newFavorite = {
            chapterId: params.chapterId,
            timestamp: Date.now()
          };
          
          await updateDoc(userRef, {
            favorites: [...favorites, newFavorite]
          });
          // Sauvegarder le contenu du cours dans AsyncStorage
          await AsyncStorage.setItem(`@offline_course_${params.chapterId}`, JSON.stringify(coursContent));
        }
      }
      
      setIsFavorite(!isFavorite);
      
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
    /*
    if (adLoaded && interstitialAd) {
      interstitialAd.show();
    } else {
      router.back();
    }
    */
  };

  const generatePDF = async () => {
    if (!coursContent) return null;
    
    try {
      // Charger l'image

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" integrity="sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP" crossorigin="anonymous">
            <style>
              @page {
                margin: 0;
                @top-left {
                  content: element(header);
                }
              }
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                color: ${isDarkMode ? '#ffffff' : '#000000'};
                background-color: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
                margin-top: 80px;
              }
              .header {
                position: running(header);
                text-align: left;
                padding: 10px;
                background-color: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
                width: 100%;
                height: 60px;
                display: table;
                table-layout: fixed;
                border-collapse: collapse;
                border-spacing: 0;
              }
              .header-row {
                display: table-row;
              }
              .header-cell {
                display: table-cell;
                vertical-align: middle;
                padding: 10px;
                margin: 0;
                width: 40px;
              }
              .header-text {
                display: table-cell;
                vertical-align: middle;
                padding: 0;
                margin: 0;
                text-align: left;
              }
              .header img {
                width: 50px;
                height: 50px;
                margin-right: 10px;
              }
              .header-text {
                font-size: 14px;
                color: ${isDarkMode ? '#ffffff' : '#000000'};
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
                text-align: center;
              }
              .section {
                margin-bottom: 20px;
                page-break-inside: avoid;
              }
              .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #60a5fa;
                margin-bottom: 10px;
              }
              .content {
                font-size: 16px;
                line-height: 1.5;
                white-space: normal;
                word-wrap: break-word;
              }
              .examples {
                margin-top: 12px;
                margin-left: 20px;
              }
              .example {
                margin-bottom: 8px;
                padding: 8px;
                background-color: ${isDarkMode ? '#2d2d2d' : '#f5f5f5'};
                border-radius: 4px;
                white-space: normal;
                word-wrap: break-word;
              }
              .key-points {
                margin-top: 12px;
                margin-left: 20px;
              }
              .key-point {
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                white-space: normal;
                word-wrap: break-word;
              }
              .key-point::before {
                content: "•";
                color: #60a5fa;
                margin-right: 8px;
              }
              .page-break {
                page-break-before: always;
              }
              .katex {
                font-size: 1.1em;
                display: inline !important;
                white-space: nowrap !important;
              }
              .katex-display {
                margin: 0 !important;
                display: inline !important;
                white-space: nowrap !important;
              }
              .math-container {
                display: inline !important;
                margin: 0 4px;
                white-space: nowrap !important;
              }
              .math-display-container {
                display: inline !important;
                margin: 0 4px;
                white-space: nowrap !important;
              }
              p {
                margin: 0;
                padding: 0;
                display: inline;
                white-space: normal;
                word-wrap: break-word;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-cell">
                <img src="https://academiaforkids.com/wp-content/uploads/2025/04/favicon.png" alt="academIA Logo" />
              </div>
              <div class="header-text">
                <div>${params.subjectLabel}</div>
                <div>${params.chapterLabel}</div>
              </div>
            </div>

            <div class="title">${coursContent.title}</div>
            
            <div class="section">
              <div class="section-title">Introduction</div>
              <div class="content">${renderMathContent(coursContent.introduction)}</div>
            </div>

            ${coursContent.sections.map((section, index) => `
              ${index > 0 ? `
                <div class="page-break"></div>
                  <div class="header">
                    <div class="header-cell">
                      <img src="https://academiaforkids.com/wp-content/uploads/2025/04/favicon.png" alt="academIA Logo" />
                    </div>
                    <div class="header-text">
                      <div>${params.subjectLabel}</div>
                      <div>${params.chapterLabel}</div>
                    </div>
                  </div>
              ` : ''}
              <div class="section">
                <div class="section-title">${section.title}</div>
                <div class="content">${renderMathContent(section.content)}</div>
                ${section.examples ? `
                  <div class="examples">
                    ${section.examples.map(example => `
                      <div class="example">${renderMathContent(example)}</div>
                    `).join('')}
                  </div>
                ` : ''}
                ${section.keyPoints ? `
                  <div class="key-points">
                    ${section.keyPoints.map(point => `
                      <div class="key-point">${renderMathContent(point)}</div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}

            <div class="section">
              <div class="section-title">Conclusion</div>
              <div class="content">${renderMathContent(coursContent.conclusion)}</div>
            </div>
            <div class="page-break"></div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      return uri;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      return null;
    }
  };

  const handleExport = async () => {
    if (!coursContent) return;
    
    try {
      const pdfUri = await generatePDF();
      if (pdfUri) {
        await shareAsync(pdfUri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Exporter le cours',
        });

        // Incrémenter le compteur d'export PDF
        const user = auth.currentUser;
        if (!user) return;

        const uniqueId = `${params.chapterId}`;
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentSuccess = userData.success.cours || {};
          const currentContent = currentSuccess[uniqueId] || { pdfExported: 0 };

          await updateDoc(userDocRef, {
            [`success.cours.${uniqueId}.pdfExported`]: (currentContent.pdfExported || 0) + 1
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'exportation du PDF:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={parseGradient(params.subjectGradient as string)[0]} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Chargement du cours...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!coursContent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themeColors.text }]}>
            Impossible de charger le cours
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          borderBottomColor: themeColors.border,
          paddingTop: Platform.OS === 'android' ? statusBarHeight + 12 : 16,
          paddingBottom: Platform.OS === 'android' ? 12 : 16,
          marginTop: Platform.OS === 'android' ? 10 : 0,
        }
      ]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={themeColors.text} 
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.subjectLabel, { color: parseGradient(params.subjectGradient as string)[0] }]}>
            {params.subjectLabel}
          </Text>
          <Text style={[styles.chapterLabel, { color: themeColors.text }]}>
            {params.themeLabel}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={toggleFavorite}
        >
          <MaterialCommunityIcons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#ef4444" : themeColors.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={[styles.courseCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.courseTitle, { color: themeColors.text }]}
            numberOfLines={5}
            adjustsFontSizeToFit
          >
            {coursContent.title}
          </Text>
          <View style={styles.section}>
            <LinearGradient
              colors={parseGradient(params.subjectGradient as string)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionTitleGradient}
            >
              <Text style={styles.sectionTitle}>
                Introduction
              </Text>
            </LinearGradient>
            <View style={styles.mathContent}>
              <MathText
                content={coursContent.introduction}
                type="cours"
                isDarkMode={isDarkMode}
              />
            </View>
          </View>

          {coursContent.sections.map((section: CoursSection, index: number) => (
            <View key={index} style={styles.section}>
              <LinearGradient
                colors={parseGradient(params.subjectGradient as string)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sectionTitleGradient}
              >
                <Text style={styles.sectionTitle}>
                  {section.title}
                </Text>
              </LinearGradient>
              <View style={styles.mathContent}>
                <MathText
                  content={section.content}
                  type="cours"
                  isDarkMode={isDarkMode}
                />
              </View>
              
              {section.examples && (
                <View style={styles.examples}>
                  {section.examples.map((example, i) => (
                    <View key={i} style={[styles.exampleBox, { backgroundColor: themeColors.background }]}>
                      <View style={styles.mathContent}>
                        <MathText
                          content={example}
                          type="cours"
                          isDarkMode={isDarkMode}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {section.keyPoints && (
                <View style={styles.keyPoints}>
                  {section.keyPoints.map((point, i) => (
                    <View key={i} style={styles.keyPointItem}>
                      <MaterialCommunityIcons 
                        name="check-circle" 
                        size={20} 
                        color={parseGradient(params.subjectGradient as string)[0]} 
                      />
                      <MathText
                        content={point}
                        type="cours"
                        isDarkMode={isDarkMode}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          <View style={styles.section}>
            <LinearGradient
              colors={parseGradient(params.subjectGradient as string)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionTitleGradient}
            >
              <Text style={styles.sectionTitle}>
                Conclusion
              </Text>
            </LinearGradient>
            <MathText
              content={coursContent.conclusion}
              type="cours"
              isDarkMode={isDarkMode}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer with export button */}
      <View style={styles.footer}>
        <LinearGradient
          colors={parseGradient(params.subjectGradient as string)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.footerButton}
        >
          <TouchableOpacity 
            style={styles.footerButtonContent}
            onPress={handleExport}
          >
            <MaterialCommunityIcons name="share-variant" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
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
    minHeight: Platform.OS === 'android' ? 70 : 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    marginLeft: 16,
    flex: 1,
  },
  subjectLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chapterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  courseCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  examples: {
    marginTop: 12,
    gap: 8,
  },
  exampleBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  exampleText: {
    fontSize: 15,
  },
  keyPoints: {
    marginTop: 12,
    width: '90%',
    gap: 8,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyPointText: {
    fontSize: 15,
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  mathContent: {
    height: 'auto',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  footerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  footerButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  sectionTitleGradient: {
    borderRadius: 8,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    width: '100%',
  },
});

function renderMathContent(content: string): string {
  // Remplacer les doubles backslashes par des simples
  const cleanContent = content.replace(/\\\\/g, '\\');
  
  // Rendre les formules avec les délimiteurs \(...\)
  const parenContent = cleanContent.replace(/\\\((.*?)\\\)/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false });
    } catch (e) {
      console.error('Erreur de rendu KaTeX (paren):', e);
      return match;
    }
  });
  
  // Rendre les formules avec les délimiteurs $...$
  const finalContent = parenContent.replace(/\$(.*?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false });
    } catch (e) {
      console.error('Erreur de rendu KaTeX (inline):', e);
      return match;
    }
  });
  
  return finalContent;
}