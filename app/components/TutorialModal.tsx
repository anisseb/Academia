import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface TutorialSlide {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  image?: any;
}

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
}

const tutorialSlides: TutorialSlide[] = [
  {
    id: 1,
    title: '🎓 Bienvenue sur Academia !',
    description: 'Votre application d\'apprentissage personnalisé pour réussir vos études.',
    icon: 'school',
    iconColor: '#3B82F6',
    image: require('../../assets/images/logo-app-presentation.png'),
  },
  {
    id: 2,
    title: '🏠 Accueil - Vue d\'ensemble',
    description: 'Retrouvez ici votre progression quotidienne, les expressions du jour et un accès rapide à toutes les fonctionnalités.',
    icon: 'home',
    iconColor: '#3B82F6',
  },
  {
    id: 3,
    title: '📚 Exercices interactifs',
    description: 'Onglet "Entraînement" : Accédez à des milliers d\'exercices adaptés à votre niveau et progressez à votre rythme.',
    icon: 'library',
    iconColor: '#10B981',
  },
  {
    id: 4,
    title: '📖 Cours',
    description: 'Onglet "Entrainement" : Consultez des cours détaillés pour approfondir vos connaissances.',
    icon: 'book',
    iconColor: '#F59E0B',
  },
  {
    id: 5,
    title: '📊 Suivi de progression',
    description: 'Onglet "Statistiques" : Visualisez vos statistiques et suivez votre progression dans chaque matière.',
    icon: 'analytics',
    iconColor: '#8B5CF6',
  },
  {
    id: 6,
    title: '✨ Assistant IA',
    description: 'Bouton "Nouvelle conversation" dans le menu: Profitez de l\'aide de notre assistant IA pour résoudre vos exercices et comprendre les concepts.',
    icon: 'sparkles',
    iconColor: '#EC4899',
  },
  {
    id: 7,
    title: '📷 Scanner de documents',
    description: 'Dans une conversation, vous pouvez scanner des documents et obtenir instantanément des explications et des exercices.',
    icon: 'camera',
    iconColor: '#06B6D4',
  },
  {
    id: 8,
    title: '⚙️ Paramètres et support',
    description: 'Onglet "Paramètres" : Configurez vos notifications, modifiez le thème de l\'application, contactez-nous ou signalez un bug.',
    icon: 'settings',
    iconColor: '#6B7280',
  },
  {
    id: 9,
    title: '🚀 Vous êtes prêt !',
    description: 'Commencez votre parcours d\'apprentissage et atteignez vos objectifs académiques.',
    icon: 'checkmark-circle',
    iconColor: '#10B981',
  },
];

export default function TutorialModal({ visible, onClose }: TutorialModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { isDarkMode } = useTheme();

  const themeColors = {
    background: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#1F2937',
    primary: '#3B82F6',
    secondary: isDarkMode ? '#374151' : '#F3F4F6',
    border: isDarkMode ? '#4B5563' : '#E5E7EB',
  };

  const handleNext = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      scrollViewRef.current?.scrollTo({
        x: (currentSlide + 1) * width,
        animated: true,
      });
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const renderSlide = (slide: TutorialSlide) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        {slide.image ? (
          <View style={styles.imageContainer}>
            <Image source={slide.image} style={styles.slideImage} resizeMode="contain" />
          </View>
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: slide.iconColor + '20' }]}>
            <Ionicons name={slide.icon} size={60} color={slide.iconColor} />
          </View>
        )}
        
        <Text style={[styles.slideTitle, { color: themeColors.text }]}>
          {slide.title}
        </Text>
        
        <Text style={[styles.slideDescription, { color: themeColors.text }]}>
          {slide.description}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: themeColors.text }]}>
              Passer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {tutorialSlides.map(renderSlide)}
        </ScrollView>

        {/* Pagination */}
        <View style={styles.pagination}>
          {tutorialSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentSlide ? themeColors.primary : themeColors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: themeColors.secondary }]}
            onPress={handleNext}
          >
            <Text style={[styles.navButtonText, { color: themeColors.primary }]}>
              {currentSlide === tutorialSlides.length - 1 ? 'Commencer' : 'Suivant'}
            </Text>
            <Ionicons
              name={currentSlide === tutorialSlides.length - 1 ? 'checkmark' : 'arrow-forward'}
              size={20}
              color={themeColors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  imageContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'white',
    borderRadius: 40,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
  },
  slideDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navigation: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 