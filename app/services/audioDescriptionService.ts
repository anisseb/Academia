import { speak, stop } from 'expo-speech';

type AudioStateChangeCallback = (isPlaying: boolean) => void;

export class AudioDescriptionService {
  private static instance: AudioDescriptionService;
  private isEnabled: boolean = false;
  private isPlaying: boolean = false;
  private voiceType: 'default' | 'male' | 'female' | 'slow' = 'default';
  private stateChangeCallbacks: AudioStateChangeCallback[] = [];

  private constructor() {}

  public static getInstance(): AudioDescriptionService {
    if (!AudioDescriptionService.instance) {
      AudioDescriptionService.instance = new AudioDescriptionService();
    }
    return AudioDescriptionService.instance;
  }

  public addStateChangeListener(callback: AudioStateChangeCallback) {
    this.stateChangeCallbacks.push(callback);
  }

  public removeStateChangeListener(callback: AudioStateChangeCallback) {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  private notifyStateChange() {
    this.stateChangeCallbacks.forEach(callback => callback(this.isPlaying));
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public setVoiceType(voiceType: 'default' | 'male' | 'female' | 'slow') {
    this.voiceType = voiceType;
  }

  public isAudioDescriptionEnabled(): boolean {
    return this.isEnabled;
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  public async previewVoice(voiceType: 'default' | 'male' | 'female' | 'slow') {
    try {
      const previewText = "Bonjour, je suis votre assistant personnel, je suis là pour vous accompagner.";
      
      await speak(previewText, {
        language: 'fr-FR',
        pitch: this.getVoicePitchForType(voiceType),
        rate: this.getVoiceRateForType(voiceType),
        onDone: () => {
          // Prévisualisation terminée
        },
        onError: (error: any) => {
          console.error('Erreur lors de la prévisualisation audio:', error);
        }
      });
    } catch (error) {
      console.error('Erreur lors de la prévisualisation audio:', error);
    }
  }

  public async playCourseDescription(courseTitle: string, content: string, subjectLabel: string) {
    if (!this.isEnabled || this.isPlaying) return;

    try {
      this.isPlaying = true;
      this.notifyStateChange();

      console.log('subjectLabel', subjectLabel);
      
      // Détecter la langue en fonction du subjectLabel
      const isEnglishSubject = subjectLabel.toLowerCase().includes('anglais') || 
                              subjectLabel.toLowerCase().includes('english');
      const language = isEnglishSubject ? 'en-US' : 'fr-FR';
      
      // Créer une description audio du cours
      const description = this.createAudioDescription(courseTitle, content);
      
      // Lire la description avec les paramètres de voix
      await speak(description, {
        language: language,
        pitch: this.getVoicePitch(),
        rate: this.getVoiceRate(),
        onDone: () => {
          this.isPlaying = false;
          this.notifyStateChange();
        },
        onError: (error: any) => {
          console.error('Erreur lors de la lecture audio:', error);
          this.isPlaying = false;
          this.notifyStateChange();
        }
      });
    } catch (error) {
      console.error('Erreur lors de la lecture audio:', error);
      this.isPlaying = false;
      this.notifyStateChange();
    }
  }

  public async playSectionDescription(sectionTitle: string, content: string, subjectLabel: string) {
    if (!this.isEnabled || this.isPlaying) return;

    try {
      this.isPlaying = true;
      this.notifyStateChange();
      console.log('subjectLabel', subjectLabel);
      
      // Détecter la langue en fonction du subjectLabel
      const isEnglishSubject = subjectLabel.toLowerCase().includes('anglais') || 
                              subjectLabel.toLowerCase().includes('english');
      const language = isEnglishSubject ? 'en-US' : 'fr-FR';
      
      const description = `Section ${sectionTitle}. ${this.cleanTextForSpeech(content)}`;
      
      await speak(description, {
        language: language,
        pitch: this.getVoicePitch(),
        rate: this.getVoiceRate(),
        onDone: () => {
          this.isPlaying = false;
          this.notifyStateChange();
        },
        onError: (error: any) => {
          console.error('Erreur lors de la lecture audio:', error);
          this.isPlaying = false;
          this.notifyStateChange();
        }
      });
    } catch (error) {
      console.error('Erreur lors de la lecture audio:', error);
      this.isPlaying = false;
      this.notifyStateChange();
    }
  }

  public async playExampleDescription(example: string, subjectLabel: string) {
    if (!this.isEnabled || this.isPlaying) return;

    try {
      this.isPlaying = true;
      this.notifyStateChange();
      console.log('subjectLabel', subjectLabel);
      
      // Détecter la langue en fonction du subjectLabel
      const isEnglishSubject = subjectLabel.toLowerCase().includes('anglais') || 
                              subjectLabel.toLowerCase().includes('english');
      const language = isEnglishSubject ? 'en-US' : 'fr-FR';
      
      const description = `Exemple : ${this.cleanTextForSpeech(example)}`;
      
      await speak(description, {
        language: language,
        pitch: this.getVoicePitch(),
        rate: this.getVoiceRate(),
        onDone: () => {
          this.isPlaying = false;
          this.notifyStateChange();
        },
        onError: (error: any) => {
          console.error('Erreur lors de la lecture audio:', error);
          this.isPlaying = false;
          this.notifyStateChange();
        }
      });
    } catch (error) {
      console.error('Erreur lors de la lecture audio:', error);
      this.isPlaying = false;
      this.notifyStateChange();
    }
  }

  public stopAudio() {
    stop();
    this.isPlaying = false;
    this.notifyStateChange();
  }

  private getVoicePitch(): number {
    return this.getVoicePitchForType(this.voiceType);
  }

  private getVoiceRate(): number {
    return this.getVoiceRateForType(this.voiceType);
  }

  private getVoicePitchForType(voiceType: 'default' | 'male' | 'female' | 'slow'): number {
    switch (voiceType) {
      case 'male': return 0.8;
      case 'female': return 1.5;
      case 'slow': return 0.9;
      default: return 1.0;
    }
  }

  private getVoiceRateForType(voiceType: 'default' | 'male' | 'female' | 'slow'): number {
    switch (voiceType) {
      case 'slow': return 0.6;
      default: return 0.8;
    }
  }

  private createAudioDescription(title: string, content: string): string {
    // Nettoyer le contenu pour la lecture audio
    const cleanContent = this.cleanTextForSpeech(content);
    
    return `Cours : ${title}. ${cleanContent}`;
  }

  private cleanTextForSpeech(text: string): string {
    return text
      // Supprimer les balises HTML
      .replace(/<[^>]*>/g, '')
      // Remplacer les formules mathématiques par des descriptions
      .replace(/\\\((.*?)\\\)/g, (match, formula) => {
        return this.describeMathFormula(formula);
      })
      .replace(/\$(.*?)\$/g, (match, formula) => {
        return this.describeMathFormula(formula);
      })
      // Nettoyer les espaces multiples
      .replace(/\s+/g, ' ')
      .trim();
  }

  private describeMathFormula(formula: string): string {
    // Description simple des formules mathématiques courantes
    const descriptions: { [key: string]: string } = {
      '\\frac': 'fraction',
      '\\sqrt': 'racine carrée',
      '\\pi': 'pi',
      '\\alpha': 'alpha',
      '\\beta': 'beta',
      '\\gamma': 'gamma',
      '\\delta': 'delta',
      '\\theta': 'thêta',
      '\\lambda': 'lambda',
      '\\mu': 'mu',
      '\\sigma': 'sigma',
      '\\omega': 'oméga',
      '\\infty': 'infini',
      '\\sum': 'somme',
      '\\int': 'intégrale',
      '\\lim': 'limite',
      '\\sin': 'sinus',
      '\\cos': 'cosinus',
      '\\tan': 'tangente',
      '\\log': 'logarithme',
      '\\ln': 'logarithme naturel',
      '\\exp': 'exponentielle',
      '\\times': 'fois',
      '\\div': 'divisé par',
      '\\pm': 'plus ou moins',
      '\\mp': 'moins ou plus',
      '\\leq': 'inférieur ou égal',
      '\\geq': 'supérieur ou égal',
      '\\neq': 'différent de',
      '\\approx': 'environ égal',
      '\\equiv': 'équivalent',
      '\\propto': 'proportionnel à',
      '\\rightarrow': 'tend vers',
      '\\leftarrow': 'tend vers',
      '\\leftrightarrow': 'équivaut à',
      '\\Rightarrow': 'implique',
      '\\Leftarrow': 'impliqué par',
      '\\Leftrightarrow': 'équivaut à',
      '\\forall': 'pour tout',
      '\\exists': 'il existe',
      '\\in': 'appartient à',
      '\\notin': 'n\'appartient pas à',
      '\\subset': 'inclus dans',
      '\\supset': 'contient',
      '\\cup': 'union',
      '\\cap': 'intersection',
      '\\emptyset': 'ensemble vide',
      '\\mathbb{R}': 'ensemble des réels',
      '\\mathbb{N}': 'ensemble des entiers naturels',
      '\\mathbb{Z}': 'ensemble des entiers relatifs',
      '\\mathbb{Q}': 'ensemble des rationnels',
      '\\mathbb{C}': 'ensemble des complexes'
    };

    let description = formula;
    
    // Remplacer les commandes LaTeX par leurs descriptions
    Object.entries(descriptions).forEach(([command, desc]) => {
      description = description.replace(new RegExp(command.replace(/\\/g, '\\\\'), 'g'), desc);
    });

    return `formule mathématique : ${description}`;
  }
}

export const audioDescriptionService = AudioDescriptionService.getInstance(); 