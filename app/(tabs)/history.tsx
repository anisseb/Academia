import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Alert, Animated, Keyboard, Platform as RNPlatform, AlertButton, TouchableWithoutFeedback, Modal } from 'react-native';
import { Mistral } from '@mistralai/mistralai';
import { Camera as CameraIcon, X, Plus, Image as ImageIcon, FileText, Send } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, arrayUnion, onSnapshot, getDoc, increment } from 'firebase/firestore';
import { db, auth, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Feather } from '@expo/vector-icons';
import { SubjectSelector } from '../components/SubjectSelector';
import { useTheme } from '../context/ThemeContext';
import { renderMathText as MathText } from '../utils/mathRenderer';
import { showErrorAlert } from '../utils/alerts';
import AIProfileSelector, { AIProfile, AI_PROFILES } from '../components/AIProfileSelector';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { getSchoolTypeName, getClassName } from '../services/firestoreService';
import { format, addDays, differenceInMilliseconds, startOfDay } from 'date-fns';
import * as Clipboard from 'expo-clipboard';

type Message = {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  imageUrl?: string;
};

const Message = ({ message, isLast }: { message: Message, isLast: boolean }) => {
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(message.isAI ? -50 : 50)).current;
  const [showCopyButton, setShowCopyButton] = useState(false);

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#404040' : '#e0e0e0',
    inputBackground: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    placeholder: isDarkMode ? '#808080' : '#a0a0a0',
    messageBackground: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    aiMessageBackground: isDarkMode ? '#1e293b' : '#e8f0fe',
    tabActive: isDarkMode ? '#3b82f6' : '#2563eb'
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(message.content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCopyButton(false);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <TouchableOpacity
      onLongPress={() => {
        if (message.isAI) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCopyButton(true);
        }
      }}
      onPress={() => {
        if (message.isAI && showCopyButton) {
          setShowCopyButton(false);
        }
      }}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.messageContainer,
          message.isAI ? styles.aiMessage : styles.userMessage,
          message.isAI ? { backgroundColor: themeColors.aiMessageBackground } : { backgroundColor: themeColors.messageBackground },
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }], }
        ]}
      >
        {message.imageUrl && (
          <View style={[styles.selectedImageContainer, { backgroundColor: themeColors.messageBackground }]}>
            <Image
              source={{ uri: message.imageUrl }}
              style={styles.messageImage}
              contentFit="contain"
            />
          </View>
        )}
        {message.isAI ? (
          <View style={styles.aiMessageContent}>
            <FormattedMessage content={message.content} isDarkMode={isDarkMode} />
            {showCopyButton && (
              <TouchableOpacity 
                style={[styles.copyButton, { backgroundColor: themeColors.card }]}
                onPress={handleCopy}
              >
                <Feather name="copy" size={16} color={themeColors.text} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={[styles.messageText, { color: themeColors.text }]}>{message.content}</Text>
        )}
        {isLast && message.isAI && (
          <View style={[styles.aiIndicator, { backgroundColor: themeColors.aiMessageBackground }]}>
            <Feather name="cpu" size={16} color={themeColors.text} />
          </View>
        )}
        {isLast && !message.isAI && (
          <View style={styles.userIndicator}>
            <Feather name="check" size={16} color={themeColors.text} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(show, onShow);
    const hideSub = Keyboard.addListener(hide, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight;
}

export default function HistoryScreen() {
  const { threadId, imageUri: initialImageUri } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(initialImageUri as string || null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const client = new Mistral({ apiKey: process.env.EXPO_PUBLIC_MISTRAL_API_KEY || '' });
  const scrollViewRef = useRef<ScrollView>(null);
  const [threadTitle, setThreadTitle] = useState('');
  const { isDarkMode } = useTheme();
  const [selectedAIProfile, setSelectedAIProfile] = useState<AIProfile>('professeur');
  const [showAIProfilePicker, setShowAIProfilePicker] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [userSchoolTypeLabel, setUserSchoolTypeLabel] = useState<string>('');
  const [userClassLabel, setUserClassLabel] = useState<string>('');
  const [remainingMessages, setRemainingMessages] = useState<number>(3);
  const [nextResetTime, setNextResetTime] = useState<Date | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [messageCount, setMessageCount] = useState<number>(0);
  const keyboardHeight = useKeyboard();

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#404040' : '#e0e0e0',
    inputBackground: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    placeholder: isDarkMode ? '#808080' : '#a0a0a0',
    messageBackground: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    aiMessageBackground: isDarkMode ? '#1e293b' : '#e8f0fe',
    tabActive: isDarkMode ? '#3b82f6' : '#2563eb'
  };

  const uploadImage = async (base64Image: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Aucun utilisateur connecté');
      }

      // Vérifier que l'utilisateur est bien authentifié
      if (!user.emailVerified) {
        throw new Error('Veuillez vérifier votre email avant de continuer');
      }

      // Convertir le base64 en blob
      const response = await fetch(base64Image);
      const blob = await response.blob();
      
      // Créer un nom de fichier unique avec l'ID du thread
      const filename = `threads/${user.uid}/${threadId}/photos/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      // Upload le blob avec les métadonnées de l'utilisateur
      await uploadBytes(storageRef, blob, {
        customMetadata: {
          userId: user.uid,
          threadId: threadId as string,
          timestamp: Date.now().toString()
        }
      });
      
      // Obtenir l'URL publique
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setThreadTitle('');
      setShowSubjectSelector(false);
      setSelectedSubject(null);
      return;
    }

    const user = auth.currentUser;
    if (!user) return;
    const threadRef = doc(db, 'threads', user.uid);
    const unsubscribe = onSnapshot(threadRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const threadData = data.threads && data.threads[threadId as string];
        if (threadData) {
          setThreadTitle(threadData.title || 'Nouvelle conversation');
          setMessages(threadData.messages || []);
          setSelectedSubject(threadData.subject || null);
          setSelectedAIProfile(threadData.aiProfile || 'professeur');

          // Mettre à jour le messageCount
          const count = data.dailyMessageCount || 0;
          setMessageCount(count);
          setRemainingMessages(3 - count);

          if (!threadData.subject) {
            setShowSubjectSelector(true);
          } else {
            setShowSubjectSelector(false);
          }

          // Mettre à jour le temps de réinitialisation
          const lastMessageDate = data.lastMessageDate?.toDate();
          if (lastMessageDate) {
            const nextReset = addDays(startOfDay(lastMessageDate), 1);
            setNextResetTime(nextReset);
          } else {
            setNextResetTime(null);
          }
        } else {
          // Nouvelle conversation
          setMessages([]);
          setThreadTitle('Nouvelle conversation');
          setSelectedSubject(null);
          setSelectedAIProfile('professeur');
          setShowSubjectSelector(false);

          // Initialiser success.totalMessages si nécessaire
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.success?.totalMessages === undefined) {
              await updateDoc(userRef, {
                'success.totalMessages': 0
              });
            }
          }
        }
      } else {
        setMessages([]);
        setThreadTitle('Nouvelle conversation');
        setSelectedSubject(null);
        setSelectedAIProfile('professeur');
        setShowSubjectSelector(false);

        // Initialiser success.totalMessages si nécessaire
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.success?.totalMessages === undefined) {
            await updateDoc(userRef, {
              'success.totalMessages': 0
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [threadId]);

  useEffect(() => {
    if (initialImageUri) {
      setSelectedImageUri(initialImageUri as string);
    }
  }, [initialImageUri]);

  const handleSubjectSelect = async (subject: string) => {
    setSelectedSubject(subject);
    setShowSubjectSelector(false);

    const user = auth.currentUser;
    if (!user || !threadId) return;
    const threadRef = doc(db, 'threads', user.uid);
    await updateDoc(threadRef, {
      [`threads.${threadId}.subject`]: subject,
    });
  };

  const getSystemMessage = (subject: string, hasImage: boolean = false) => {
    const classeMessage = userClassLabel
      ? `Pour un élève de ${userClassLabel}, utilise un langage et des explications appropriés à son niveau.`
      : `Adapte tes réponses avec un langage simple et des explications claires.`;
  
    const schoolTypeMessage = userSchoolTypeLabel
      ? `L'élève est dans un établissement de type ${userSchoolTypeLabel}.`
      : '';
  
    const profileMessage = `IMPORTANT: utilise le ${AI_PROFILES[selectedAIProfile].description}`;
  
    // Ajout de l'instruction de langue
    let languageInstruction = '';
    if (subject && subject.toLowerCase() === 'anglais') {
      languageInstruction = 'IMPORTANT: Respond only in English. Do not respond in French. ne réponds pas en français.';
    } else if (subject && subject.toLowerCase() === 'espagnol') {
      languageInstruction = 'IMPORTANTE: Responder solo en español. No respondas en francés.';
    } else if (subject && subject.toLowerCase() === 'allemand') {
      languageInstruction = 'WICHTIG: Antwort nur auf Deutsch. Antworten Sie nicht auf Französisch.';
    } else if (subject && subject.toLowerCase() === 'italien') {
      languageInstruction = 'IMPORTANTE: Rispondere solo in italiano. non rispondere in francese.';
    } else if (subject && subject.toLowerCase() === 'portugais') {
      languageInstruction = 'IMPORTANTE: Responda somente em português. não responda em francês.';
    }
  
    let baseMessage = `Tu es un assistant pédagogique. ${classeMessage} ${schoolTypeMessage} ${profileMessage} ${languageInstruction}`;
  
    if (subject === 'discussion') {
      return `${baseMessage} Sois amical et ouvert à la discussion tout en restant pédagogique. IMPORTANT: Ta réponse doit être au format JSON avec la structure suivante: {"message": "ton message", "suggestions": ["suggestion 1", "suggestion 2"]}`;
    }
  
    const scientificInstruction = (subject === 'Mathématiques' || subject === 'Physique Chimie')
      ? 'IMPORTANT: j\'aimerais que les formules soient au format latex. Réponds uniquement en JSON valide avec le format suivant, sans texte supplémentaire.'
      : '';
  
    const resolutionInstruction = hasImage ? `IMPORTANT: Je veux que tu accompagnes l'élève dans la résolution du problème mais sans jamais donner la réponse.` : `IMPORTANT: Je veux que tu accompagnes l'élève`;
  
    // Structure JSON différente selon que l'utilisateur envoie une image ou non
    const jsonStructure = subject === 'Mathématiques'
      ? `IMPORTANT: les formules mathematiques doivent etre au format latex, il faut que le format soit correcte pour etre pris en compte par katex.
        IMPORTANT: les formules doivent etre au format suivant : $\\frac{a}{b}$
        IMPORTANT: les formules doivent etre entre les balises $ formule $
        {
          "message": "ton message principal",
          "steps": [
            {
              "number": 1,
              "content": "contenu de l'étape 1"
            },
            {
              "number": 2,
              "content": "contenu de l'étape 2"
            }
          ],
          "formulesImportantes": [
            {
              "latex": "$ formule $",
              "description": "description de la $formule$"
            }
          ],
          "suggestions": ["suggestion 1", "suggestion 2"]
        }`
      : `{
          "message": "ton message principal"
        }`;
  
    return `${baseMessage} Dans le contexte de la matière "${subject}", je ne veux pas que tu donnes la solution aux problèmes.
            ${resolutionInstruction} ${scientificInstruction}
            IMPORTANT: Ta réponse doit être au format JSON avec la structure suivante ${jsonStructure}
            TRÈS IMPORTANT: Ne mets pas de texte avant ou après le JSON. Ta réponse doit être UNIQUEMENT le JSON, sans aucun texte supplémentaire.`;
  };

  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const threadRef = doc(db, 'threads', user.uid);
      
      // Écouter les changements du document threads
      const unsubscribeThreads = onSnapshot(threadRef, (docSnap) => {
        if (docSnap.exists()) {
          const threadData = docSnap.data();
          if (!hasActiveSubscription) {
            const count = threadData.dailyMessageCount || 0;
            setMessageCount(count);
            setRemainingMessages(3 - count);

            // Si on a atteint la limite, on calcule le temps jusqu'à la réinitialisation
            if (count >= 3) {
              const lastMessageDate = threadData.lastMessageDate ? new Date(threadData.lastMessageDate.toDate()) : new Date();
              const nextResetDate = addDays(lastMessageDate, 1);
              setNextResetTime(nextResetDate);
            }
          }
        }
      });

      // Écouter les changements du document utilisateur
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const hasSubscription = userData.abonnement?.active === true;
          setHasActiveSubscription(hasSubscription);
        }
      });

      return () => {
        unsubscribeThreads();
        unsubscribeUser();
      };
    };

    loadUserData();
  }, []);

  const callMistralAPI = async () => {
    if (!question.trim() || !threadId || !selectedSubject) return;

    const user = auth.currentUser;
    if (!user) return;

    // Vérifier si l'utilisateur a un abonnement actif
    const threadRef = doc(db, 'threads', user.uid);
    const threadDoc = await getDoc(threadRef);
    if (!threadDoc.exists()) return;

    const threadData = threadDoc.data();
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;
    const userData = userDoc.data();
    const hasSubscription = userData.abonnement?.active === true;

    if (!hasSubscription) {
      const messageCount = threadData.dailyMessageCount || 0;
      if (messageCount >= 3) {
        showErrorAlert('Limite atteinte', 'Vous avez utilisé tous vos messages gratuits pour aujourd\'hui. Réessayez demain ou passez à Academia Réussite pour discuter en illimité.');
        return;
      }

      // Incrémenter le compteur de messages et sauvegarder la date du dernier message
      await updateDoc(threadRef, {
        dailyMessageCount: increment(1),
        lastMessageDate: new Date()
      });

      setRemainingMessages(prev => prev - 1);
    }

    try {
      setIsLoading(true);
      const currentQuestion = question;
      const currentImage = selectedImageUri;

      setQuestion('');
      setSelectedImageUri(null);
      Keyboard.dismiss();

      const messageId = `user_${Date.now()}`;
      
      let imageUrl = null;
      if (currentImage) {
        imageUrl = await uploadImage(currentImage);
        // Incrémenter cameraCount dans success de l'utilisateur
        const userDoc = await getDoc(userRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
        const currentCount = userData.success?.cameraCount || 0;
        await updateDoc(userRef, {
          'success.cameraCount': currentCount + 1
        });
      }

      const userMessage: Message = {
        id: messageId,
        content: currentQuestion,
        isAI: false,
        timestamp: new Date(),
        ...(imageUrl && { imageUrl })
      };

      const user = auth.currentUser;
      if (!user) return;
      const threadRef = doc(db, 'threads', user.uid);
      const threadDoc = await getDoc(threadRef);
      
      if (threadDoc.exists()) {
        const threadData = threadDoc.data();
        const updatedMessages = [...(threadData.threads[threadId as string].messages || []), userMessage];

        await updateDoc(threadRef, {
          [`threads.${threadId}.messages`]: updatedMessages,
          [`threads.${threadId}.lastUpdated`]: new Date(),
        });

        // Créer l'historique des messages pour l'API Mistral
        const messageHistory: any[] = [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: getSystemMessage(selectedSubject, !!imageUrl)
              }
            ]
          },
          ...updatedMessages.map((msg: {isAI: boolean, content: string, imageUrl?: string}) => ({
            role: msg.isAI ? "assistant" : "user",
            content: msg.imageUrl ? [
              { type: "text", text: msg.content },
              { type: "image_url", imageUrl: msg.imageUrl }
            ] : msg.content
          }))
        ];

        const apiResponse = await client.chat.complete({
          model: "pixtral-12b",
          messages: messageHistory,
          maxTokens: 8000,
          responseFormat: {
            type: "json_object"
          },
          temperature: 0.5,
        });

        let aiMessageContent = "";
        let parsedResponse = null;

        try {
          // Essayer de parser la réponse comme JSON
          const responseText = typeof apiResponse.choices?.[0]?.message?.content === 'string' 
            ? apiResponse.choices[0].message.content 
            : "Pas de réponse";
          
          // Rechercher un objet JSON dans la réponse
          let cleanedContent = responseText
              .replace(/```json\n/, '')
              .replace(/```$/, '')
              .trim();
          
          // Rechercher un objet JSON valide dans le contenu
          const jsonRegex = /\{[\s\S]*\}/;
          const jsonMatch = cleanedContent.match(jsonRegex);
          
          if (jsonMatch) {
            // Extraire uniquement la partie JSON
            cleanedContent = jsonMatch[0];
            
            try {
              parsedResponse = JSON.parse(cleanedContent.replace(/\\/g, '\\\\'));
              
              // Si l'utilisateur a envoyé une image, utiliser la structure complète
              if (currentImage) {
                // Construire un message formaté à partir du JSON
                aiMessageContent = responseText;
              } else {
                // Si l'utilisateur n'a pas envoyé d'image, utiliser uniquement le message
                aiMessageContent = parsedResponse.message || responseText;
              }
            } catch (parseError) {
              console.error('Erreur lors du parsing du JSON extrait:', parseError);
              // En cas d'erreur de parsing, utiliser la réponse brute
              aiMessageContent = responseText;
            }
          } else {
            // Si aucun JSON n'est trouvé, utiliser la réponse brute
            aiMessageContent = responseText;
          }
        } catch (error) {
          console.error('Erreur lors du traitement de la réponse:', error);
          // En cas d'erreur, utiliser la réponse brute
          aiMessageContent = typeof apiResponse.choices?.[0]?.message?.content === 'string' 
            ? apiResponse.choices[0].message.content 
            : "Pas de réponse";
        }

        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          content: aiMessageContent,
          isAI: true,
          timestamp: new Date(),
        };

        // Incrémenter le nombre total de messages dans le document utilisateur
        await updateDoc(userRef, {
          'success.totalMessages': increment(1)
        });

        await updateDoc(threadRef, {
          [`threads.${threadId}.messages`]: [...updatedMessages, aiMessage],
          [`threads.${threadId}.lastUpdated`]: new Date()
        });
      }

    } catch (error) {
      console.error('Erreur:', error);
      showErrorAlert('Erreur', 'Une erreur est survenue lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIProfileSelect = async (profile: AIProfile) => {
    setSelectedAIProfile(profile);
    setShowAIProfilePicker(false);

    const user = auth.currentUser;
    if (!user || !threadId) return;
    const threadRef = doc(db, 'threads', user.uid);
    await updateDoc(threadRef, {
      [`threads.${threadId}.aiProfile`]: profile
    });
  };

  const handleImagePicker = async (type: 'library' | 'camera' | 'document') => {
    try {
      if (type === 'library') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        if (!result.canceled) {
          // Vérifier que le fichier sélectionné est bien une image
          const asset = result.assets[0];
          if (asset.type && asset.type.startsWith('image')) {
            router.push({
              pathname: '/(tabs)/history',
              params: { 
                threadId: threadId as string,
                imageUri: asset.uri
              }
            });
          } else {
            showErrorAlert('Erreur', "Le fichier sélectionné n'est pas une image.");
          }
        }
      } else if (type === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          copyToCacheDirectory: true,
        });

        if (result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          // Si c'est une image, l'afficher en preview
          if (asset.mimeType && asset.mimeType.startsWith('image/')) {
            router.push({
              pathname: '/(tabs)/history',
              params: { 
                threadId: threadId as string,
                imageUri: asset.uri
              }
            });
          } else {
            showErrorAlert('Erreur', "Le fichier sélectionné n'est pas une image.");
          }
        }
      } else {
        router.push({
          pathname: '/camera',
          params: {
            threadId: threadId.toString()
          }
        });
      }
    } catch (error) {
      console.error('Error picking file:', error);
      showErrorAlert('Erreur', 'Impossible de sélectionner le fichier. Veuillez réessayer.');
    }
  };

  useEffect(() => {
    // Charger les labels de la classe et du type d'établissement
    const loadLabels = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;
      const userData = userDoc.data();
      const profile = userData.profile || {};
      if (profile.country && profile.schoolType) {
        const schoolTypeLabel = await getSchoolTypeName(profile.country, profile.schoolType);
        setUserSchoolTypeLabel(schoolTypeLabel);
      }
      if (profile.country && profile.schoolType && profile.class) {
        const classLabel = await getClassName(profile.country, profile.schoolType, profile.class);
        setUserClassLabel(classLabel);
      }
    };
    loadLabels();
  }, []);

  const formatTimeRemaining = () => {
    if (!nextResetTime) return '';
    
    const now = new Date();
    const diff = differenceInMilliseconds(nextResetTime, now);
    
    if (diff <= 0) {
      // Si le temps est écoulé, réinitialiser le compteur
      const user = auth.currentUser;
      if (user) {
        const threadRef = doc(db, 'threads', user.uid);
        updateDoc(threadRef, {
          dailyMessageCount: 0,
          lastMessageDate: null
        });
        setRemainingMessages(3);
        setNextResetTime(null);
        setMessageCount(0);
      }
      return '';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleScreenPress = () => {
    // Fermer le clavier
    Keyboard.dismiss();
    // Fermer le menu d'image s'il est ouvert
    setShowImageMenu(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: themeColors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {showImageMenu && (
        <>
          <TouchableWithoutFeedback onPress={() => setShowImageMenu(false)}>
            <View style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 1000,
            }} />
          </TouchableWithoutFeedback>
          <View style={[
            styles.menuContainer,
            {
              backgroundColor: themeColors.card,
              position: 'absolute',
              bottom: 80 + keyboardHeight,
              left: 30,
              zIndex: 1001,
            }
          ]}>
            <TouchableOpacity 
              style={styles.menuOption}
              onPress={() => {
                handleImagePicker('library');
                setShowImageMenu(false);
              }}
            >
              <ImageIcon color={themeColors.text} size={20} />
              <Text style={[styles.menuOptionText, { color: themeColors.text }]}>Bibliothèque</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuOption}
              onPress={() => {
                handleImagePicker('camera');
                setShowImageMenu(false);
              }}
            >
              <CameraIcon color={themeColors.text} size={20} />
              <Text style={[styles.menuOptionText, { color: themeColors.text }]}>Appareil photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuOption}
              onPress={() => {
                handleImagePicker('document');
                setShowImageMenu(false);
              }}
            >
              <FileText color={themeColors.text} size={20} />
              <Text style={[styles.menuOptionText, { color: themeColors.text }]}>Document</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <SubjectSelector
        visible={showSubjectSelector}
        onSelect={handleSubjectSelect}
        onClose={() => setShowSubjectSelector(false)}
        selectedSubject={selectedSubject}
      />
      <AIProfileSelector
        visible={showAIProfilePicker}
        onSelect={handleAIProfileSelect}
        onClose={() => setShowAIProfilePicker(false)}
        selectedProfile={selectedAIProfile}
        themeColors={themeColors}
      />
      <View style={[styles.chatArea, { backgroundColor: themeColors.background }]}>
        <View style={[styles.chatHeader, { borderBottomColor: themeColors.border }]}>
          <View style={styles.chatHeaderContent}>
            <TouchableOpacity 
              style={styles.subjectButton}
              onPress={() => setShowSubjectSelector(true)}
            >
              <Text style={styles.subjectButtonText}>
                {selectedSubject ? selectedSubject : 'Choisir matière'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.profileIAButton}
              onPress={() => setShowAIProfilePicker(true)}
            >
              <View style={styles.profileContainer}>
                <Image 
                  source={AI_PROFILES[selectedAIProfile].image} 
                  style={styles.profileImage}
                  cachePolicy="memory-disk"
                />

              </View>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView 
          style={styles.messagesContainer}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => {
            Keyboard.dismiss();
          }}
        >
          {messages.map((message, index) => (
            <Message 
              key={message.id} 
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}
          {isLoading && (
            <View style={[styles.messageContainer, styles.aiMessage, { backgroundColor: themeColors.aiMessageBackground }]}>
              <TypingIndicator textColor={themeColors.text} />
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
          {(hasActiveSubscription || messageCount < 3) && (
            <>
              <View style={styles.inputContent}>
                {selectedImageUri && (
                  <View style={styles.selectedImageContainer}>
                    <Image 
                      source={{ uri: selectedImageUri }} 
                      style={styles.selectedImagePreview}
                    />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => {
                        setSelectedImageUri(null);
                      }}
                    >
                      <X size={20} color={themeColors.text} />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBackground }]}>
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="Écris ton message..."
                    placeholderTextColor={themeColors.text + '80'}
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                  />
                </View>
              </View>

              <View style={styles.footerButtons}>
                <TouchableOpacity 
                  style={styles.plusButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowImageMenu(!showImageMenu)
                  }}
                  disabled={!hasActiveSubscription && remainingMessages === 0}
                >
                  <Plus color={!hasActiveSubscription && remainingMessages === 0 ? themeColors.placeholder : themeColors.text} size={24} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.sendButton, 
                    (!question.trim() || (!hasActiveSubscription && remainingMessages === 0)) && { opacity: 0.5 }
                  ]}
                  onPress={callMistralAPI}
                  disabled={!question.trim() || (!hasActiveSubscription && remainingMessages === 0)}
                >
                  <Send 
                    color={
                      !question.trim() || (!hasActiveSubscription && remainingMessages === 0) 
                        ? themeColors.placeholder 
                        : '#60a5fa'
                    } 
                    size={24} 
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
          {!hasActiveSubscription && (
            <View style={[styles.messageLimitContainer, { backgroundColor: themeColors.inputBackground }]}>
              {messageCount < 3 ? (
                <Text style={[styles.messageLimitText, { color: themeColors.text }]}>
                  Messages restants aujourd'hui : {3 - messageCount}
                </Text>
              ) : (
                <View style={styles.limitReachedContainer}>
                  <Text style={[styles.limitReachedText, { color: themeColors.text }]}>
                    Vous avez utilisé tous vos messages gratuits pour aujourd'hui
                  </Text>
                  <Text style={[styles.resetTimeText, { color: themeColors.text }]}>
                    Réinitialisation dans {formatTimeRemaining()}
                  </Text>
                  <TouchableOpacity 
                    style={styles.upgradeButton}
                    onPress={() => router.push('/settings/subscriptions')}
                  >
                    <Text style={styles.upgradeButtonText}>
                      Passer à Academia Réussite pour discuter en illimité
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const FormattedMessage = ({ content, isDarkMode }: { content: string, isDarkMode: boolean }) => {
  // Essayer de parser le contenu comme JSON
  let parsedContent = null;
  try {
    // Rechercher un objet JSON dans le contenu
    const cleanedContent = content
      .replace(/```json\n/, '')
      .replace(/```$/, '')
      .trim();
    
    // Rechercher un objet JSON valide dans le contenu
    const jsonRegex = /\{[\s\S]*\}/;
    const jsonMatch = cleanedContent.match(jsonRegex);
    
    if (jsonMatch) {
      // Extraire uniquement la partie JSON
      const jsonContent = jsonMatch[0];
      
      try {
        parsedContent = JSON.parse(jsonContent.replace(/\\/g, '\\\\'));
      } catch (parseError) {
        console.error('Erreur lors du parsing du JSON extrait:', parseError);
      }
    }
  } catch (error) {
    console.error('Erreur lors du traitement du contenu:', error);
  }

  // Si le contenu est un JSON valide, l'utiliser directement
  if (parsedContent) {
    // Vérifier si le message contient des étapes, des formules ou des suggestions
    const hasStructuredContent = parsedContent.steps || parsedContent.formulesImportantes || parsedContent.suggestions;
    
    if (hasStructuredContent) {
      return (
        <View style={styles.formattedMessage}>
          {/* Message principal */}
          {parsedContent.message && (
            <View style={styles.messageRegularText}>
              <MathText
                content={parsedContent.message}
                isDarkMode={isDarkMode}
                type="cours"
              />
            </View>
          )}

          {/* Étapes */}
          {parsedContent.steps && parsedContent.steps.length > 0 && (
            <View style={styles.stepsContainer}>
              {parsedContent.steps.map((step: any, index: number) => (
                <View key={`step-${index}`} style={styles.messageStepContainer}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.number}</Text>
                  </View>
                  <MathText
                    content={step.content}
                    isDarkMode={isDarkMode}
                    type="cours"
                  />
                </View>
              ))}
            </View>
          )}

          {/* Formules */}
          {parsedContent.formulesImportantes && parsedContent.formulesImportantes.length > 0 && (
            <View style={styles.formulesImportantesContainer}>
              <Text style={[styles.formulesImportantesTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Formules importantes:
              </Text>
              {parsedContent.formulesImportantes.map((formula: any, index: number) => (
                <View key={`formula-${index}`} style={styles.formulaItem}>
                  <View style={styles.mathContainer}>
                    <MathText
                      content={formula.latex}
                      isDarkMode={isDarkMode}
                      type="cours"
                    />
                  </View>
                  <Text style={[styles.formulaDescription, { color: isDarkMode ? '#fff' : '#000' }]}>
                    <MathText
                        content={formula.description}
                        isDarkMode={isDarkMode}
                        type="cours"
                      />
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Suggestions */}
          {parsedContent.suggestions && parsedContent.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Suggestions pour la suite:
              </Text>
              {parsedContent.suggestions.map((suggestion: string, index: number) => (
                <View key={`suggestion-${index}`} style={styles.suggestionItem}>
                  <Text style={[styles.suggestionText, { color: isDarkMode ? '#fff' : '#000' }]}>
                    • {suggestion}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    } else {
      // Si le message ne contient que le champ "message", l'afficher simplement
      return (
        <View style={styles.formattedMessage}>
          <MathText content={parsedContent.message || content} isDarkMode={isDarkMode} type="cours" />
        </View>
      );
    }
  }

  // Si le contenu n'est pas un JSON valide, afficher le texte brut
  return (
    <View style={styles.formattedMessage}>
      <MathText content={content} isDarkMode={isDarkMode} type="cours" />
    </View>
  );
};

const TypingIndicator = ({ textColor }: { textColor: string }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.typingContainer}>
      <Text style={[styles.typingText, { color: textColor }]}>En train d'écrire{dots}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  messageContainer: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 20,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userMessage: {
    backgroundColor: '#60a5fa',
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
    marginLeft: '20%',
  },
  aiMessage: {
    backgroundColor: '#2d2d2d',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
    marginRight: '20%',
    marginBottom: 20,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  inputContainer: {
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderRadius: 16,
    margin: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    gap: 8,
    marginBottom: 8,
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedImagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    padding: 8,
    backgroundColor: '#2d2d2d',
  },
  input: {
    width: '100%',
    fontSize: 16,
    minHeight: 50,
    maxHeight: 200,
    textAlignVertical: 'top',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  plusButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 60,
    left: 30,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  newThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 2,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  newThreadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  threadsList: {
    marginTop: 10,
  },
  activeThreadItem: {
    backgroundColor: '#2d2d2d',
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 2,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  threadTitle: {
    color: '#fff',
    marginLeft: 10,
  },
  chatHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  chatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    width: '100%',
  },
  chatTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  formattedMessage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  paragraph: {
    flexDirection: 'column',
    gap: 4,
  },
  codeBlock: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  codeText: {
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  mathFormula: {
    color: '#fff',
    fontSize: 16,
    fontStyle: 'italic',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  boldText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  regularText: {
    color: '#fff',
    fontSize: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  listNumber: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  listText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  stepContainer: {
    marginVertical: 4,
    paddingLeft: 16,
  },
  stepText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  typingText: {
    color: '#fff',
    fontSize: 16,
  },
  aiIndicator: {
    position: 'absolute',
    bottom: -15,
    left: 0,
    backgroundColor: '#2d2d2d',
    padding: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  userIndicator: {
    position: 'absolute',
    bottom: -10,
    right: 0,
    backgroundColor: '#60a5fa',
    padding: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  mathContainer: {
    backgroundColor: '#363636',
    padding: 8,
    borderRadius: 8,
  },
  mathText: {
    color: '#60a5fa',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  titleContainer: {
    backgroundColor: '#363636',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 4,
    borderColor: '#60a5fa',
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleNumber: {
    backgroundColor: '#60a5fa',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  exerciseContainer: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 4,
    borderColor: '#60a5fa',
    alignItems: 'center',
  },
  exerciseText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  messageStepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    width: '90%',
    borderRadius: 8,
  },
  messageStepText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  messageRegularText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 4,
  },
  oldStepText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  oldRegularText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 4,
  },
  stepNumber: {
    backgroundColor: '#60a5fa',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subjectButton: {
    backgroundColor: '#60a5fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexShrink: 0,
  },
  subjectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  stepsContainer: {
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    padding: 10,
  },
  formulesImportantesContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  formulesImportantesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formulaItem: {
    marginBottom: 8,
  },
  formulaDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  suggestionItem: {
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(235, 230, 230, 0.95)',
  },
  profileIAButton: {
    borderRadius: 16,
  },
  profileIAButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  messageLimitContainer: {
    width: '100%',
    marginTop: 10,
  },
  messageLimitText: {
    fontSize: 10,
    textAlign: 'right',
    fontWeight: '500',
  },
  limitReachedContainer: {
    alignItems: 'center',
    gap: 8,
  },
  limitReachedText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  resetTimeText: {
    fontSize: 12,
    opacity: 0.8,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  aiMessageContent: {
    position: 'relative',
    width: '100%',
  },
  copyButton: {
    position: 'absolute',
    top: -15,
    right: -15,
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

