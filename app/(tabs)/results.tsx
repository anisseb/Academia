import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';


export default function ResultsScreen() {
  const { photo } = useLocalSearchParams();




  return (
    <View style={styles.container}>
      <Text style={styles.text}>Résultats</Text>
      <Image 
        source={{ uri: photo as string }} 
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 20
  },
  uploadButton: {
    backgroundColor: '#60a5fa',
    padding: 15,
    borderRadius: 10,
    marginTop: 20
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});