const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter cette configuration pour react-native-math-view
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'ttf'];

// Ajouter ceci pour éviter le warning
config.resolver.blockList = [
  /\/node_modules\/react-native-math-view\/.*\.js/,
];

module.exports = config;
