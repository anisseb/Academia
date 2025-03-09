import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.text}>This screen doesn't exist.</Text>
        <View style={styles.buttonContainer}>
          <Link href="/" style={styles.link}>
            <Text>Go to home screen!</Text>
          </Link>
          <Link href="/camera" style={styles.link}>
            <Text>Go to camera!</Text>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 600,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
    paddingBottom: 20,
  },
  link: {
    paddingVertical: 15,
  },
});
