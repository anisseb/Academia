import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { subjectsList } from '../constants/subjects';

type SubjectSelectorProps = {
  visible: boolean;
  subjects: string[];
  onSelect: (subject: string) => void;
  onClose: () => void;
  selectedSubject: string | null;
};


export const SubjectSelector = ({ visible, subjects, onSelect, onClose, selectedSubject }: SubjectSelectorProps) => {
  const { isDarkMode } = useTheme();

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
            {subjectsList.map((subject) => {
              const isAvailable = subjects.includes(subject.id) || subject.id === 'discussion';
              if (!isAvailable) return null;
              
              const isSelected = selectedSubject === subject.id;
              return (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectButton,
                    subject.id === 'discussion' && styles.justChatButton,
                    { 
                      backgroundColor: isSelected ? themeColors.selectedBackground : themeColors.buttonBackground,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }
                  ]}
                  onPress={() => onSelect(subject.id)}
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
            })}
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
  justChatButton: {
    marginTop: 16,
  },
  subjectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 