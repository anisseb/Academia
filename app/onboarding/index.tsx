import React, { useEffect }  from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Step5 from './Step5';
import Step6 from './Step6';
import Step7 from './Step7';
import { onAuthStateChanged } from 'firebase/auth';


type OnboardingData = {
  name?: string;
  username?: string;
  country?: string;
  schoolType?: string;
  class?: string;
  section?: string;
  subjects?: Array<{ id: string; label: string }>;
};

export default function Onboarding() {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState<OnboardingData>({});
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (userData?.profile?.onboardingCompleted) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'onboarding:", error);
        router.replace('/auth');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleNext = async (stepData: Partial<OnboardingData>) => {
    const newData = { ...data, ...stepData };
    setData(newData);

    if (step < 7) {
      setStep(step + 1);
    } else {
      // Sauvegarde des données dans Firestore
      try {
        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const dataToUpdate: Record<string, any> = {
            profile: {
              name: newData.name,
              username: newData.username,
              country: newData.country,
              schoolType: newData.schoolType,
              class: newData.class,
              subjects: newData.subjects,
              onboardingCompleted: true,
            },
          };
          
          // Ajouter section seulement si elle existe
          if (newData.section) {
            dataToUpdate.profile.section = newData.section;
          }
          
          await updateDoc(userRef, dataToUpdate);
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des données :', error);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 onNext={handleNext} data={{ name: data.name}} />;
      case 2:
        return <Step2 onNext={handleNext} onBack={handleBack} data={{ name: data.name, username: data.username }} />;
      case 3:
        return <Step3 onNext={handleNext} onBack={handleBack} data={{ name: data.name, username: data.username, country: data.country }} />;
      case 4:
        return <Step4 onNext={handleNext} onBack={handleBack} data={{ name: data.name, username: data.username, country: data.country, schoolType: data.schoolType }} />;
      case 5:
        if (!data.schoolType) {
          setStep(5);
          return null;
        }
        return <Step5 onNext={handleNext} onBack={handleBack} data={{ name: data.name, username: data.username, country: data.country, schoolType: data.schoolType, class: data.class }} />;
      case 6:
        if (!data.schoolType || !data.class) {
          setStep(6);
          return null;
        }
        return <Step6 onNext={handleNext} onBack={handleBack} data={{ name: data.name, username: data.username, country: data.country, schoolType: data.schoolType, class: data.class}} />;
      case 7:
        if (!data.schoolType || !data.class || !data.subjects) {
          setStep(7);
          return null;
        }
        return <Step7 onNext={handleNext} onBack={handleBack} data={{ name: data.name, username: data.username, country: data.country, schoolType: data.schoolType, class: data.class, subjects: data.subjects }} />;
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderStep()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
}); 