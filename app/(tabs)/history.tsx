import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, TextInput, Alert, Animated, Keyboard } from 'react-native';
import { Mistral } from '@mistralai/mistralai';
import { Camera as CameraIcon, X } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, arrayUnion, onSnapshot, getDoc } from 'firebase/firestore';
import { db, auth, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Feather } from '@expo/vector-icons';
import { SubjectSelector } from '../components/SubjectSelector';
import { useTheme } from '../context/ThemeContext';
import { subjectsList } from '../constants/subjects';
import { getEducationLevelLabel, EducationLevel } from '../constants/education';
import { renderMathText as MathText } from '../utils/mathRenderer';
const MISTRAL_API_KEY = '5YC1BWCbnpIqsViDDsK9zBbc1NgqjwAj';

const getSubjectLabel = (subjectId: string) => {
  const subject = subjectsList.find(s => s.id === subjectId);
  return subject ? subject.label : 'Choisir matière';
};

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

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#404040' : '#e0e0e0',
    inputBackground: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    placeholder: isDarkMode ? '#808080' : '#a0a0a0',
    messageBackground: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    aiMessageBackground: isDarkMode ? '#1e293b' : '#e8f0fe'
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
            resizeMode="contain"
          />
        </View>
      )}
      {message.isAI ? (
        <FormattedMessage content={message.content} isDarkMode={isDarkMode} />
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
  );
};

export default function HistoryScreen() {
  const { threadId, imageBase64: initialImageBase64 } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(initialImageBase64 as string || null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [userClass, setUserClass] = useState<string | null>(null);
  const [userSchoolType, setUserSchoolType] = useState<EducationLevel | null>(null);
  const client = new Mistral({ apiKey: MISTRAL_API_KEY });
  const scrollViewRef = useRef<ScrollView>(null);
  const [threadTitle, setThreadTitle] = useState('');
  const { isDarkMode } = useTheme();

  const themeColors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    card: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    border: isDarkMode ? '#404040' : '#e0e0e0',
    inputBackground: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    placeholder: isDarkMode ? '#808080' : '#a0a0a0',
    messageBackground: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    aiMessageBackground: isDarkMode ? '#1e293b' : '#e8f0fe'
  };

  const uploadImage = async (base64Image: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('Aucun utilisateur connecté');
        return null;
      }

      // Convertir le base64 en blob
      const response = await fetch(base64Image);
      const blob = await response.blob();
      
      // Créer un nom de fichier unique avec l'ID du thread
      const filename = `threads/${threadId}/photos/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      // Upload le blob
      await uploadBytes(storageRef, blob);
      
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

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, async (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setUserClass(userData.profile?.class || null);
        setUserSchoolType(userData.profile?.schoolType || null);
        
        const subjects = [...(userData.profile?.subjects || [])];
        setUserSubjects(subjects);

        const currentThread = userData.threads?.[threadId as string];
        
        if (currentThread) {
          setThreadTitle(currentThread.title || 'Nouvelle conversation');
          setMessages(currentThread.messages || []);
          setSelectedSubject(currentThread.subject || null);
          setShowSubjectSelector(!currentThread.subject);
        } else {
          setMessages([]);
          setThreadTitle('Nouvelle conversation');
          setSelectedSubject(null);
        }
      }
    });

    return () => unsubscribe();
  }, [threadId]);

  useEffect(() => {
    if (initialImageBase64) {
      setSelectedImageBase64(initialImageBase64 as string);
    }
  }, [initialImageBase64]);

  const handleSubjectSelect = async (subject: string) => {
    setSelectedSubject(subject);
    setShowSubjectSelector(false);

    const user = auth.currentUser;
    if (!user || !threadId) return;

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      [`threads.${threadId}.subject`]: subject
    });
  };

  const getSystemMessage = (subject: string, hasImage: boolean = false) => {
    const classeMessage = userClass 
      ? `Pour un élève de ${userClass} , utilise un langage et des explications appropriés à son niveau.`
      : `Adapte tes réponses avec un langage simple et des explications claires.`;

    const schoolTypeMessage = userSchoolType
      ? `L'élève est dans un établissement de type ${getEducationLevelLabel(userSchoolType)}.`
      : '';

    let baseMessage = `Tu es un assistant pédagogique. ${classeMessage} ${schoolTypeMessage}`;

    if (subject === 'discussion') {
      return `${baseMessage} Sois amical et ouvert à la discussion tout en restant pédagogique. IMPORTANT: Ta réponse doit être au format JSON avec la structure suivante: {"message": "ton message", "suggestions": ["suggestion 1", "suggestion 2"]}`;
    }

    const scientificInstruction = (subject === 'maths' || subject === 'physique-chimie')
      ? 'IMPORTANT: j\'aimerais que les formules soient au format latex. Réponds uniquement en JSON valide avec le format suivant, sans texte supplémentaire.'
      : '';

    // Structure JSON différente selon que l'utilisateur envoie une image ou non
    const jsonStructure = hasImage && subject === 'maths'
      ? `IMPORTANT: les formules maths contenu dans les steps doivent être au format latex.
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
              "formulas": [
                {
                  "latex": "$\\frac{a}{b}$",
                  "description": "description de la formule"
                }
              ],
              "suggestions": ["suggestion 1", "suggestion 2"]
            }`
      : `{
              "message": "ton message principal"
            }`;

    return `${baseMessage} Dans le contexte de la matière "${subject}", je ne veux pas que tu donnes la solution aux problèmes. 
            Je veux que tu accompagnes l'élève dans la résolution du problème mais sans jamais donner la réponse. ${scientificInstruction}
            IMPORTANT: Ta réponse doit être au format JSON avec la structure suivante ${jsonStructure}
            TRÈS IMPORTANT: Ne mets pas de texte avant ou après le JSON. Ta réponse doit être UNIQUEMENT le JSON, sans aucun texte supplémentaire.`;
  };

  const callMistralAPI = async () => {
    if (!question.trim() || !threadId || !selectedSubject) return;

    try {
      setIsLoading(true);
      const currentQuestion = question;
      const currentImage = selectedImageBase64;

      setQuestion('');
      setSelectedImageBase64(null);
      Keyboard.dismiss();

      const messageId = `user_${Date.now()}`;
      
      let imageUrl = null;
      if (currentImage) {
        imageUrl = await uploadImage(currentImage);
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

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentThread = userData.threads?.[threadId as string];
        
        if (!currentThread) {
          throw new Error('Conversation non trouvée');
        }

        const updatedMessages = [...(currentThread.messages || []), userMessage];

        await updateDoc(userRef, {
          [`threads.${threadId}.messages`]: updatedMessages,
          [`threads.${threadId}.lastUpdated`]: new Date()
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
          messages: messageHistory
        });

        let aiMessageContent = "";
        let parsedResponse = null;

        try {
          // Essayer de parser la réponse comme JSON
          const responseText = typeof apiResponse.choices?.[0]?.message?.content === 'string' 
            ? apiResponse.choices[0].message.content 
            : "Pas de réponse";
          
          console.log('Réponse brute:', responseText);
          
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
            console.log('Contenu JSON extrait:', cleanedContent);
            
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

        await updateDoc(userRef, {
          [`threads.${threadId}.messages`]: [...updatedMessages, aiMessage],
          [`threads.${threadId}.lastUpdated`]: new Date()
        });
      }

    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: themeColors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SubjectSelector
        visible={showSubjectSelector}
        subjects={userSubjects}
        onSelect={handleSubjectSelect}
        onClose={() => setShowSubjectSelector(false)}
        selectedSubject={selectedSubject}
      />
      <View style={[styles.chatArea, { backgroundColor: themeColors.background }]}>
        <View style={[styles.chatHeader, { borderBottomColor: themeColors.border }]}>
          <View style={styles.chatHeaderContent}>
            <TouchableOpacity 
              style={styles.subjectButton}
              onPress={() => setShowSubjectSelector(true)}
            >
              <Text style={styles.subjectButtonText}>
                {selectedSubject ? getSubjectLabel(selectedSubject) : 'Choisir matière'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView 
          style={styles.messagesContainer}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
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

        <View style={[styles.inputContainer, { 
          backgroundColor: themeColors.background,
          borderTopColor: themeColors.border
        }]}>
          {selectedImageBase64 && (
            <View style={styles.selectedImageContainer}>
              <Image 
                source={{ uri: selectedImageBase64 }} 
                style={styles.selectedImagePreview}
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => {
                  setSelectedImageBase64(null);
                }}
              >
                <X size={20} color={themeColors.text} />
              </TouchableOpacity>
          </View>
          )}
          <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBackground }]}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              value={question}
              onChangeText={setQuestion}
              placeholder="Posez votre question..."
              placeholderTextColor={themeColors.placeholder}
              multiline
            />
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={() => {
                if (!threadId) {
                  alert('Erreur: Impossible d\'ajouter une photo. Veuillez réessayer.');
                  return;
                }
                
                router.push({
                  pathname: '/camera',
                  params: { 
                    threadId: threadId.toString()
                  }
                });
              }}
            >
              <CameraIcon color={themeColors.text} size={24} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={callMistralAPI}
            >
              <Feather name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const FormattedMessage = ({ content, isDarkMode }: { content: string, isDarkMode: boolean }) => {
  // Essayer de parser le contenu comme JSON
  console.log('content22', content);
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
      console.log('jsonmatch', jsonContent);
      
      try {
        parsedContent = JSON.parse(jsonContent.replace(/\\/g, '\\\\'));
        console.log('Contenu JSON parsé:', parsedContent);
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
    const hasStructuredContent = parsedContent.steps || parsedContent.formulas || parsedContent.suggestions;
    
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
          {parsedContent.formulas && parsedContent.formulas.length > 0 && (
            <View style={styles.formulasContainer}>
              <Text style={[styles.formulasTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Formules importantes:
              </Text>
              {parsedContent.formulas.map((formula: any, index: number) => (
                <View key={`formula-${index}`} style={styles.formulaItem}>
                  <View style={styles.mathContainer}>
                    <MathText
                      content={formula.latex}
                      isDarkMode={isDarkMode}
                      type="cours"
                    />
                  </View>
                  <Text style={[styles.formulaDescription, { color: isDarkMode ? '#fff' : '#000' }]}>
                    {formula.description}
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
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 6,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minHeight: 40,
  },
  cameraButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  sendButton: {
    backgroundColor: '#60a5fa',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingTop: 2,
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
    justifyContent: 'flex-end',
    padding: 8,
    gap: 8,
  },
  chatTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
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
  formulasContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  formulasTitle: {
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
});