import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Animated,
  Platform,
  AlertButton,
} from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import { schoolTypes, countries, technologicalSections, getSubjectInfo, getAvailableSubjects, Class } from '../constants/education';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type ProfileData = {
  name: string;
  country: string;
  schoolType: string;
  class?: string;
  section?: string;
  subjects: string[];
};

// Fonction utilitaire pour afficher des alertes compatibles avec toutes les plateformes
const showAlert = (title: string, message: string, buttons: AlertButton[]) => {
  if (Platform.OS === 'web') {
    // En version web, utiliser window.confirm
    const result = window.confirm(`${title}\n\n${message}`);
    if (result) {
      // Si l'utilisateur clique sur OK, exécuter l'action de confirmation
      const confirmButton = buttons.find(btn => btn.style !== 'cancel');
      if (confirmButton?.onPress) {
        confirmButton.onPress();
      }
    }
  } else {
    // Sur mobile, utiliser Alert de React Native
    Alert.alert(title, message, buttons);
  }
};

export default function ProfileScreen() {
  const { isDarkMode } = useTheme();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    country: '',
    schoolType: '',
    class: '',
    section: '',
    subjects: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
    inputBackground: isDarkMode ? '#1a1a1a' : '#ffffff',
    placeholder: isDarkMode ? '#666666' : '#999999',
    buttonBackground: isDarkMode ? '#2d2d2d' : '#ffffff',
  };

  useEffect(() => {
    loadProfileData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadProfileData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().profile) {
        const profile = userDoc.data().profile;
        setProfileData({
          name: profile.name || '',
          country: profile.country || '',
          schoolType: profile.schoolType || '',
          class: profile.class || '',
          section: profile.section || '',
          subjects: profile.subjects || [],
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      showAlert('Erreur', 'Impossible de charger les données du profil', [{ text: "OK" }]);
    }
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (!profileData.name || !profileData.country || !profileData.schoolType) {
        showAlert('Erreur', 'Veuillez remplir tous les champs obligatoires', [{ text: "OK" }]);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const currentData = userDoc.data() || {};

      await updateDoc(doc(db, 'users', user.uid), {
        ...currentData,
        profile: {
          ...profileData,
          onboardingCompleted: true
        }
      });
      
      setIsEditing(false);
      showAlert('Succès', 'Profil mis à jour avec succès', [{ text: "OK" }]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      showAlert('Erreur', 'Une erreur est survenue lors de la mise à jour du profil', [{ text: "OK" }]);
    }
  };

  const getCountryName = (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    return country ? `${country.flag} ${country.name}` : countryId;
  };

  const getSchoolTypeName = (schoolTypeId: string) => {
    const schoolType = schoolTypes.find(s => s.id === schoolTypeId);
    return schoolType ? schoolType.label : schoolTypeId;
  };

  const getClassName = (classId: string, schoolTypeId: string, sectionId?: string) => {
    if (schoolTypeId === 'high_technological' && sectionId) {
      const section = technologicalSections.find(s => s.id === sectionId);
      const classInfo = section?.classes.find(c => c.id === classId);
      return classInfo ? classInfo.label : classId;
    } else {
      const schoolType = schoolTypes.find(s => s.id === schoolTypeId);
      if (schoolType && 'classes' in schoolType && Array.isArray(schoolType.classes)) {
        const classInfo = schoolType.classes.find(c => 
          typeof c === 'object' && 'id' in c && c.id === classId
        );
        return classInfo && typeof classInfo === 'object' && 'label' in classInfo ? classInfo.label : classId;
      }
    }
    return classId;
  };

  const getSectionName = (sectionId: string) => {
    const section = technologicalSections.find(s => s.id === sectionId);
    return section ? section.label : sectionId;
  };

  const handleSchoolTypeChange = (schoolTypeId: string) => {
    setProfileData(prev => ({
      ...prev,
      schoolType: schoolTypeId,
      class: '',
      section: '',
      subjects: [],
    }));
  };

  const handleSectionChange = (sectionId: string) => {
    setProfileData(prev => ({
      ...prev,
      section: sectionId,
      class: '',
      subjects: [],
    }));
  };

  const handleClassChange = (classId: string) => {
    setProfileData(prev => ({
      ...prev,
      class: classId,
      subjects: [],
    }));
  };

  const toggleSubject = (subjectId: string) => {
    setProfileData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId],
    }));
  };

  const renderSchoolTypeSelector = () => (
    <View style={styles.grid}>
      {schoolTypes.map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.card,
            profileData.schoolType === type.id && styles.selectedCard,
            { backgroundColor: themeColors.buttonBackground }
          ]}
          onPress={() => handleSchoolTypeChange(type.id)}
        >
          <MaterialCommunityIcons
            name="school"
            size={24}
            color={profileData.schoolType === type.id ? '#ffffff' : themeColors.text}
            style={styles.cardIcon}
          />
          <Text style={[
            styles.cardLabel,
            { color: profileData.schoolType === type.id ? '#ffffff' : themeColors.text }
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSectionSelector = () => {
    if (profileData.schoolType !== 'high_technological') return null;
    return (
      <View style={styles.grid}>
        {technologicalSections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.card,
              profileData.section === section.id && styles.selectedCard,
              { backgroundColor: themeColors.buttonBackground }
            ]}
            onPress={() => handleSectionChange(section.id)}
          >
            <MaterialCommunityIcons
              name="book-education"
              size={24}
              color={profileData.section === section.id ? '#ffffff' : themeColors.text}
              style={styles.cardIcon}
            />
            <Text style={[
              styles.cardLabel,
              { color: profileData.section === section.id ? '#ffffff' : themeColors.text }
            ]}>
              {section.label}
            </Text>
            <Text style={[
              styles.cardDescription,
              { 
                color: profileData.section === section.id ? '#ffffff' : themeColors.placeholder,
                opacity: profileData.section === section.id ? 0.9 : 0.7
              }
            ]}>
              {section.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderClassSelector = () => {
    let classes;
    if (profileData.schoolType === 'high_technological' && profileData.section) {
      const section = technologicalSections.find(s => s.id === profileData.section);
      classes = section?.classes || [];
    } else {
      const schoolType = schoolTypes.find(s => s.id === profileData.schoolType);
      classes = schoolType?.classes || [];
    }

    if (!classes.length) return null;

    return (
      <View style={styles.grid}>
        {classes.map((classItem) => {
          const label = typeof classItem === 'string' ? classItem : classItem.label;
          const id = typeof classItem === 'string' ? classItem : classItem.id;

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.card,
                profileData.class === id && styles.selectedCard,
                { backgroundColor: themeColors.buttonBackground }
              ]}
              onPress={() => handleClassChange(id)}
            >
              <MaterialCommunityIcons
                name="account-group"
                size={24}
                color={profileData.class === id ? '#ffffff' : themeColors.text}
                style={styles.cardIcon}
              />
              <Text style={[
                styles.cardLabel,
                { color: profileData.class === id ? '#ffffff' : themeColors.text }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderSubjectSelector = () => {
    if (!profileData.class) return null;

    const availableSubjects = getAvailableSubjects(
      profileData.schoolType,
      profileData.class,
      profileData.section
    );

    return (
      <View style={styles.subjectsGrid}>
        {availableSubjects.map((subjectId: string) => {
          const subject = getSubjectInfo(subjectId);
          const isSelected = profileData.subjects.includes(subjectId);
          return (
            <TouchableOpacity
              key={subjectId}
              style={[
                styles.subjectButton,
                { borderColor: isSelected ? subject.gradient[1] : themeColors.border }
              ]}
              onPress={() => toggleSubject(subjectId)}
            >
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color="#22c55e"
                  />
                </View>
              )}
              <LinearGradient
                colors={isSelected ? subject.gradient : [themeColors.buttonBackground, themeColors.buttonBackground]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name={subject.icon as any}
                  size={24}
                  color={isSelected ? '#ffffff' : themeColors.text}
                  style={styles.subjectIcon}
                />
                <Text style={[
                  styles.subjectButtonText,
                  { color: isSelected ? '#ffffff' : themeColors.text }
                ]}>
                  {subject.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Informations personnelles */}
          <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Informations personnelles</Text>
            
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: themeColors.text }]}>Prénom</Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                  { 
                    backgroundColor: themeColors.inputBackground,
                    color: themeColors.text,
                    borderColor: themeColors.border
                  }
                ]}
                value={profileData.name}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                editable={isEditing}
                placeholder="Ton prénom"
                placeholderTextColor={themeColors.placeholder}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: themeColors.text }]}>Pays</Text>
              <Text style={[styles.value, { color: themeColors.text }]}>
                {getCountryName(profileData.country)}
              </Text>
            </View>
          </View>

          {/* Informations scolaires */}
          <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Informations scolaires</Text>
            
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: themeColors.text }]}>Établissement</Text>
              {isEditing ? renderSchoolTypeSelector() : (
                <Text style={[styles.value, { color: themeColors.text }]}>
                  {getSchoolTypeName(profileData.schoolType)}
                </Text>
              )}
            </View>

            {(profileData.schoolType === 'high_technological' || profileData.section) && (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: themeColors.text }]}>Filière</Text>
                {isEditing ? renderSectionSelector() : (
                  <Text style={[styles.value, { color: themeColors.text }]}>
                    {getSectionName(profileData.section || '')}
                  </Text>
                )}
              </View>
            )}

            {(profileData.class || isEditing) && (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: themeColors.text }]}>Classe</Text>
                {isEditing ? renderClassSelector() : (
                  <Text style={[styles.value, { color: themeColors.text }]}>
                    {getClassName(profileData.class || '', profileData.schoolType, profileData.section)}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Matières */}
          <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Matières</Text>
            {isEditing ? renderSubjectSelector() : (
              <View style={styles.subjectsGrid}>
                {profileData.subjects.map((subjectId) => {
                  const subject = getSubjectInfo(subjectId);
                  return (
                    <View
                      key={subjectId}
                      style={[
                        styles.subjectButton,
                        { borderColor: subject.gradient[1] }
                      ]}
                    >
                      <LinearGradient
                        colors={subject.gradient}
                        style={styles.gradientBackground}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <MaterialCommunityIcons
                          name={subject.icon as any}
                          size={24}
                          color="#ffffff"
                          style={styles.subjectIcon}
                        />
                        <Text style={[styles.subjectButtonText, { color: '#ffffff' }]}>
                          {subject.label}
                        </Text>
                      </LinearGradient>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomButton, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
        <TouchableOpacity 
          style={[
            styles.editButton,
            isEditing && styles.editButtonActive,
            { backgroundColor: isEditing ? '#60a5fa' : themeColors.buttonBackground }
          ]}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          <Text style={[
            styles.editButtonText,
            isEditing && styles.editButtonTextActive
          ]}>
            {isEditing ? 'Enregistrer' : 'Modifier'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 100,
  },
  section: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  field: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectButton: {
    borderRadius: 12,
    width: '31%',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    padding: 12,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
    borderRadius: 8,
  },
  subjectButtonText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  subjectIcon: {
    marginBottom: 8,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  editButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#60a5fa',
    alignItems: 'center',
  },
  editButtonActive: {
    backgroundColor: '#60a5fa',
    borderColor: '#60a5fa',
  },
  editButtonText: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 16,
  },
  editButtonTextActive: {
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedCard: {
    backgroundColor: '#60a5fa',
    borderColor: '#60a5fa',
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    zIndex: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
}); 