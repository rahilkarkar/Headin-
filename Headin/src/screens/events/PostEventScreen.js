import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

export default function PostEventScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Post Event Screen Works!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  text: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
});