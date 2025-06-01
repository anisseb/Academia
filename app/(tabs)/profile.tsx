import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import { useSchoolTypes } from '../hooks/useSchoolTypes';
import { countries } from '../constants/education';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { showErrorAlert, showSuccessAlert } from '../utils/alerts';
import { parseGradient } from '../utils/subjectGradients';
import { validateUsername } from '../utils/usernameValidation';
import { COURSE_PROGRESSION_ACHIEVEMENTS, EXERCISE_ACHIEVEMENTS, IA_ACHIEVEMENTS, SPECIAL_BADGES_ACHIEVEMENTS } from '../constants/achievements';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useSchoolData } from '../hooks/useSchoolData';

interface Section {
  id: string;
  label: string;
  description: string;
  classes: Array<{
    id: string;
    label: string;
    matieres: Record<string, {
      label: string;
      icon: string;
      gradient: string;
    }>;
  }>;
}

interface SchoolType {
  id: string;
  label: string;
  sections?: Section[];
  classes?: Record<string, {
    label: string;
    matieres: Record<string, {
      label: string;
      icon: string;
      gradient: string;
    }>;
  }>;
}

type SubjectData = {
  id: string;
  label: string;
};

type SubjectDisplay = {
  id: string;
  label: string;
  icon: string;
  gradient: string;
};

type ProfileData = {
  name: string;
  username: string;
  country: string;
  schoolType: string;
  class?: string;
  section?: string;
  subjects: SubjectData[];
  displayedAchievements?: string[];
  completedAchievements?: string[];
};

export default function ProfileScreen() {
  const { isDarkMode } = useTheme();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    username: '',
    country: '',
    schoolType: '',
    class: '',
    section: '',
    subjects: [],
  });
  const { 
    countries,
    schoolTypes,
    classes,
    subjects,
    loading: schoolDataLoading,
    error: schoolDataError
  } = useSchoolData(
    profileData.country,
    profileData.schoolType,
    profileData.class
  );
  const { schoolTypes: schoolDataTypes, loading: schoolTypesLoading, error: schoolTypesError } = useSchoolTypes();
  const [isEditing, setIsEditing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#333333' : '#e0e0e0',
    inputBackground: isDarkMode ? '#1a1a1a' : '#ffffff',
    placeholder: isDarkMode ? '#666666' : '#999999',
    buttonBackground: isDarkMode ? '#2d2d2d' : '#ffffff',
    error: isDarkMode ? '#ef4444' : '#ff3b30',
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
          username: profile.username || '',
          country: profile.country || '',
          schoolType: profile.schoolType || '',
          class: profile.class || '',
          section: profile.section || '',
          subjects: profile.subjects || [],
          displayedAchievements: profile.displayedAchievements || [],
          completedAchievements: profile.completedAchievements || [],
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      showErrorAlert('Erreur', 'Impossible de charger les données du profil');
    }
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Vérification du pseudo
      if (!profileData.username.trim()) {
        setUsernameError('Le pseudo ne peut pas être vide');
        return;
      }

      const validationResult = await validateUsername(profileData.username, profileData.username);
      if (!validationResult.isValid && validationResult.error) {
        setUsernameError(validationResult.error);
        return;
      }

      if (!profileData.name || !profileData.country || !profileData.schoolType || !profileData.subjects || profileData.subjects.length === 0) {
        showErrorAlert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const currentData = userDoc.data() || {};
      const currentProfile = currentData.profile || {};

      await updateDoc(doc(db, 'users', user.uid), {
        ...currentData,
        profile: {
          ...currentProfile,
          ...profileData,
          completedExercises: currentProfile.completedExercises || {},
          onboardingCompleted: true
        }
      });
      
      setIsEditing(false);
      showSuccessAlert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      showErrorAlert('Erreur', 'Une erreur est survenue lors de la mise à jour du profil');
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

  const getClassName = (classId: string) => {
    const classInfo = classes.find(c => c.id === classId);
    return classInfo ? classInfo.label : classId;
  };

  const getSectionName = (sectionId: string, schoolTypeId: string) => {
    const schoolType = schoolTypes.find(s => s.id === schoolTypeId) as SchoolType;
    if (!schoolType || !schoolType.sections) return sectionId;
    const section = schoolType.sections.find(s => s.id === sectionId);
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

  const toggleSubject = (subject: {
    id: string;
    label: string;
    icon: string;
    gradient: string;
  }) => {
    setProfileData(prev => ({
      ...prev,
      subjects: prev.subjects.some(s => s.id === subject.id)
        ? prev.subjects.filter(s => s.id !== subject.id)
        : [...prev.subjects, { id: subject.id, label: subject.label }],
    }));
  };

  const handleUsernameChange = (text: string) => {
    setProfileData(prev => ({ ...prev, username: text }));
    setUsernameError(null);
  };

  const renderSchoolTypeSelector = () => {
    if (schoolDataLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#60a5fa" />
        </View>
      );
    }

    if (schoolDataError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{schoolDataError}</Text>
        </View>
      );
    }

    return (
      <View style={styles.schoolTypeContainer}>
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
  };

  const renderSectionSelector = () => {
    if (profileData.schoolType !== 'high_technological') return null;
    const schoolType = schoolTypes.find(s => s.id === profileData.schoolType) as SchoolType;
    if (!schoolType || !schoolType.sections) return null;

    return (
      <View style={styles.grid}>
        {schoolType.sections.map((section) => (
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
    if (!classes.length) return null;

    return (
      <View style={styles.grid}>
        {classes.map((classItem) => (
          <TouchableOpacity
            key={classItem.id}
            style={[
              styles.card,
              profileData.class === classItem.id && styles.selectedCard,
              { backgroundColor: themeColors.buttonBackground }
            ]}
            onPress={() => handleClassChange(classItem.id)}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color={profileData.class === classItem.id ? '#ffffff' : themeColors.text}
              style={styles.cardIcon}
            />
            <Text style={[
              styles.cardLabel,
              { color: profileData.class === classItem.id ? '#ffffff' : themeColors.text }
            ]}>
              {classItem.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSubjectSelector = () => {
    if (!profileData.class || !subjects.length) return null;

    return (
      <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Matières</Text>
        <View style={styles.subjectsGrid}>
          {subjects.map((subject) => {
            const isSelected = profileData.subjects.some(s => s.id === subject.id);
            return (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectButton,
                  { borderColor: isSelected ? parseGradient(subject.gradient)[1] : themeColors.border }
                ]}
                onPress={() => toggleSubject(subject)}
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
                  colors={isSelected ? parseGradient(subject.gradient) : [themeColors.buttonBackground, themeColors.buttonBackground]}
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
      </View>
    );
  };

  const renderAchievementsSection = () => {
    const allAchievements = [
      ...COURSE_PROGRESSION_ACHIEVEMENTS,
      ...EXERCISE_ACHIEVEMENTS,
      ...IA_ACHIEVEMENTS,
      ...SPECIAL_BADGES_ACHIEVEMENTS,
    ];

    // Filtrer les succès qui sont dans completedAchievements
    const completedAchievements = allAchievements.filter(achievement => 
      profileData.completedAchievements?.includes(achievement.id)
    );

    if (completedAchievements.length === 0) {
      return (
        <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Succès affichés</Text>
          <Text style={[styles.sectionDescription, { color: themeColors.text }]}>
            Aucun succès complété à 100% pour le moment
          </Text>
          <TouchableOpacity 
            style={styles.redirectButton}
            onPress={() => {
              router.push('/(tabs)/success');
            }}
          >
            <Text style={styles.btnVoirSucces}>
              Voir la liste des succès
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Succès affichés</Text>
        <Text style={[styles.sectionDescription, { color: themeColors.text }]}>
          Choisissez les succès que vous souhaitez afficher dans votre profil
        </Text>
        <View style={styles.achievementsGrid}>
          {completedAchievements.map((achievement) => {
            const isSelected = profileData.displayedAchievements?.includes(achievement.id);
            return (
              <TouchableOpacity
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  { borderColor: isSelected ? '#60a5fa' : themeColors.border }
                ]}
                onPress={() => toggleAchievement(achievement.id)}
              >
                {achievement.imagePath ? (
                  <Image
                    source={achievement.imagePath}
                    style={styles.achievementImage}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                )}
                <Text style={[styles.achievementTitle, { color: themeColors.text }]}>
                  {achievement.title}
                </Text>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={18}
                      color="#22c55e"
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const toggleAchievement = (achievementId: string) => {
    setProfileData(prev => ({
      ...prev,
      displayedAchievements: prev.displayedAchievements?.includes(achievementId)
        ? prev.displayedAchievements.filter(id => id !== achievementId)
        : [...(prev.displayedAchievements || []), achievementId],
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Informations personnelles */}
          <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Informations personnelles</Text>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: themeColors.text }]}>Pseudo</Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                  { 
                    backgroundColor: themeColors.inputBackground,
                    color: themeColors.text,
                    borderColor: themeColors.border
                  },
                  usernameError && styles.inputError
                ]}
                value={profileData.username}
                onChangeText={handleUsernameChange}
                editable={isEditing}
                placeholder="Ton pseudo"
                placeholderTextColor={themeColors.placeholder}
              />
              {usernameError && (
                <Text style={[styles.errorText, { color: themeColors.error }]}>
                  {usernameError}
                </Text>
              )}
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
                    {getSectionName(profileData.section || '', profileData.schoolType)}
                  </Text>
                )}
              </View>
            )}

            {(profileData.class || isEditing) && (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: themeColors.text }]}>Classe</Text>
                {isEditing ? renderClassSelector() : (
                  <Text style={[styles.value, { color: themeColors.text }]}>
                    {getClassName(profileData.class || '')}
                  </Text>
                )}
              </View>
            )}
          </View>
          {renderSubjectSelector()}
          {renderAchievementsSection()}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomButton, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
        {isEditing ? (
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: themeColors.buttonBackground, borderColor: themeColors.border }]}
              onPress={() => {
                setIsEditing(false);
                loadProfileData(); // Recharger les données originales
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editButton, styles.editButtonActive]}
              onPress={handleSave}
            >
              <Text style={styles.editButtonTextActive}>
                Enregistrer
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
        <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: themeColors.buttonBackground }]}
            onPress={() => setIsEditing(true)}
        >
            <Text style={styles.editButtonText}>
              Modifier
          </Text>
        </TouchableOpacity>
        )}
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
    gap: 12,
    marginTop: 16,
  },
  subjectButton: {
    borderRadius: 12,
    width: '48%',
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
  editButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flex: 1,
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
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  schoolTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  subjectCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  subjectGradient: {
    padding: 16,
    alignItems: 'center',
  },
  subjectLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  subjectDescription: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7,
    color: '#ffffff'
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  achievementImage: {
    width: 48,
    height: 48,
    marginBottom: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  redirectButton: {
    marginTop: 16,
    backgroundColor: '#60a5fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnVoirSucces: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 