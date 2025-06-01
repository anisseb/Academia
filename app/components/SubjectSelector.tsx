import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type SubjectSelectorProps = {
  visible: boolean;
  onSelect: (subject: string) => void;
  onClose: () => void;
  selectedSubject: string | null;
};

type SubjectInfo = {
  id: string;
  label: string;
  icon: string;
  gradient: string;
};

export const SubjectSelector = ({ visible, onSelect, onClose, selectedSubject }: SubjectSelectorProps) => {
  const { isDarkMode } = useTheme();
  const [availableSubjects, setAvailableSubjects] = useState<SubjectInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserSubjects();
  }, [visible]);

  const loadUserSubjects = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const profile = userData.profile || {};
      
      // Récupérer les matières depuis le profil de l'utilisateur
      if (profile.subjects) {
        const subjects = Object.entries(profile.subjects).map(([id, data]: [string, any]) => ({
          id,
          label: data.label || id,
          icon: data.icon || 'book-open-variant',
          gradient: data.gradient || 'linear-gradient(to right, #60a5fa, #3b82f6)'
        }));
        setAvailableSubjects(subjects);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectSelect = (subject: SubjectInfo) => {
    // Renvoyer l'id de la matière (et non le label)
    onSelect(subject.label);
  };

  const themeColors = {
    background: isDarkMode ? '#2d2d2d' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    buttonBackground: isDarkMode ? '#374151' : '#f3f4f6',
    buttonText: isDarkMode ? '#ffffff' : '#000000',
    selectedBackground: '#60a5fa',
    selectedText: '#ffffff',
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => onClose()}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Choisissez une matière</Text>
          </View>
          <ScrollView style={styles.subjectList}>
            {isLoading ? (
              <Text style={[styles.loadingText, { color: themeColors.text }]}>
                Chargement des matières...
              </Text>
            ) : (
              availableSubjects.map((subject) => {
                const isSelected = selectedSubject === subject.id;
                return (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.subjectButton,
                      { 
                        backgroundColor: isSelected ? themeColors.selectedBackground : themeColors.buttonBackground,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }
                    ]}
                    onPress={() => handleSubjectSelect(subject)}
                  >
                    <Text style={[
                      styles.subjectButtonText, 
                      { color: isSelected ? themeColors.selectedText : themeColors.buttonText }
                    ]}>
                      {subject.label}
                    </Text>
                    {isSelected && (
                      <Check size={20} color={themeColors.selectedText} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subjectList: {
    maxHeight: '80%',
  },
  subjectButton: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  subjectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
}); 