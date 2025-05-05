import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';

export type AIProfile = 'professeur' | 'tuteur' | 'ami';

interface AIProfileOption {
  title: string;
  description: string;
  instruction: string;
  image: any;
}

export const AI_PROFILES: Record<AIProfile, AIProfileOption> = {
  professeur: {
    title: 'Professeur Bienveillant',
    description: 'Ton : Chaleureux, encourageant et patient. Style de Réponse : Utilise des phrases positives et motivantes.',
    instruction: "Tu es un professeur bienveillant, chaleureux et encourageant. Utilise un ton positif et motivant. Explique les concepts de manière claire et simple, en prenant le temps de t'assurer que l'élève comprend bien. Encourage les questions et montre de l'empathie.",
    image: require('../../assets/images/profile_bienveillant.png'),
  },
  tuteur: {
    title: 'Tutrice Experte',
    description: 'Ton : Professionnelle, précise et directe. Style de Réponse : Fournit des explications détaillées et techniques.',
    instruction: "Tu es une tutrice experte, professionnelle et précise. Utilise un langage académique et technique. Fournis des explications détaillées et approfondies. Reste directe et factuelle dans tes réponses.",
    image: require('../../assets/images/profile_expert.png'),
  },
  ami: {
    title: 'Ami Étudiant',
    description: 'Ton : Décontracté, amical et collaboratif. Style de Réponse : Utilise un langage informel et simple.',
    instruction: "Tu es un ami étudiant, décontracté et amical. Utilise un langage informel et simple. Mets-toi au niveau de l'élève et encourage la discussion. Sois naturel et sympathique dans tes réponses.",
    image: require('../../assets/images/profile_ami.png'),
  }
};

interface AIProfileSelectorProps {
  visible: boolean;
  onSelect: (profile: AIProfile) => void;
  onClose: () => void;
  selectedProfile: AIProfile;
  themeColors: {
    background: string;
    text: string;
    card: string;
    border: string;
    tabActive: string;
  };
}

export default function AIProfileSelector({
  visible,
  onSelect,
  onClose,
  selectedProfile,
  themeColors,
}: AIProfileSelectorProps) {

  if (!visible) return null;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Type de professeur :
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.profileList}>
            {Object.entries(AI_PROFILES).map(([id, profile]) => {
              const isSelected = selectedProfile === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.profileButton,
                    { 
                      backgroundColor: isSelected ? themeColors.tabActive : themeColors.card,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }
                  ]}
                  onPress={() => onSelect(id as AIProfile)}
                >
                  <View style={styles.profileContainer}>
                    <Image 
                      source={profile.image} 
                      style={styles.profileImage} 
                      contentFit="contain"
                      cachePolicy="memory-disk"
                    />
                    <View style={styles.profileTextContainer}>
                      <Text style={[styles.profileButtonText, { color: themeColors.text }]}>
                        {profile.title}
                      </Text>
                      <Text style={[styles.profileDescription, { color: themeColors.text }]}>
                        {profile.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={20} color={themeColors.text} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    width: '80%',
    maxHeight: '70%',
    position: 'relative',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileList: {
    maxHeight: '80%',
  },
  profileButton: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 5,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(235, 230, 230, 0.95)',
  },
  profileTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileDescription: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
}); 