import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Step5 from './Step5';

type OnboardingData = {
  name?: string;
  country?: string;
  schoolType?: string;
  class?: string;
  section?: string;
  subjects?: string[];
};

export default function Onboarding() {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState<OnboardingData>({});
  const router = useRouter();

  const handleNext = async (stepData: Partial<OnboardingData>) => {
    const newData = { ...data, ...stepData };
    setData(newData);

    if (step < 5) {
      setStep(step + 1);
    } else {
      // Sauvegarde des données dans Firestore
      try {
        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const dataToUpdate: Record<string, any> = {
            profile: {
              name: newData.name,
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
        return (
          <Step1
            onNext={(stepData) => handleNext(stepData)}
            data={data}
          />
        );
      case 2:
        return (
          <Step2
            onNext={(stepData) => handleNext(stepData)}
            onBack={handleBack}
            data={data}
          />
        );
      case 3:
        return (
          <Step3
            onNext={(stepData) => handleNext(stepData)}
            onBack={handleBack}
            data={data}
          />
        );
      case 4:
        if (!data.schoolType) {
          setStep(3);
          return null;
        }
        return (
          <Step4
            onNext={(stepData) => handleNext(stepData)}
            onBack={handleBack}
            data={{
              schoolType: data.schoolType,
              class: data.class,
              section: data.section,
            }}
          />
        );
      case 5:
        if (!data.schoolType || !data.class) {
          setStep(4);
          return null;
        }
        return (
          <Step5
            onNext={(stepData) => handleNext(stepData)}
            onBack={handleBack}
            data={{
              schoolType: data.schoolType,
              class: data.class,
              section: data.section,
              subjects: data.subjects,
            }}
          />
        );
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