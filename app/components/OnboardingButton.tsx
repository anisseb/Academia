import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

type OnboardingButtonProps = {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function OnboardingButton({ label, icon, onPress, disabled, style }: OnboardingButtonProps) {
  const isIconOnly = icon && !label;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isIconOnly && styles.iconButton,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && (
        <Feather 
          name={icon}
          size={24} 
          color="#fff"
          style={label ? styles.iconWithLabel : undefined}
        />
      )}
      {label && (
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3b82f6',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
  },
  iconButton: {
    width: 50,
    paddingHorizontal: 0,
    backgroundColor: '#1e293b',
  },
  buttonDisabled: {
    backgroundColor: '#1e293b',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
  iconWithLabel: {
    marginRight: 8,
  },
}); 