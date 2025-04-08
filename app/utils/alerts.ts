import { Alert, Platform, AlertButton } from 'react-native';

/**
 * Affiche une alerte adaptée à la plateforme (web ou mobile)
 * @param title Titre de l'alerte
 * @param message Message de l'alerte
 * @param buttons Boutons de l'alerte (optionnel)
 * @returns void
 */
export const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
  if (Platform.OS === 'web') {
    // En version web, utiliser window.confirm
    const result = window.confirm(`${title}\n\n${message}`);
    if (result && buttons) {
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

/**
 * Affiche une alerte d'erreur avec un emoji
 * @param title Titre de l'alerte (sans emoji)
 * @param message Message de l'alerte
 * @param buttons Boutons de l'alerte (optionnel)
 * @returns void
 */
export const showErrorAlert = (title: string, message: string, buttons?: AlertButton[]) => {
  showAlert(`❌ ${title}`, message, buttons);
};

/**
 * Affiche une alerte de succès avec un emoji
 * @param title Titre de l'alerte (sans emoji)
 * @param message Message de l'alerte
 * @param buttons Boutons de l'alerte (optionnel)
 * @returns void
 */
export const showSuccessAlert = (title: string, message: string, buttons?: AlertButton[]) => {
  showAlert(`✅ ${title}`, message, buttons);
};

/**
 * Affiche une alerte d'information avec un emoji
 * @param title Titre de l'alerte (sans emoji)
 * @param message Message de l'alerte
 * @param buttons Boutons de l'alerte (optionnel)
 * @returns void
 */
export const showInfoAlert = (title: string, message: string, buttons?: AlertButton[]) => {
  showAlert(`ℹ️ ${title}`, message, buttons);
};

/**
 * Affiche une alerte de confirmation avec un emoji
 * @param title Titre de l'alerte (sans emoji)
 * @param message Message de l'alerte
 * @param onConfirm Fonction à exécuter si l'utilisateur confirme
 * @param onCancel Fonction à exécuter si l'utilisateur annule (optionnel)
 * @returns void
 */
export const showConfirmAlert = (
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel?: () => void
) => {
  const buttons: AlertButton[] = [
    { 
      text: 'Annuler', 
      style: 'cancel',
      onPress: onCancel
    },
    { 
      text: 'Confirmer', 
      style: 'default',
      onPress: onConfirm
    }
  ];
  
  showAlert(`❓ ${title}`, message, buttons);
}; 