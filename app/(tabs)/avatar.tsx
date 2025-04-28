import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function AvatarScreen() {

  return (
    <View style={styles.container}>
      <Text>Avatar coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});