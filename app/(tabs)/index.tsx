import { View, Text, StyleSheet, Image } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500' }}
          style={styles.headerImage}
        />
        <Text style={styles.title}>Math Helper AI</Text>
        <Text style={styles.subtitle}>
          Scan your math problems and get instant help
        </Text>
      </View>

      <Link href="/camera" style={styles.button}>
        <Text style={styles.buttonText}>Start Scanning</Text>
      </Link>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>How it works</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureNumber}>1</Text>
          <Text style={styles.featureText}>Take a photo of your math problem</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureNumber}>2</Text>
          <Text style={styles.featureText}>Our AI extracts the text</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureNumber}>3</Text>
          <Text style={styles.featureText}>Get detailed explanations and solutions</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#60a5fa',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  features: {
    padding: 20,
    marginTop: 40,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureNumber: {
    backgroundColor: '#60a5fa',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 12,
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
});