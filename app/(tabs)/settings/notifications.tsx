import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Platform, Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { configureNotifications, scheduleMotivationalNotifications } from '../../utils/notifications';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationSettingsScreen() {
  const { isDarkMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [dailyRemindersEnabled, setDailyRemindersEnabled] = useState(false);
  const insets = useSafeAreaInsets();

  const [motivationalFrequency, setMotivationalFrequency] = useState(0);
  const [motivationalTime1, setMotivationalTime1] = useState(new Date());
  const [motivationalTime2, setMotivationalTime2] = useState(new Date());
  const [showTimePicker1, setShowTimePicker1] = useState(false);
  const [showTimePicker2, setShowTimePicker2] = useState(false);
  const [tempTime1, setTempTime1] = useState(new Date());
  const [tempTime2, setTempTime2] = useState(new Date());

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setNotificationsEnabled(userData.notificationsEnabled || false);
        if(userData.notificationsEnabled) {
          if (userData.settings?.reminderTime && userData.settings.reminderTime !== 'none') {
            const [hours, minutes] = userData.settings.reminderTime.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes);
            setReminderTime(date);
            setDailyRemindersEnabled(true);
          } else {
            setDailyRemindersEnabled(false);
            const date = new Date();
            date.setHours(0, 0);
            setReminderTime(date);
          }
          if (userData.settings?.motivationalFrequency !== undefined) {
            setMotivationalFrequency(userData.settings.motivationalFrequency);
          }
          if (userData.settings?.motivationalTime1) {
            const [hours, minutes] = userData.settings.motivationalTime1.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes);
            setMotivationalTime1(date);
          }
          if (userData.settings?.motivationalTime2) {
            const [hours, minutes] = userData.settings.motivationalTime2.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes);
            setMotivationalTime2(date);
          }
        }
      }
    }
  };

  const toggleNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const user = auth.currentUser;
    if (user) {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      
      if (newValue) {
        try {
          await configureNotifications();
        } catch (error) {
          setNotificationsEnabled(false);
          await updateDoc(doc(db, 'users', user.uid), {
            notificationsEnabled: false
          });
          return;
        }
      }
      
      await updateDoc(doc(db, 'users', user.uid), {
        notificationsEnabled: newValue
      });
    }
  };

  const toggleDailyReminders = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const user = auth.currentUser;
    if (user) {
      const newValue = !dailyRemindersEnabled;
      setDailyRemindersEnabled(newValue);
      
      if (!newValue) {
        const date = new Date();
        date.setHours(0, 0);
        setReminderTime(date);
        await updateDoc(doc(db, 'users', user.uid), {
          'settings.reminderTime': 'none'
        });
      } else {
        setShowTimePicker(true);
      }
    }
  };

  const handleSaveTime = async () => {
    const user = auth.currentUser;
    if (user) {
      const timeString = formatTime(tempTime);
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.reminderTime': timeString
      });
      setReminderTime(tempTime);
      setShowTimePicker(false);
    }
  };

  const handleSaveTime1 = async () => {
    const user = auth.currentUser;
    if (user) {
      const timeString = formatTime(tempTime1);
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.motivationalTime1': timeString
      });
      await scheduleMotivationalNotifications(user.uid);
      setMotivationalTime1(tempTime1);
      setShowTimePicker1(false);
    }
  };

  const handleSaveTime2 = async () => {
    const user = auth.currentUser;
    if (user) {
      const timeString = formatTime(tempTime2);
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.motivationalTime2': timeString
      });
      await scheduleMotivationalNotifications(user.uid);
      setMotivationalTime2(tempTime2);
      setShowTimePicker2(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedTime) {
        const newTime = new Date();
        newTime.setHours(selectedTime.getHours());
        newTime.setMinutes(selectedTime.getMinutes());
        setTempTime(newTime);
        setReminderTime(newTime);
        setShowTimePicker(false);
        
        const user = auth.currentUser;
        if (user) {
          const timeString = formatTime(newTime);
          updateDoc(doc(db, 'users', user.uid), {
            'settings.reminderTime': timeString
          });
        }
      } else {
        setShowTimePicker(false);
      }
    } else {
      if (selectedTime) {
        setTempTime(selectedTime);
      }
    }
  };

  const handleTimeChange1 = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedTime) {
        const newTime = new Date();
        newTime.setHours(selectedTime.getHours());
        newTime.setMinutes(selectedTime.getMinutes());
        setTempTime1(newTime);
        setMotivationalTime1(newTime);
        setShowTimePicker1(false);
        
        const user = auth.currentUser;
        if (user) {
          const timeString = formatTime(newTime);
          updateDoc(doc(db, 'users', user.uid), {
            'settings.motivationalTime1': timeString
          });
          scheduleMotivationalNotifications(user.uid);
        }
      } else {
        setShowTimePicker1(false);
      }
    } else {
      if (selectedTime) {
        setTempTime1(selectedTime);
      }
    }
  };

  const handleTimeChange2 = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedTime) {
        const newTime = new Date();
        newTime.setHours(selectedTime.getHours());
        newTime.setMinutes(selectedTime.getMinutes());
        setTempTime2(newTime);
        setMotivationalTime2(newTime);
        setShowTimePicker2(false);
        
        const user = auth.currentUser;
        if (user) {
          const timeString = formatTime(newTime);
          updateDoc(doc(db, 'users', user.uid), {
            'settings.motivationalTime2': timeString
          });
          scheduleMotivationalNotifications(user.uid);
        }
      } else {
        setShowTimePicker2(false);
      }
    } else {
      if (selectedTime) {
        setTempTime2(selectedTime);
      }
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleFrequencyChange = async (frequency: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMotivationalFrequency(frequency);
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.motivationalFrequency': frequency
      });
      await scheduleMotivationalNotifications(user.uid);
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
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <View style={{ top: insets.top }}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}
            onPress={() => router.back()}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDarkMode ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content}>
          <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5', marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Notifications
            </Text>
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Activer les notifications
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#767577', true: '#60a5fa' }}
                thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={[
            styles.section, 
            { 
              backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
              opacity: notificationsEnabled ? 1 : 0.5 
            }
          ]}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Rappels objectifs quotidiens
            </Text>
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: isDarkMode ? '#ffffff' : '#000000', width: 200 }]}>
                Activer les rappels quotidiens
              </Text>
              <Switch
                value={dailyRemindersEnabled}
                onValueChange={toggleDailyReminders}
                trackColor={{ false: '#767577', true: '#60a5fa' }}
                thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
                disabled={!notificationsEnabled}
              />
            </View>

            {dailyRemindersEnabled && (
              <TouchableOpacity
                style={[
                  styles.timePickerButton,
                  { 
                    backgroundColor: notificationsEnabled 
                      ? (isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(96, 165, 250, 0.1)')
                      : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                  }
                ]}
                onPress={() => {
                  if (notificationsEnabled) {
                    if (showTimePicker) {
                      setShowTimePicker(false);
                      setTempTime(reminderTime);
                    } else {
                      setShowTimePicker(true);
                    }
                  }
                }}
                disabled={!notificationsEnabled}
              >
                <View style={styles.timePickerContent}>
                  <Ionicons 
                    name="time-outline" 
                    size={24} 
                    color={isDarkMode ? '#ffffff' : '#000000'} 
                  />
                  <Text style={[
                    styles.timeText, 
                    { 
                      color: isDarkMode ? '#ffffff' : '#000000',
                      opacity: notificationsEnabled ? 1 : 0.5
                    }
                  ]}>
                    {formatTime(reminderTime)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {showTimePicker && (
              Platform.OS === 'ios' ? (
                <Modal
                  transparent={true}
                  visible={showTimePicker}
                  animationType="slide"
                >
                  <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
                      <DateTimePicker
                        value={tempTime}
                        mode="time"
                        is24Hour={true}
                        display="spinner"
                        onChange={handleTimeChange}
                      />
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, { backgroundColor: isDarkMode ? '#3d3d3d' : '#f5f5f5' }]}
                          onPress={() => {
                            setShowTimePicker(false);
                            setTempTime(reminderTime);
                          }}
                        >
                          <Text style={[styles.modalButtonText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalButton, { backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }]}
                          onPress={handleSaveTime}
                        >
                          <Text style={styles.modalButtonText}>Enregistrer</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              ) : (
                <View style={styles.timePickerContainer}>
                  <DateTimePicker
                    value={tempTime}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={handleTimeChange}
                  />
                </View>
              )
            )}
          </View>
          <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
            <Text style={[
              styles.sectionTitle, 
              { 
                color: isDarkMode ? '#ffffff' : '#000000',
                opacity: notificationsEnabled ? 1 : 0.5
              }
            ]}>
              Messages motivants
            </Text>
            <Text style={[
              styles.settingDescription, 
              { 
                color: isDarkMode ? '#ffffff' : '#000000',
                opacity: notificationsEnabled ? 1 : 0.5
              }
            ]}>
              Recevez des messages motivants pour vous encourager dans votre apprentissage
            </Text>
            
            <View style={styles.frequencyContainer}>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  { 
                    backgroundColor: motivationalFrequency === 0 
                      ? (isDarkMode ? '#60a5fa' : '#3b82f6')
                      : (isDarkMode ? '#3d3d3d' : '#ffffff'),
                    borderColor: isDarkMode ? '#4d4d4d' : '#e0e0e0',
                    opacity: notificationsEnabled ? 1 : 0.5
                  }
                ]}
                onPress={() => handleFrequencyChange(0)}
                disabled={!notificationsEnabled}
              >
                <Text style={[
                  styles.frequencyText,
                  { 
                    color: motivationalFrequency === 0 ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000'),
                    opacity: notificationsEnabled ? 1 : 0.5
                  }
                ]}>
                  Désactivés
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  { 
                    backgroundColor: motivationalFrequency === 1 
                      ? (isDarkMode ? '#60a5fa' : '#3b82f6')
                      : (isDarkMode ? '#3d3d3d' : '#ffffff'),
                    borderColor: isDarkMode ? '#4d4d4d' : '#e0e0e0',
                    opacity: notificationsEnabled ? 1 : 0.5
                  }
                ]}
                onPress={() => handleFrequencyChange(1)}
                disabled={!notificationsEnabled}
              >
                <Text style={[
                  styles.frequencyText,
                  { 
                    color: motivationalFrequency === 1 ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000'),
                    opacity: notificationsEnabled ? 1 : 0.5
                  }
                ]}>
                  1 fois par jour
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  { 
                    backgroundColor: motivationalFrequency === 2 
                      ? (isDarkMode ? '#60a5fa' : '#3b82f6')
                      : (isDarkMode ? '#3d3d3d' : '#ffffff'),
                    borderColor: isDarkMode ? '#4d4d4d' : '#e0e0e0',
                    opacity: notificationsEnabled ? 1 : 0.5
                  }
                ]}
                onPress={() => handleFrequencyChange(2)}
                disabled={!notificationsEnabled}
              >
                <Text style={[
                  styles.frequencyText,
                  { 
                    color: motivationalFrequency === 2 ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000'),
                    opacity: notificationsEnabled ? 1 : 0.5
                  }
                ]}>
                  2 fois par jour
                </Text>
              </TouchableOpacity>
            </View>

            {motivationalFrequency > 0 && (
              <TouchableOpacity
                style={[
                  styles.timePickerButtonMotivational,
                  { 
                    backgroundColor: isDarkMode ? '#3d3d3d' : '#ffffff',
                    borderColor: isDarkMode ? '#4d4d4d' : '#e0e0e0',
                    opacity: notificationsEnabled ? 1 : 0.5
                  }
                ]}
                onPress={() => {
                  if (showTimePicker1) {
                    setShowTimePicker1(false);
                    setTempTime1(motivationalTime1);
                  } else {
                    setShowTimePicker1(true);
                  }
                }}
                disabled={!notificationsEnabled}
              >
                <View style={styles.timePickerContent}>
                  <Ionicons 
                    name="sunny-outline" 
                    size={24} 
                    color={isDarkMode ? '#ffffff' : '#000000'}
                    style={{ opacity: notificationsEnabled ? 1 : 0.5 }}
                  />
                  <Text style={[
                    styles.timeText, 
                    { 
                      color: isDarkMode ? '#ffffff' : '#000000',
                      opacity: notificationsEnabled ? 1 : 0.5
                    }
                  ]}>
                    {formatTime(motivationalTime1)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {motivationalFrequency === 2 && (
              <TouchableOpacity
                style={[
                  styles.timePickerButtonMotivational,
                  { 
                    backgroundColor: isDarkMode ? '#3d3d3d' : '#ffffff',
                    borderColor: isDarkMode ? '#4d4d4d' : '#e0e0e0',
                    opacity: notificationsEnabled ? 1 : 0.5
                  }
                ]}
                onPress={() => {
                  if (showTimePicker2) {
                    setShowTimePicker2(false);
                    setTempTime2(motivationalTime2);
                  } else {
                    setShowTimePicker2(true);
                  }
                }}
                disabled={!notificationsEnabled}
              >
                <View style={styles.timePickerContent}>
                  <Ionicons 
                    name="moon-outline" 
                    size={24} 
                    color={isDarkMode ? '#ffffff' : '#000000'}
                    style={{ opacity: notificationsEnabled ? 1 : 0.5 }}
                  />
                  <Text style={[
                    styles.timeText, 
                    { 
                      color: isDarkMode ? '#ffffff' : '#000000',
                      opacity: notificationsEnabled ? 1 : 0.5
                    }
                  ]}>
                    {formatTime(motivationalTime2)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {showTimePicker1 && (
              Platform.OS === 'ios' ? (
                <Modal
                  transparent={true}
                  visible={showTimePicker1}
                  animationType="slide"
                >
                  <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
                      <DateTimePicker
                        value={tempTime1}
                        mode="time"
                        is24Hour={true}
                        display="spinner"
                        onChange={handleTimeChange1}
                      />
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, { backgroundColor: isDarkMode ? '#3d3d3d' : '#f5f5f5' }]}
                          onPress={() => {
                            setShowTimePicker1(false);
                            setTempTime1(motivationalTime1);
                          }}
                        >
                          <Text style={[styles.modalButtonText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalButton, { backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }]}
                          onPress={handleSaveTime1}
                        >
                          <Text style={styles.modalButtonText}>Enregistrer</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              ) : (
                <View style={styles.timePickerContainer}>
                  <DateTimePicker
                    value={tempTime1}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={handleTimeChange1}
                  />
                </View>
              )
            )}

            {showTimePicker2 && (
              Platform.OS === 'ios' ? (
                <Modal
                  transparent={true}
                  visible={showTimePicker2}
                  animationType="slide"
                >
                  <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff' }]}>
                      <DateTimePicker
                        value={tempTime2}
                        mode="time"
                        is24Hour={true}
                        display="spinner"
                        onChange={handleTimeChange2}
                      />
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, { backgroundColor: isDarkMode ? '#3d3d3d' : '#f5f5f5' }]}
                          onPress={() => {
                            setShowTimePicker2(false);
                            setTempTime2(motivationalTime2);
                          }}
                        >
                          <Text style={[styles.modalButtonText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalButton, { backgroundColor: isDarkMode ? '#60a5fa' : '#3b82f6' }]}
                          onPress={handleSaveTime2}
                        >
                          <Text style={styles.modalButtonText}>Enregistrer</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              ) : (
                <View style={styles.timePickerContainer}>
                  <DateTimePicker
                    value={tempTime2}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={handleTimeChange2}
                  />
                </View>
              )
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  content:{
    padding: 16,
    paddingTop: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  timePickerButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timePickerButtonMotivational: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '600',
  },
  timePickerContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 